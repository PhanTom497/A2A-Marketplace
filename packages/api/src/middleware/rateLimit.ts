/**
 * Rate Limiter Middleware
 * Limits requests per agent to prevent abuse
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { paymentLogger } from '../services/paymentLogger';
import config from '../config';

/**
 * Extract agent identifier from request
 * Uses wallet address if available, otherwise IP
 */
function getAgentKey(req: Request): string {
    // Try to get wallet address from x402 payment
    const paymentHeader = req.headers['x-payment'] as string;
    if (paymentHeader) {
        try {
            const payment = JSON.parse(paymentHeader);
            if (payment.payer) {
                return payment.payer;
            }
        } catch {
            // Fall back to IP
        }
    }

    // Fall back to IP address
    return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Rate limiter for knowledge endpoints
 */
export const knowledgeRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    keyGenerator: getAgentKey,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        const agentKey = getAgentKey(req);
        paymentLogger.logRateLimited(agentKey, req.path);

        res.status(429).json({
            success: false,
            error: 'Too many requests',
            message: `Rate limit exceeded. Max ${config.rateLimit.maxRequests} requests per minute.`,
            retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        });
    },
    skip: (req: Request) => {
        // Skip rate limiting for metrics endpoints
        return req.path.startsWith('/api/metrics');
    },
});

/**
 * Stricter rate limiter for individual agent abuse
 */
export const strictRateLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 10, // 10 requests per 10 seconds
    keyGenerator: getAgentKey,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
        const agentKey = getAgentKey(req);
        paymentLogger.logRateLimited(agentKey, req.path);

        res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please slow down.',
            retryAfter: 10,
        });
    },
});

export default knowledgeRateLimiter;
