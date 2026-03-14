const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying AcademiaTrust contract...\n");

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`📍 Deployer address : ${deployer.address}`);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Deployer balance : ${hre.ethers.formatEther(balance)} ETH\n`);

    // Deploy
    const AcademiaTrust = await hre.ethers.getContractFactory("AcademiaTrust");
    const academiaTrust = await AcademiaTrust.deploy();
    await academiaTrust.waitForDeployment();

    const contractAddress = await academiaTrust.getAddress();
    console.log(`✅ AcademiaTrust deployed at: ${contractAddress}`);
    console.log(`\n📋 Copy this address to your backend/.env:`);
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
    console.log(`\n🔗 Verification (Sepolia):`);
    console.log(`   npx hardhat verify --network sepolia ${contractAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
