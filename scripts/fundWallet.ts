/**
 * Wallet Funding Script
 * Automatically funds AI agent wallets with test USDC on Polygon Amoy
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://rpc-amoy.polygon.technology/';
const USDC_ADDRESS = process.env.USDC_ADDRESS || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
const FUNDER_PRIVATE_KEY = process.env.FUNDER_PRIVATE_KEY;
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;

// Amount to fund each agent (0.1 USDC for testing)
const FUNDING_AMOUNT = '0.1';

// ERC20 ABI (minimal for transfer and balanceOf)
const ERC20_ABI = [
    {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'bool' }],
    },
    {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'decimals',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
    },
] as const;

// Custom chain definition for Polygon Amoy
const polygonAmoyChain = {
    ...polygonAmoy,
    id: 80002,
    name: 'Polygon Amoy',
    network: 'polygon-amoy',
    rpcUrls: {
        default: { http: [POLYGON_RPC] },
        public: { http: [POLYGON_RPC] },
    },
};

async function getAgentWallets(): Promise<string[]> {
    const wallets: string[] = [];

    // Get agent wallet from private key
    if (AGENT_PRIVATE_KEY) {
        const account = privateKeyToAccount(AGENT_PRIVATE_KEY as `0x${string}`);
        wallets.push(account.address);
    }

    // Add any additional wallets from environment
    const additionalWallets = process.env.ADDITIONAL_AGENT_WALLETS?.split(',') || [];
    wallets.push(...additionalWallets.filter(w => w.startsWith('0x')));

    return wallets;
}

async function checkUSDCBalance(client: any, address: string): Promise<bigint> {
    const balance = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
    });
    return balance as bigint;
}

async function fundWallet(
    walletClient: any,
    publicClient: any,
    toAddress: string,
    amount: string
): Promise<string> {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    console.log(`  Sending ${amount} USDC to ${toAddress}...`);

    const hash = await walletClient.writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [toAddress as `0x${string}`, amountWei],
    });

    console.log(`  Transaction hash: ${hash}`);
    console.log(`  Waiting for confirmation...`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
        console.log(`  ✅ Successfully funded ${toAddress}`);
    } else {
        console.log(`  ❌ Transaction failed`);
    }

    return hash;
}

async function main() {
    console.log('🚀 A2A Knowledge Marketplace - Wallet Funding Script\n');

    // Validate configuration
    if (!FUNDER_PRIVATE_KEY) {
        console.error('❌ Error: FUNDER_PRIVATE_KEY is required in .env');
        console.log('\nTo fund agent wallets, you need a wallet with USDC on Polygon Amoy.');
        console.log('Get test USDC from: https://faucet.circle.com/');
        process.exit(1);
    }

    // Create funder account
    const funderAccount = privateKeyToAccount(FUNDER_PRIVATE_KEY as `0x${string}`);
    console.log(`💰 Funder wallet: ${funderAccount.address}`);

    // Create clients
    const publicClient = createPublicClient({
        chain: polygonAmoyChain,
        transport: http(POLYGON_RPC),
    });

    const walletClient = createWalletClient({
        account: funderAccount,
        chain: polygonAmoyChain,
        transport: http(POLYGON_RPC),
    });

    // Check funder balance
    const funderBalance = await checkUSDCBalance(publicClient, funderAccount.address);
    console.log(`   Balance: ${formatUnits(funderBalance, 6)} USDC\n`);

    if (funderBalance === 0n) {
        console.error('❌ Error: Funder wallet has no USDC');
        console.log('\nGet test USDC from: https://faucet.circle.com/');
        process.exit(1);
    }

    // Get agent wallets
    const agentWallets = await getAgentWallets();

    if (agentWallets.length === 0) {
        console.log('⚠️  No agent wallets found. Set AGENT_PRIVATE_KEY in .env');
        process.exit(0);
    }

    console.log(`📋 Found ${agentWallets.length} agent wallet(s) to fund:\n`);

    // Fund each wallet
    for (const wallet of agentWallets) {
        console.log(`\n🤖 Agent wallet: ${wallet}`);

        // Check current balance
        const currentBalance = await checkUSDCBalance(publicClient, wallet);
        console.log(`   Current balance: ${formatUnits(currentBalance, 6)} USDC`);

        // Skip if already funded
        const fundingAmountWei = parseUnits(FUNDING_AMOUNT, 6);
        if (currentBalance >= fundingAmountWei) {
            console.log(`   ✅ Already has sufficient balance, skipping`);
            continue;
        }

        // Fund the wallet
        try {
            await fundWallet(walletClient, publicClient, wallet, FUNDING_AMOUNT);

            // Verify new balance
            const newBalance = await checkUSDCBalance(publicClient, wallet);
            console.log(`   New balance: ${formatUnits(newBalance, 6)} USDC`);
        } catch (error: any) {
            console.error(`   ❌ Error funding wallet: ${error.message}`);
        }
    }

    console.log('\n✨ Wallet funding complete!\n');
    console.log('📊 View transactions on Polygon Amoy Explorer:');
    console.log(`   https://amoy.polygonscan.com/address/${funderAccount.address}`);
}

main().catch(console.error);
