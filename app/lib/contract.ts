// app/lib/contract.ts
import { ethers } from "ethers";
import abi from "../abi/SolitaireCheckin.json"; // ✅ abi dosyan burada olmalı (app/abi/... altında)

// ✅ Base Mainnet RPC ve sponsor wallet bilgileri .env.local’da tutulur
const rpcUrl = process.env.BASE_RPC!;
const privateKey = process.env.PRIVATE_KEY!;

// 🔹 Sağlam provider + signer
export const provider = new ethers.JsonRpcProvider(rpcUrl);
export const signer = new ethers.Wallet(privateKey, provider);

// 🔹 Kontrat bilgileri
export const CHECKIN_CONTRACT = "0x2412e539F5773Feb1F6f9BB7d1415F06b25d2AB6";
export const CHECKIN_ABI = abi;

// 🔹 Reusable contract instance
export const contract = new ethers.Contract(CHECKIN_CONTRACT, abi, signer);

// ✅ Helper: direkt bir fonksiyonla kontrat çağrısı örneği
export async function recordWinFor(playerAddress: string, points: number) {
  if (!ethers.isAddress(playerAddress)) throw new Error("Invalid address");
  const tx = await contract.recordWinFor(playerAddress, points);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
