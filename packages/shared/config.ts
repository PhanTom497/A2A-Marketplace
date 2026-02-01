import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    // Network Configuration
    network: {
        rpc: process.env.POLYGON_RPC || 'https://rpc-amoy.polygon.technology/',
        chainId: parseInt(process.env.CHAIN_ID || '80002'),
        caip2: 'eip155:80002',
        name: 'Polygon Amoy Testnet',
        explorer: 'https://amoy.polygonscan.com',
    },

    // USDC Token Configuration
    usdc: {
        address: process.env.USDC_ADDRESS || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
        decimals: 6,
        symbol: 'USDC',
    },

    // x402 Payment Configuration
    x402: {
        facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.payai.network',
        paymentAmount: parseInt(process.env.PAYMENT_AMOUNT || '1000'), // 0.001 USDC
        paymentAmountFormatted: '0.001 USDC',
    },

    // Server Configuration
    server: {
        address: process.env.SERVER_ADDRESS || '',
        receiverWallet: process.env.RECEIVER_WALLET || '',
        port: parseInt(process.env.API_PORT || '4021'),
        websocketPort: parseInt(process.env.WEBSOCKET_PORT || '4022'),
    },

    // Agent Configuration
    agent: {
        privateKey: process.env.AGENT_PRIVATE_KEY || '',
        funderPrivateKey: process.env.FUNDER_PRIVATE_KEY || '',
    },

    // Mode Configuration
    testMode: process.env.TEST_MODE === 'true',

    // API Endpoints (protected by x402)
    endpoints: {
        stablecoinsArc: '/api/v1/stablecoins/arc',
        marketsLatam: '/api/v1/markets/latam',
        cryptoTrends: '/api/v1/crypto/trends',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // max requests per window per agent
    },
};

// Validate required configuration
export function validateConfig(): string[] {
    const errors: string[] = [];

    if (!config.server.receiverWallet) {
        errors.push('RECEIVER_WALLET is required');
    }

    if (!config.agent.privateKey && !config.testMode) {
        errors.push('AGENT_PRIVATE_KEY is required when not in test mode');
    }

    return errors;
}

export default config;
