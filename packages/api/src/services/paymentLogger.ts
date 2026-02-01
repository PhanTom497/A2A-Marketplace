/**
 * Payment Logger Service
 * Logs all payment-related events for debugging and auditing
 */

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    event: string;
    endpoint?: string;
    agentAddress?: string;
    amount?: number;
    txHash?: string;
    message?: string;
    details?: Record<string, any>;
}

class PaymentLogger {
    private logFile: string;
    private consoleEnabled: boolean = true;
    private fileEnabled: boolean = true;

    constructor() {
        const logsDir = path.resolve(__dirname, '../../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const date = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logsDir, `payments-${date}.log`);
    }

    private formatEntry(entry: LogEntry): string {
        const parts = [
            `[${entry.timestamp}]`,
            `[${entry.level}]`,
            `[${entry.event}]`,
        ];

        if (entry.endpoint) parts.push(`endpoint=${entry.endpoint}`);
        if (entry.agentAddress) parts.push(`agent=${entry.agentAddress.slice(0, 10)}...`);
        if (entry.amount) parts.push(`amount=${(entry.amount / 1000000).toFixed(6)} USDC`);
        if (entry.txHash) parts.push(`tx=${entry.txHash.slice(0, 10)}...`);
        if (entry.message) parts.push(entry.message);

        return parts.join(' ');
    }

    private log(entry: LogEntry): void {
        const formatted = this.formatEntry(entry);

        // Console output with colors
        if (this.consoleEnabled) {
            const colors: Record<LogLevel, string> = {
                INFO: '\x1b[36m',    // Cyan
                WARN: '\x1b[33m',    // Yellow
                ERROR: '\x1b[31m',   // Red
                DEBUG: '\x1b[90m',   // Gray
            };
            const reset = '\x1b[0m';
            console.log(`${colors[entry.level]}${formatted}${reset}`);
        }

        // File output
        if (this.fileEnabled) {
            const jsonEntry = JSON.stringify(entry) + '\n';
            fs.appendFileSync(this.logFile, jsonEntry);
        }
    }

    /**
     * Log a 402 Payment Required response
     */
    log402Response(endpoint: string, agentAddress: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            event: '402_RESPONSE',
            endpoint,
            agentAddress,
            message: 'Payment required - sent payment instructions',
        });
    }

    /**
     * Log a payment verification attempt
     */
    logPaymentVerification(endpoint: string, agentAddress: string, txHash?: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'DEBUG',
            event: 'PAYMENT_VERIFICATION',
            endpoint,
            agentAddress,
            txHash,
            message: 'Verifying payment with facilitator',
        });
    }

    /**
     * Log a successful payment
     */
    logPaymentSuccess(
        endpoint: string,
        agentAddress: string,
        amount: number,
        txHash?: string
    ): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            event: 'PAYMENT_SUCCESS',
            endpoint,
            agentAddress,
            amount,
            txHash,
            message: 'Payment verified and data delivered',
        });
    }

    /**
     * Log a failed payment
     */
    logPaymentFailure(
        endpoint: string,
        agentAddress: string,
        error: string,
        details?: Record<string, any>
    ): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            event: 'PAYMENT_FAILURE',
            endpoint,
            agentAddress,
            message: error,
            details,
        });
    }

    /**
     * Log a payment retry
     */
    logRetry(
        endpoint: string,
        agentAddress: string,
        attemptNumber: number,
        maxAttempts: number
    ): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            event: 'PAYMENT_RETRY',
            endpoint,
            agentAddress,
            message: `Retry attempt ${attemptNumber}/${maxAttempts}`,
        });
    }

    /**
     * Log rate limiting
     */
    logRateLimited(agentAddress: string, endpoint: string): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            event: 'RATE_LIMITED',
            endpoint,
            agentAddress,
            message: 'Request rate limited',
        });
    }

    /**
     * Log general info
     */
    info(event: string, message: string, details?: Record<string, any>): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'INFO',
            event,
            message,
            details,
        });
    }

    /**
     * Log errors
     */
    error(event: string, message: string, details?: Record<string, any>): void {
        this.log({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            event,
            message,
            details,
        });
    }
}

// Singleton instance
export const paymentLogger = new PaymentLogger();
export default paymentLogger;
