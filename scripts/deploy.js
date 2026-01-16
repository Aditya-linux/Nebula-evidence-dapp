const hre = require("hardhat");

async function main() {
  // 1. Get the account wrapper that Hardhat is using
  const [deployer] = await hre.ethers.getSigners();

  // 2. PRINT DEBUG INFO
  // This will tell us exactly which wallet address Hardhat is trying to use
  console.log("----------------------------------------------------");
  console.log("🕵️ DEBUGGING WALLET INFO:");
  console.log("Deploying with account:", deployer.address);
  
  // Check the balance of that specific address
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance (Wei):", balance.toString());
  console.log("----------------------------------------------------");

  console.log("Deploying Evidence contract...");

  // 3. Deploy the contract
  const evidenceContract = await hre.ethers.deployContract("Evidence");

  await evidenceContract.waitForDeployment();

  const contractAddress = await evidenceContract.getAddress();
  console.log(`Evidence contract deployed to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});