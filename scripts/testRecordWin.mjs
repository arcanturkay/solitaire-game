import 'dotenv/config';
import { ethers } from "ethers";

async function main() {
  // RPC + Private key kontrol
  if (!process.env.BASE_RPC || !process.env.PRIVATE_KEY) {
    throw new Error("❌ BASE_RPC veya PRIVATE_KEY .env içinde tanımlı değil!");
  }

  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("🧾 Using wallet:", wallet.address);

  const contract = new ethers.Contract(
    "0xF4dD331d4B34CB37264f20ac6F16b03ec3e4B911", // contract address
    [
      {
        "inputs": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "uint256", "name": "score", "type": "uint256" }
        ],
        "name": "recordWinFor",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    wallet // signer zaten bağlı
  );

  const player = wallet.address;
  const score = 100;

  console.log("⏳ Sending recordWinFor...");
  const tx = await contract.recordWinFor(player, score);
  console.log("📦 Tx hash:", tx.hash);
  const rc = await tx.wait();
  console.log("✅ Confirmed:", rc.transactionHash);
}

main().catch((err) => {
  console.error("💥 Error:", err.message);
});
