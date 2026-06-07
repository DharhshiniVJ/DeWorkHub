import { ethers } from "hardhat";

async function main() {
  const oneHour = 3600;
  
  // Fast forward network time by 1 hour
  await ethers.provider.send("evm_increaseTime", [oneHour]);
  // Mine a new block to apply the time change
  await ethers.provider.send("evm_mine", []);

  console.log("⏰ Blockchain time fast-forwarded by 1 hour.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
