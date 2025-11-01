// app/lib/contract.ts
import { ethers } from "ethers";
import abi from "../abi/SolitaireCheckin.json";

export const CHECKIN_ABI = abi;
// 🔐 Checksum denetimini bypass etmek için tamamen lowercase yaz
export const CHECKIN_CONTRACT = process.env.NEXT_PUBLIC_CHECKIN_CONTRACT!;

const BASE_CHAIN_ID_HEX = "0x2105"; // 8453

export async function getUserContract() {
  // 1) Farcaster miniapp provider'ı dene; yoksa window.ethereum
  let eth: any = null;
  try {
    const sdk = (await import("@farcaster/miniapp-sdk")).default;
    eth = await sdk.wallet.getEthereumProvider();
  } catch (_) { /* yoksa sessiz geç */ }

  if (!eth && (window as any).ethereum) eth = (window as any).ethereum;
  if (!eth) throw new Error("No wallet provider found");

  const provider = new ethers.BrowserProvider(eth);

  // 2) Ağı Base'e zorla (gerekirse addChain)
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: BASE_CHAIN_ID_HEX }]);
  } catch (e: any) {
    if (e?.code === 4902) {
      await provider.send("wallet_addEthereumChain", [{
        chainId: BASE_CHAIN_ID_HEX,
        chainName: "Base",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
      }]);
      await provider.send("wallet_switchEthereumChain", [{ chainId: BASE_CHAIN_ID_HEX }]);
    }
  }

  const signer = await provider.getSigner();

  // 3) Kontratı checksum'a takılmadan oluştur (addr lowercase)
  const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, signer);
  return { provider, signer, contract };
}
