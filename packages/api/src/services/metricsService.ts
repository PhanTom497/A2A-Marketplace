/**
 * Metrics Service
 * Tracks API requests, payments, and revenue for the dashboard
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Transaction {
    id: string;
    timestamp: string;
    endpoint: string;
    agentAddress: string;
    amount: number;
    amountFormatted: string;
    status: 'success' | 'failed' | 'pending';
    txHash?: string;
    errorMessage?: string;
}

export interface EndpointMetrics {
    endpoint: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalRevenue: number;
}

export interface DashboardMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalRevenue: number;
    revenueFormatted: string;
    uniqueAgents: number;
    requestsPerMinute: number;
    endpointMetrics: EndpointMetrics[];
    recentTransactions: Transaction[];
    hourlyData: { hour: string; requests: number; revenue: number }[];
}

class MetricsService {
    private transactions: Transaction[] = [];
    private endpointMetrics: Map<string, EndpointMetrics> = new Map();
    private uniqueAgents: Set<string> = new Set();
    private requestTimestamps: number[] = [];
    private dataFile: string;

    constructor() {
        this.dataFile = path.resolve(__dirname, '../../../data/metrics.json');
        this.loadData();
    }

    /**
     * Load metrics from file (if exists)
     */
    private loadData(): void {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
                this.transactions = data.transactions || [];
                this.uniqueAgents = new Set(data.uniqueAgents || []);

                // Rebuild endpoint metrics
                for (const tx of this.transactions) {
                    this.updateEndpointMetrics(tx.endpoint, tx.status === 'success', tx.amount);
                }

                console.log(`📊 Loaded ${this.transactions.length} transactions from storage`);
            }
        } catch (error) {
            console.log('📊 Starting with fresh metrics');
        }
    }

    /**
     * Save metrics to file
     */
    private saveData(): void {
        try {
            const dir = path.dirname(this.dataFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                transactions: this.transactions.slice(-1000), // Keep last 1000 transactions
                uniqueAgents: Array.from(this.uniqueAgents),
                lastUpdated: new Date().toISOString(),
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save metrics:', error);
        }
    }

    /**
     * Update metrics for an endpoint
     */
    private updateEndpointMetrics(endpoint: string, success: boolean, amount: number): void {
        let metrics = this.endpointMetrics.get(endpoint);

        if (!metrics) {
            metrics = {
                endpoint,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalRevenue: 0,
            };
            this.endpointMetrics.set(endpoint, metrics);
        }

        metrics.totalRequests++;
        if (success) {
            metrics.successfulRequests++;
            metrics.totalRevenue += amount;
        } else {
            metrics.failedRequests++;
        }
    }

    /**
     * Record a 402 response (payment required)
     */
    record402Response(endpoint: string, agentAddress: string): void {
        console.log(`📋 [402] ${endpoint} - Agent: ${agentAddress.slice(0, 10)}...`);
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Record a successful payment and data delivery
     */
    recordPayment(
        endpoint: string,
        agentAddress: string,
        amount: number,
        txHash?: string
    ): Transaction {
        const transaction: Transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            endpoint,
            agentAddress,
            amount,
            amountFormatted: `${(amount / 1000000).toFixed(6)} USDC`,
            status: 'success',
            txHash,
        };

        this.transactions.push(transaction);
        this.uniqueAgents.add(agentAddress);
        this.updateEndpointMetrics(endpoint, true, amount);
        this.requestTimestamps.push(Date.now());
        this.saveData();

        console.log(`✅ [PAID] ${endpoint} - ${transaction.amountFormatted} - Agent: ${agentAddress.slice(0, 10)}...`);

        return transaction;
    }

    /**
     * Record a failed payment
     */
    recordFailedPayment(
        endpoint: string,
        agentAddress: string,
        errorMessage: string
    ): Transaction {
        const transaction: Transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            endpoint,
            agentAddress,
            amount: 0,
            amountFormatted: '0 USDC',
            status: 'failed',
            errorMessage,
        };

        this.transactions.push(transaction);
        this.uniqueAgents.add(agentAddress);
        this.updateEndpointMetrics(endpoint, false, 0);
        this.saveData();

        console.log(`❌ [FAILED] ${endpoint} - ${errorMessage} - Agent: ${agentAddress.slice(0, 10)}...`);

        return transaction;
    }

    /**
     * Calculate requests per minute
     */
    private getRequestsPerMinute(): number {
        const oneMinuteAgo = Date.now() - 60000;
        this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
        return this.requestTimestamps.length;
    }

    /**
     * Generate hourly data for charts
     */
    private getHourlyData(): { hour: string; requests: number; revenue: number }[] {
        const hourlyMap = new Map<string, { requests: number; revenue: number }>();
        const now = new Date();

        // Initialize last 24 hours
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now.getTime() - i * 3600000);
            const key = hour.toISOString().slice(0, 13);
            hourlyMap.set(key, { requests: 0, revenue: 0 });
        }

        // Populate with transaction data
        for (const tx of this.transactions) {
            const key = tx.timestamp.slice(0, 13);
            if (hourlyMap.has(key)) {
                const data = hourlyMap.get(key)!;
                data.requests++;
                if (tx.status === 'success') {
                    data.revenue += tx.amount;
                }
            }
        }

        return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
            hour: new Date(hour + ':00:00Z').toLocaleTimeString('en-US', { hour: '2-digit' }),
            requests: data.requests,
            revenue: data.revenue / 1000000, // Convert to USDC
        }));
    }

    /**
     * Get dashboard metrics
     */
    getMetrics(): DashboardMetrics {
        const totalRequests = this.transactions.length;
        const successfulRequests = this.transactions.filter(t => t.status === 'success').length;
        const failedRequests = this.transactions.filter(t => t.status === 'failed').length;
        const totalRevenue = this.transactions
            .filter(t => t.status === 'success')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            totalRevenue,
            revenueFormatted: `${(totalRevenue / 1000000).toFixed(6)} USDC`,
            uniqueAgents: this.uniqueAgents.size,
            requestsPerMinute: this.getRequestsPerMinute(),
            endpointMetrics: Array.from(this.endpointMetrics.values()),
            recentTransactions: this.transactions.slice(-1000).reverse(),
            hourlyData: this.getHourlyData(),
        };
    }

    /**
     * Get recent transactions
     */
    getRecentTransactions(limit: number = 20): Transaction[] {
        return this.transactions.slice(-limit).reverse();
    }

    /**
     * Reset all metrics (for testing)
     */
    reset(): void {
        this.transactions = [];
        this.endpointMetrics.clear();
        this.uniqueAgents.clear();
        this.requestTimestamps = [];
        this.saveData();
        console.log('📊 Metrics reset');
    }
}

// Singleton instance
export const metricsService = new MetricsService();
export default metricsService;
