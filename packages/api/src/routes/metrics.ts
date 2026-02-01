/**
 * Metrics Routes
 * Public endpoints for dashboard data
 */

import { Router, Request, Response } from 'express';
import { metricsService } from '../services/metricsService';
import { websocketService } from '../services/websocketService';
import config from '../config';

const router = Router();

/**
 * GET /api/metrics/summary
 * Get dashboard summary metrics
 */
router.get('/summary', (req: Request, res: Response) => {
    try {
        const metrics = metricsService.getMetrics();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            config: {
                network: config.network.name,
                chainId: config.network.chainId,
                facilitator: config.x402.facilitatorUrl,
                pricePerRequest: config.x402.paymentAmountFormatted,
                receiverWallet: config.server.receiverWallet,
            },
            metrics,
            connections: {
                websocketClients: websocketService.getConnectedClients(),
            },
        });
    } catch (error: any) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics',
            message: error.message,
        });
    }
});

/**
 * GET /api/metrics/transactions
 * Get recent transactions
 */
router.get('/transactions', (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const transactions = metricsService.getRecentTransactions(limit);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            count: transactions.length,
            transactions,
        });
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions',
            message: error.message,
        });
    }
});

/**
 * GET /api/metrics/endpoints
 * Get per-endpoint metrics
 */
router.get('/endpoints', (req: Request, res: Response) => {
    try {
        const metrics = metricsService.getMetrics();

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            endpoints: metrics.endpointMetrics,
        });
    } catch (error: any) {
        console.error('Error fetching endpoint metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch endpoint metrics',
            message: error.message,
        });
    }
});

/**
 * POST /api/metrics/reset
 * Reset all metrics (for testing)
 */
router.post('/reset', (req: Request, res: Response) => {
    try {
        metricsService.reset();

        res.json({
            success: true,
            message: 'Metrics reset successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error resetting metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset metrics',
            message: error.message,
        });
    }
});

export default router;
