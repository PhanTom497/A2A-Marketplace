/**
 * A2A Knowledge Marketplace - API Server
 * Express.js server with x402 micropayment integration
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config, { validateConfig } from './config';
import knowledgeRoutes from './routes/knowledge';
import metricsRoutes from './routes/metrics';
import { knowledgeRateLimiter } from './middleware/rateLimit';
import { websocketService } from './services/websocketService';
import { paymentLogger } from './services/paymentLogger';
import { metricsService } from './services/metricsService';

// Validate configuration
validateConfig();

const app = express();

// ============ Middleware ============

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Disable for API
}));

// CORS - allow all origins for demo
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment', 'X-Payment-Response'],
    exposedHeaders: ['X-Payment-Required', 'X-Payment-Response'],
}));

// JSON body parser
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// ============ x402 Payment Middleware ============

/**
 * Custom x402 middleware for Polygon Amoy via PayAI Facilitator
 * Since the official @x402/express may not fully support Polygon yet,
 * we implement a compatible middleware
 */
const x402Middleware = (req: Request, res: Response, next: NextFunction) => {
    // Check for payment header
    const paymentHeader = req.headers['x-payment'] as string;

    if (!paymentHeader) {
        // No payment - return 402 Payment Required
        const endpoint = req.path;
        const agentAddress = req.ip || 'unknown';

        // Log the 402 response
        paymentLogger.log402Response(endpoint, agentAddress);
        metricsService.record402Response(endpoint, agentAddress);

        // Build payment requirements
        const paymentRequired = {
            version: '2.0',
            network: config.network.caip2,
            recipient: config.server.receiverWallet,
            amount: config.x402.paymentAmount.toString(),
            asset: `eip155:80002/erc20:${config.usdc.address}`,
            description: `Access to ${endpoint}`,
            facilitator: config.x402.facilitatorUrl,
            expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        };

        res.setHeader('X-Payment-Required', JSON.stringify(paymentRequired));

        return res.status(402).json({
            error: 'Payment Required',
            message: `This endpoint requires a payment of ${config.x402.paymentAmountFormatted}`,
            paymentRequired,
            instructions: {
                step1: 'Sign a payment transaction with your wallet',
                step2: 'Include the signed transaction in the X-Payment header',
                step3: 'Retry your request',
            },
        });
    }

    // Payment provided - verify it
    // Payment provided - verify it
    try {
        const paymentEnvelope = JSON.parse(paymentHeader);
        // Extract payer from envelope payload or direct object (fallback)
        const payer = paymentEnvelope.payload?.payer || paymentEnvelope.payer || 'unknown';

        // In test mode, accept any payment
        if (config.testMode) {
            console.log('🧪 Test mode: Skipping payment verification');
            (req as any).paymentInfo = {
                payer: payer || 'test-agent',
                verified: true,
                testMode: true,
            };
            return next();
        }

        // Verify payment with facilitator
        // We pass the full header string as is - correct
        const fullResourceUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        verifyPaymentWithFacilitator(paymentHeader, fullResourceUrl)
            .then((result) => {
                if (result.valid) {
                    (req as any).paymentInfo = {
                        payer: payer,
                        txHash: result.txHash,
                        verified: true,
                    };

                    paymentLogger.logPaymentSuccess(
                        req.path,
                        payer,
                        config.x402.paymentAmount,
                        result.txHash
                    );

                    next();
                } else {
                    paymentLogger.logPaymentFailure(
                        req.path,
                        payer,
                        result.error || 'Payment verification failed'
                    );

                    metricsService.recordFailedPayment(
                        req.path,
                        payer,
                        result.error || 'Payment verification failed'
                    );

                    res.status(402).json({
                        error: 'Payment Invalid',
                        message: result.error || 'Payment verification failed',
                    });
                }
            })
            .catch((error) => {
                console.error('Payment verification error:', error);

                paymentLogger.logPaymentFailure(
                    req.path,
                    payer || 'unknown',
                    error.message
                );

                res.status(500).json({
                    error: 'Payment Verification Error',
                    message: 'Failed to verify payment',
                });
            });
    } catch (error) {
        console.error('Invalid payment header:', error);

        res.status(400).json({
            error: 'Invalid Payment',
            message: 'X-Payment header must be valid JSON',
        });
    }
};

/**
 * Verify payment with PayAI facilitator
 */
/**
 * Verify payment with Corbits Facilitator
 * POST /verify
 */
