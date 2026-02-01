/**
 * Knowledge Data Routes
 * API endpoints for accessing niche data (protected by x402)
 */

import { Router, Request, Response } from 'express';
import { getARCStablecoinData, getLATAMMarketData, getCryptoTrendsData } from '../data/mockData';
import { metricsService } from '../services/metricsService';
import { websocketService } from '../services/websocketService';
import config from '../config';

const router = Router();

/**
 * GET /api/v1/stablecoins/arc
 * Real-time Indian Stablecoin (ARC) data
 * Price: 0.001 USDC per request
 */
router.get('/stablecoins/arc', (req: Request, res: Response) => {
    try {
        const data = getARCStablecoinData();

        // Extract agent address from payment header or default
        const agentAddress = (req as any).paymentInfo?.payer || 'unknown';

        // Record the successful payment
        const transaction = metricsService.recordPayment(
            config.endpoints.stablecoinsArc,
            agentAddress,
            config.x402.paymentAmount
        );

        // Broadcast to dashboard
        websocketService.broadcastTransaction(transaction);
        websocketService.broadcastMetrics(metricsService.getMetrics());

        res.json({
            success: true,
            endpoint: config.endpoints.stablecoinsArc,
            pricePerRequest: config.x402.paymentAmountFormatted,
            data,
        });
    } catch (error: any) {
        console.error('Error fetching ARC data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stablecoin data',
            message: error.message,
        });
    }
});

/**
 * GET /api/v1/markets/latam
 * LATAM market insights and crypto adoption data
 * Price: 0.001 USDC per request
 */
router.get('/markets/latam', (req: Request, res: Response) => {
    try {
        const data = getLATAMMarketData();

        // Extract agent address from payment header or default
        const agentAddress = (req as any).paymentInfo?.payer || 'unknown';

        // Record the successful payment
        const transaction = metricsService.recordPayment(
            config.endpoints.marketsLatam,
            agentAddress,
            config.x402.paymentAmount
        );

        // Broadcast to dashboard
        websocketService.broadcastTransaction(transaction);
        websocketService.broadcastMetrics(metricsService.getMetrics());

        res.json({
            success: true,
            endpoint: config.endpoints.marketsLatam,
            pricePerRequest: config.x402.paymentAmountFormatted,
            data,
        });
    } catch (error: any) {
        console.error('Error fetching LATAM data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market data',
            message: error.message,
        });
    }
});

/**
 * GET /api/v1/crypto/trends
 * Global crypto trends and market analysis
 * Price: 0.001 USDC per request
 */
router.get('/crypto/trends', (req: Request, res: Response) => {
    try {
        const data = getCryptoTrendsData();

        // Extract agent address from payment header or default
        const agentAddress = (req as any).paymentInfo?.payer || 'unknown';

        // Record the successful payment
        const transaction = metricsService.recordPayment(
            config.endpoints.cryptoTrends,
            agentAddress,
            config.x402.paymentAmount
        );

        // Broadcast to dashboard
        websocketService.broadcastTransaction(transaction);
        websocketService.broadcastMetrics(metricsService.getMetrics());

        res.json({
            success: true,
            endpoint: config.endpoints.cryptoTrends,
            pricePerRequest: config.x402.paymentAmountFormatted,
            data,
        });
    } catch (error: any) {
        console.error('Error fetching crypto trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch crypto trends',
            message: error.message,
        });
    }
});

export default router;
