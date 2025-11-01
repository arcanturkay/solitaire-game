import { ethers } from "ethers";
import abi from "../abi/SolitaireCheckin.json";

// 🎯 Sabit kontrat bilgisi
export const CHECKIN_CONTRACT = "0xF4dD331d4B34CB37264F20ac6F16b03ec3e4B911";
export const CHECKIN_ABI = abi;

/**
 * 🔹 getUserContract()
 * Kullanıcının aktif wallet provider'ını (Farcaster / Metamask / Rabby / Rainbow) otomatik bulur
 * ve signer + contract objesini döndürür.
 */
export async function getUserContract() {
  let ethProvider: any = null;

  // 🔍 1. Farcaster MiniApp ortamıysa, global Farcaster provider'ı al
  if (typeof window !== "undefined" && (window as any).farcaster?.wallet) {
    ethProvider = (window as any).farcaster.wallet.getEthereumProvider();
  }

  // 🔍 2. Eğer Farcaster provider yoksa, standart window.ethereum (Metamask / Rabby) dene
  if (!ethProvider && typeof window !== "undefined" && (window as any).ethereum) {
    ethProvider = (window as any).ethereum;
  }

  // 🔍 3. Hâlâ provider bulunamadıysa hata ver
  if (!ethProvider) {
    throw new Error("No wallet provider found (Farcaster or External)");
  }

  // 🔗 4. BrowserProvider + signer oluştur
  const provider = new ethers.BrowserProvider(ethProvider);
  const signer = await provider.getSigner();

  // 🔢 5. Network ID'yi logla (debug için)
  const network = await provider.getNetwork();
  console.log(`🔗 Connected network: ${network.name} (${network.chainId})`);

  // 🧩 6. Contract instance oluştur
  const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, signer);

  return { provider, signer, contract };
}