async function verifyPaymentWithFacilitator(
    paymentHeaderStr: string, // Pass the raw header string
    resource: string // The resource URI being accessed
): Promise<{ valid: boolean; txHash?: string; error?: string }> {
    try {
        const response = await fetch(`${config.x402.facilitatorUrl}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x402Version: 1,
                paymentHeader: Buffer.from(paymentHeaderStr).toString('base64'),
                paymentRequirements: {
                    scheme: "exact",
                    network: config.network.caip2,
                    maxAmountRequired: config.x402.paymentAmount.toString(),
                    resource: resource, // Required by Corbits
                    description: "Access to paid API content",
                    mimeType: "application/json",
                    payTo: config.server.receiverWallet,
                    maxTimeoutSeconds: 300,
                    asset: config.usdc.address,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { valid: false, error: `Facilitator error: ${errorText}` };
        }

        const result = await response.json() as any;
        return {
            valid: true, // Corbits returns 200 OK for valid payments
            txHash: result.transactionHash || result.txHash,
        };
    } catch (error: any) {
        console.error('Facilitator request failed:', error);
        return { valid: false, error: `Facilitator unreachable: ${error.message}` };
    }
}

// ============ Routes ============

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        network: config.network.name,
        testMode: config.testMode,
    });
});

// API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        name: 'A2A Knowledge Marketplace API',
        version: '1.0.0',
        description: 'Agent-to-Agent Knowledge Marketplace with x402 micropayments',
        network: config.network.name,
        chainId: config.network.chainId,
        facilitator: config.x402.facilitatorUrl,
        pricePerRequest: config.x402.paymentAmountFormatted,
        endpoints: {
            protected: [
                {
                    path: config.endpoints.stablecoinsArc,
                    description: 'Real-time Indian Stablecoin (ARC) data',
                    price: config.x402.paymentAmountFormatted,
                },
                {
                    path: config.endpoints.marketsLatam,
                    description: 'LATAM market insights and crypto adoption data',
                    price: config.x402.paymentAmountFormatted,
                },
                {
                    path: config.endpoints.cryptoTrends,
                    description: 'Global crypto trends and market analysis',
                    price: config.x402.paymentAmountFormatted,
                },
            ],
            public: [
                { path: '/health', description: 'Health check' },
                { path: '/api', description: 'API information' },
                { path: '/api/metrics/summary', description: 'Dashboard metrics' },
                { path: '/api/metrics/transactions', description: 'Recent transactions' },
            ],
        },
        testMode: config.testMode,
    });
});

// Rate limiting for knowledge endpoints
app.use('/api/v1', knowledgeRateLimiter);

// x402 payment middleware for protected endpoints
app.use('/api/v1', x402Middleware);

// Knowledge data routes (protected)
app.use('/api/v1', knowledgeRoutes);

// Metrics routes (public)
app.use('/api/metrics', metricsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.path} not found`,
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    paymentLogger.error('UNHANDLED_ERROR', err.message, { stack: err.stack });

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
});

// ============ Start Server ============

const PORT = config.server.port;
const WS_PORT = config.server.websocketPort;

// Start HTTP server
// Start HTTP server only if not in Vercel/Serverless environment
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log('\n🚀 A2A Knowledge Marketplace - API Server');
        console.log('==========================================');
        console.log(`📍 HTTP Server: http://localhost:${PORT}`);
        console.log(`📍 WebSocket: ws://localhost:${WS_PORT}`);
        console.log(`🌐 Network: ${config.network.name} (Chain ID: ${config.network.chainId})`);
        console.log(`💰 Price: ${config.x402.paymentAmountFormatted} per request`);
        console.log(`🔗 Facilitator: ${config.x402.facilitatorUrl}`);
        console.log(`💼 Receiver: ${config.server.receiverWallet || 'NOT SET'}`);
        console.log(`🧪 Test Mode: ${config.testMode ? 'ENABLED' : 'disabled'}`);
        console.log('==========================================');
        console.log('\n📋 Endpoints:');
        console.log(`   GET /api/v1/stablecoins/arc  - Indian ARC stablecoin data`);
        console.log(`   GET /api/v1/markets/latam    - LATAM market insights`);
        console.log(`   GET /api/v1/crypto/trends    - Global crypto trends`);
        console.log(`   GET /api/metrics/summary     - Dashboard metrics`);
        console.log('\nReady to receive agent requests! 🤖\n');

        // Log test mode warning
        if (config.testMode) {
            console.log('⚠️  WARNING: Running in TEST MODE - payments not verified\n');
        }
    });
}

// Start WebSocket server
websocketService.initialize(WS_PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down gracefully...');
    websocketService.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    websocketService.close();
    process.exit(0);
});

export default app;
