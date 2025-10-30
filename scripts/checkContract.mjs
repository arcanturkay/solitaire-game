import 'dotenv/config';
import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC);
  const contract = new ethers.Contract(
    process.env.CHECKIN_CONTRACT,
    ["function owner() view returns (address)"],
    provider
  );
  const owner = await contract.owner();
  console.log("🔍 Contract:", process.env.CHECKIN_CONTRACT);
  console.log("👑 Owner:", owner);
}

main().catch(console.error);
