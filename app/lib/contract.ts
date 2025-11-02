// app/lib/contract.ts
import { ethers } from "ethers";
import ABI from "../abi/SolitaireCheckin.json";
export const CHECKIN_ABI = ABI

// ✅ .env / Vercel
export const CHECKIN_CONTRACT =
  process.env.NEXT_PUBLIC_CHECKIN_CONTRACT ??
  "0xe0ac155B24141D277ad0017169c94530d7a166c5";

// Base chain params (8453)
const BASE_PARAMS = {
  chainId: "0x2105", // 8453
  chainName: "Base",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://mainnet.base.org"],
  blockExplorerUrls: ["https://basescan.org"]
};

export async function getUserContract() {
  // 1) Provider al (Metamask -> Farcaster MiniApp fallback)
  let eth: any =
    (globalThis as any).ethereum ??
    (await import("@farcaster/miniapp-sdk")
      .then((sdk) => sdk.default.wallet.getEthereumProvider())
      .catch(() => null));

  if (!eth) throw new Error("No wallet provider found");

  // 2) Hesap iste
  await eth.request?.({ method: "eth_requestAccounts" });

  // 3) Ağ kontrolü ve gerekirse switch/add
  try {
    const cur = await eth.request({ method: "eth_chainId" });
    if (cur?.toLowerCase() !== BASE_PARAMS.chainId) {
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_PARAMS.chainId }]
        });
      } catch (e: any) {
        if (e?.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [BASE_PARAMS]
          });
        } else {
          throw e;
        }
      }
    }
  } catch (e) {
    // sessiz geç; bazı cüzdanlar izin vermez
  }

  // 4) BrowserProvider/signer/contract
  const provider = new ethers.BrowserProvider(eth);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CHECKIN_CONTRACT, ABI as any, signer);

  return { provider, signer, contract };
}
