/**
 * WebSocket Service
 * Provides real-time updates to the dashboard
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Transaction, DashboardMetrics } from './metricsService';

class WebSocketService {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();

    /**
     * Initialize WebSocket server
     */
    initialize(port: number): void {
        this.wss = new WebSocketServer({ port });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('📡 Dashboard connected via WebSocket');
            this.clients.add(ws);

            ws.on('close', () => {
                console.log('📡 Dashboard disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to A2A Knowledge Marketplace',
                timestamp: new Date().toISOString(),
            }));
        });

        console.log(`📡 WebSocket server running on port ${port}`);
    }

    /**
     * Broadcast new transaction to all connected dashboards
     */
    broadcastTransaction(transaction: Transaction): void {
        const message = JSON.stringify({
            type: 'transaction',
            data: transaction,
            timestamp: new Date().toISOString(),
        });

        this.broadcast(message);
    }

    /**
     * Broadcast metrics update to all connected dashboards
     */
    broadcastMetrics(metrics: DashboardMetrics): void {
        const message = JSON.stringify({
            type: 'metrics',
            data: metrics,
            timestamp: new Date().toISOString(),
        });

        this.broadcast(message);
    }

    /**
     * Broadcast a message to all connected clients
     */
    private broadcast(message: string): void {
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Failed to send WebSocket message:', error);
                    this.clients.delete(client);
                }
            }
        }
    }

    /**
     * Get number of connected clients
     */
    getConnectedClients(): number {
        return this.clients.size;
    }

    /**
     * Close WebSocket server
     */
    close(): void {
        if (this.wss) {
            this.wss.close();
            this.clients.clear();
            console.log('📡 WebSocket server closed');
        }
    }
}

// Singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
