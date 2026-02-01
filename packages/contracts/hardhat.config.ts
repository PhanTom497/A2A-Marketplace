import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const POLYGON_RPC = process.env.POLYGON_RPC || "https://rpc-amoy.polygon.technology/";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 80002,
        },
        localhost: {
            url: "http://127.0.0.1:8545",
        },
        polygonAmoy: {
            url: POLYGON_RPC,
            chainId: 80002,
            accounts: [DEPLOYER_PRIVATE_KEY],
            gasPrice: "auto",
        },
    },
    etherscan: {
        apiKey: {
            polygonAmoy: POLYGONSCAN_API_KEY,
        },
        customChains: [
            {
                network: "polygonAmoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
