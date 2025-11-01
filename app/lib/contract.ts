// app/lib/contract.ts
import { ethers } from "ethers";
import abi from "../abi/SolitaireCheckin.json";

// ✅ Base Mainnet adresi (herkes için sabit)
export const CHECKIN_CONTRACT = "0xF4dD331d4B34CB37264F20ac6F16b03ec3e4B911";
export const CHECKIN_ABI = abi;

// ✅ Helper: client tarafında provider/signer oluştur
export async function getUserContract() {
  // Farcaster MiniApp veya Metamask provider al
  const eth =
    (window as any).ethereum ||
    (await import("@farcaster/miniapp-sdk")
      .then((sdk) => sdk.default.wallet.getEthereumProvider())
      .catch(() => null));

  if (!eth) throw new Error("No wallet provider found");

  // BrowserProvider ile signer oluştur
  const provider = new ethers.BrowserProvider(eth, 8453);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CHECKIN_CONTRACT, abi, signer);
  return { provider, signer, contract };
}
