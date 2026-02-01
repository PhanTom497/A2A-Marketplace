import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
    console.log("🚀 Deploying KnowledgeMarketplace to Polygon Amoy...\n");

    // Get the server address from environment or use deployer as default
    const [deployer] = await ethers.getSigners();
    const serverAddress = process.env.SERVER_ADDRESS || deployer.address;

    console.log("📋 Deployment Configuration:");
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Server: ${serverAddress}`);
    console.log(`   Network: Polygon Amoy (Chain ID: 80002)`);

    // Check deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`   Balance: ${ethers.formatEther(balance)} POL\n`);

    if (balance === 0n) {
        console.error("❌ Error: Deployer has no POL for gas");
        console.log("Get test POL from: https://faucet.polygon.technology/");
        process.exit(1);
    }

    // Deploy the contract
    console.log("📦 Deploying contract...");
    const KnowledgeMarketplace = await ethers.getContractFactory("KnowledgeMarketplace");
    const marketplace = await KnowledgeMarketplace.deploy(serverAddress);

    await marketplace.waitForDeployment();
    const contractAddress = await marketplace.getAddress();

    console.log(`\n✅ KnowledgeMarketplace deployed!`);
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Transaction Hash: ${marketplace.deploymentTransaction()?.hash}`);

    // Verify initial state
    console.log("\n📊 Verifying initial state:");
    const owner = await marketplace.owner();
    const server = await marketplace.server();
    const [totalRequests, totalRevenue] = await marketplace.getStats();

    console.log(`   Owner: ${owner}`);
    console.log(`   Server: ${server}`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Total Revenue: ${totalRevenue}`);

    console.log("\n🔗 View on Polygon Amoy Explorer:");
    console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);

    console.log("\n📝 Add to your .env file:");
    console.log(`   CONTRACT_ADDRESS=${contractAddress}`);

    // Verify contract on explorer (if API key is available)
    if (process.env.POLYGONSCAN_API_KEY) {
        console.log("\n🔍 Verifying contract on PolygonScan...");
        try {
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s for indexing
            const { run } = await import("hardhat");
            await run("verify:verify", {
                address: contractAddress,
                constructorArguments: [serverAddress],
            });
            console.log("   ✅ Contract verified!");
        } catch (error: any) {
            console.log(`   ⚠️ Verification failed: ${error.message}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
