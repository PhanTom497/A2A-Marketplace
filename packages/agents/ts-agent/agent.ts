/**
 * A2A Knowledge Marketplace - TypeScript AI Agent
 * Autonomous agent that requests data and pays via x402
 */

import { Command } from 'commander';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createWalletClient, http, type WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { polygonAmoy } from 'viem/chains';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ============ Configuration ============

interface Config {
    apiUrl: string;
    polygonRpc: string;
    agentPrivateKey: string;
    usdcAddress: string;
    paymentAmount: number;
    testMode: boolean;
    endpoints: Record<string, string>;
}

function loadConfig(): Config {
    return {
        apiUrl: process.env.API_URL || 'http://localhost:4021',
        polygonRpc: process.env.POLYGON_RPC || 'https://rpc-amoy.polygon.technology/',
        agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',
        usdcAddress: process.env.USDC_ADDRESS || '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
        paymentAmount: parseInt(process.env.PAYMENT_AMOUNT || '1000'),
        testMode: process.env.TEST_MODE === 'true',
        endpoints: {
            arc: '/api/v1/stablecoins/arc',
            latam: '/api/v1/markets/latam',
            trends: '/api/v1/crypto/trends',
        },
    };
}

// ============ Logger ============

const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
};

function log(level: keyof typeof colors, message: string): void {
    const color = colors[level] || '';
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`);
}

const logger = {
    info: (msg: string) => log('info', msg),
    success: (msg: string) => log('success', msg),
    warning: (msg: string) => log('warning', msg),
    error: (msg: string) => log('error', msg),
};

// ============ A2A Agent ============

interface PaymentRequired {
    version?: string;
    network: string;
    recipient: string;
    amount: string;
    asset: string;
    description?: string;
    facilitator?: string;
    expires?: string;
}

interface Payment {
    payer: string;
    paymentData?: Record<string, any>;
    signature: string;
    testMode?: boolean;
}

class A2AAgent {
    private config: Config;
    private walletClient: WalletClient | null = null;
    private walletAddress: string = '';

    constructor(config: Config) {
        this.config = config;

        // Initialize wallet if private key provided
        if (config.agentPrivateKey) {
            const account = privateKeyToAccount(config.agentPrivateKey as `0x${string}`);
            this.walletAddress = account.address;

            this.walletClient = createWalletClient({
                account,
                chain: polygonAmoy,
                transport: http(config.polygonRpc),
            });

            logger.info(`Agent wallet: ${this.walletAddress}`);
        }
    }

    /**
     * Request data from an endpoint with automatic payment handling
     */
    async requestData(
        endpoint: string,
        maxRetries: number = 3,
        retryDelay: number = 2000
    ): Promise<any> {
        const url = `${this.config.apiUrl}${endpoint}`;
        logger.info(`Requesting: ${endpoint}`);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Make initial request
                const response = await fetch(url);

                if (response.ok) {
                    const data = await response.json();
                    logger.success(`Data received from ${endpoint}`);
                    return data;
                }

                if (response.status === 402) {
                    // Payment required
                    logger.info('Payment required - processing...');

                    const responseData = await response.json();
                    let paymentRequired: PaymentRequired = responseData.paymentRequired;

                    if (!paymentRequired) {
                        // Try header
                        const paymentHeader = response.headers.get('X-Payment-Required');
                        if (paymentHeader) {
                            paymentRequired = JSON.parse(paymentHeader);
                        }
                    }

                    if (!paymentRequired) {
                        throw new Error('No payment requirements received');
                    }

                    // Create payment
                    const payment = await this.createPayment(paymentRequired);

                    // Retry with payment
                    logger.info('Retrying with payment...');
                    const paymentResponse = await fetch(url, {
                        headers: {
                            'X-Payment': JSON.stringify(payment),
                        },
                    });

                    if (paymentResponse.ok) {
                        const data = await paymentResponse.json();
                        logger.success(`✅ Payment successful! Data received from ${endpoint}`);
                        return data;
                    } else {
                        const errorText = await paymentResponse.text();
                        logger.warning(`Payment rejected: ${errorText}`);
                        throw new Error(`Payment rejected: ${paymentResponse.status}`);
                    }
                }

                if (response.status === 429) {
                    // Rate limited
                    const retryAfter = parseInt(response.headers.get('Retry-After') || '2');
                    logger.warning(`Rate limited - waiting ${retryAfter}s...`);
                    await this.sleep(retryAfter * 1000);
                    continue;
                }

                throw new Error(`Unexpected status: ${response.status}`);
            } catch (error: any) {
                logger.warning(`Attempt ${attempt + 1}/${maxRetries} failed: ${error.message}`);

                if (attempt < maxRetries - 1) {
                    const waitTime = retryDelay * Math.pow(2, attempt);
                    logger.info(`Retrying in ${waitTime / 1000}s...`);
                    await this.sleep(waitTime);
                } else {
                    logger.error(`All ${maxRetries} attempts failed`);
                    throw error;
                }
            }
        }

        throw new Error('Request failed after all retries');
    }

    /**
     * Create a signed payment for the x402 protocol
     */
    private async createPayment(paymentRequired: PaymentRequired): Promise<Payment> {
        if (this.config.testMode) {
            logger.info('🧪 Test mode: Creating mock payment');
            return {
                payer: 'test-agent-address',
                signature: 'test-signature',
                testMode: true,
            };
        }

        if (!this.walletClient) {
            throw new Error('No wallet configured - set AGENT_PRIVATE_KEY');
        }

        // Create payment data
        const paymentData = {
            network: paymentRequired.network || 'eip155:80002',
            recipient: paymentRequired.recipient,
            amount: paymentRequired.amount,
            asset: paymentRequired.asset,
            nonce: Date.now(),
            expiry: paymentRequired.expires,
        };

        // Sign the payment
        const message = JSON.stringify(paymentData, Object.keys(paymentData).sort());
        const signature = await this.walletClient.signMessage({
            message,
        });

        const payment: Payment = {
            payer: this.walletAddress,
            paymentData,
            signature,
        };

        logger.info(`Payment signed: ${this.walletAddress}`);
        return payment;
    }

    /**
     * Run demonstration
     */
    async runDemo(
        endpoints: string[],
        loopCount: number = 1,
        delay: number = 2000
    ): Promise<void> {
        logger.info('🤖 Starting A2A Agent Demo');
        logger.info(`   API URL: ${this.config.apiUrl}`);
        logger.info(`   Test Mode: ${this.config.testMode}`);
        logger.info(`   Endpoints: ${endpoints.length}`);
        logger.info(`   Loops: ${loopCount}`);
        console.log();

        let totalRequests = 0;
        let successfulRequests = 0;

        for (let loop = 0; loop < loopCount; loop++) {
            if (loop > 0) {
                logger.info(`--- Loop ${loop + 1}/${loopCount} ---`);
            }

            for (const endpoint of endpoints) {
                try {
                    const data = await this.requestData(endpoint);
                    totalRequests++;
                    successfulRequests++;

                    // Print summary
                    if (data.data?.timestamp) {
                        logger.success(`   Timestamp: ${data.data.timestamp}`);
                    }

                    await this.sleep(delay);
                } catch (error: any) {
                    totalRequests++;
                    logger.error(`Failed: ${error.message}`);
                }
            }
        }

        console.log();
        logger.info('📊 Demo Complete');
        logger.info(`   Total Requests: ${totalRequests}`);
        logger.info(`   Successful: ${successfulRequests}`);
        logger.info(`   Failed: ${totalRequests - successfulRequests}`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============ CLI ============

async function main() {
    const program = new Command();

    program
        .name('a2a-agent')
        .description('A2A Knowledge Marketplace - TypeScript AI Agent')
        .version('1.0.0');

    program
        .option('-e, --endpoint <type>', 'Endpoint to request (arc, latam, trends, all)', 'all')
        .option('-l, --loop <number>', 'Number of request loops', '1')
        .option('-d, --delay <seconds>', 'Delay between requests', '2')
        .option('-t, --test-mode', 'Run in test mode (no real payments)')
        .option('--api-url <url>', 'Override API URL');

    program.parse();
    const options = program.opts();

    // Load and override config
    const config = loadConfig();

    if (options.testMode) {
        config.testMode = true;
    }
    if (options.apiUrl) {
        config.apiUrl = options.apiUrl;
    }

    // Validate config
    if (!config.agentPrivateKey && !config.testMode) {
        logger.error('AGENT_PRIVATE_KEY is required when not in test mode');
        logger.info('Hint: Set TEST_MODE=true or use --test-mode for demo without payments');
        process.exit(1);
    }

    // Determine endpoints
    let endpoints: string[];
    if (options.endpoint === 'all') {
        endpoints = Object.values(config.endpoints);
    } else {
        endpoints = [config.endpoints[options.endpoint]];
    }

    // Initialize and run agent
    const agent = new A2AAgent(config);

    try {
        await agent.runDemo(
            endpoints,
            parseInt(options.loop),
            parseFloat(options.delay) * 1000
        );
    } catch (error) {
        logger.error('Agent error');
        process.exit(1);
    }
}

main().catch(console.error);
