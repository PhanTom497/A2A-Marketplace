/**
 * API Server Configuration
 * Imports from shared config and adds API-specific settings
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try multiple paths for .env file
const envPaths = [
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`📁 Loaded .env from: ${envPath}`);
        break;
    }
}

export const config = {
    // Network Configuration
    network: {
        rpc: process.env.POLYGON_RPC || 'https://rpc-amoy.polygon.technology/',
        chainId: 80002,
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
        facilitatorUrl: process.env.FACILITATOR_URL || 'https://facilitator.corbits.dev',
        paymentAmount: parseInt(process.env.PAYMENT_AMOUNT || '1000'), // 0.001 USDC
        paymentAmountFormatted: '0.001 USDC',
    },

    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || process.env.API_PORT || '4021'),
        websocketPort: parseInt(process.env.WEBSOCKET_PORT || '4022'),
        receiverWallet: process.env.RECEIVER_WALLET || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Baba's default or from env
    },

    // Mode Configuration
    testMode: false,

    // Rate Limiting
    rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // max requests per window per agent
    },

    // API Endpoints
    endpoints: {
        stablecoinsArc: '/api/v1/stablecoins/arc',
        marketsLatam: '/api/v1/markets/latam',
        cryptoTrends: '/api/v1/crypto/trends',
    },
};

// Validate required configuration
export function validateConfig(): void {
    const errors: string[] = [];

    if (!config.server.receiverWallet) {
        errors.push('RECEIVER_WALLET is required');
    }

    if (errors.length > 0) {
        console.error('❌ Configuration errors:');
        errors.forEach(e => console.error(`   - ${e}`));
        console.error('\nPlease check your .env file');
        process.exit(1);
    }
}

export default config;
