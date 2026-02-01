import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from './config';
import { Activity, CheckCircle, Clock, Users } from 'lucide-react';

// Simple local implementation of class merging to avoid dependencies
function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

interface Metrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    revenueFormatted: string;
    uniqueAgents: number;
    hourlyData: { hour: string; requests: number; revenue: number }[];
    recentTransactions: any[];
}

export function DashboardView() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/metrics/summary`);
                setMetrics(res.data.metrics);
            } catch (e) {
                console.error("Failed to fetch metrics", e);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000); // Poll every 2s for live feel
        return () => clearInterval(interval);
    }, []);

    if (!metrics) return <div className="p-10 text-slate-400">Loading Analytics...</div>;

    const cards = [
        { title: 'Total Invoices', value: metrics.totalRequests, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { title: 'Settled', value: metrics.successfulRequests, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
        { title: 'Pending', value: metrics.failedRequests, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        { title: 'Active Merchants', value: metrics.uniqueAgents, icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    ];

    // Prepare chart data (Last 10 hours)
    const chartData = metrics.hourlyData.map(d => ({
        name: d.hour,
        requests: d.requests
    })).reverse().slice(0, 10).reverse();

    const maxRequests = Math.max(...chartData.map(d => d.requests), 5); // Minimum scale of 5

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2 rounded-lg", card.bg)}>
                                <card.icon className={cn("w-5 h-5", card.color)} />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
                        <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{card.title}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Custom CSS Bar Chart */}
                <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Invoice Volume</h3>
                        <div className="flex gap-2">
                            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Daily</span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] flex items-end justify-between gap-2 px-2 pt-8 pb-2 border-b border-slate-700/50 relative">
                        {/* Y-Axis Lines (Background) */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[10px] text-slate-600 font-mono">
                            <div className="border-b border-slate-700/30 w-full h-0"></div>
                            <div className="border-b border-slate-700/30 w-full h-0"></div>
                            <div className="border-b border-slate-700/30 w-full h-0"></div>
                            <div className="border-b border-slate-700/30 w-full h-0"></div>
                        </div>

                        {chartData.length === 0 ? (
                            <div className="w-full text-center text-slate-500 self-center">No data available</div>
                        ) : (
                            chartData.map((d, i) => {
                                const heightPercent = (d.requests / maxRequests) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-10">
                                            {d.requests} Invoices ({d.name})
                                        </div>
                                        <div
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                            className={cn(
                                                "w-full max-w-[40px] rounded-t-sm transition-all duration-500 hover:opacity-80",
                                                i === chartData.length - 1 ? "bg-purple-500" : "bg-slate-600"
                                            )}
                                        />
                                        <span className="text-[10px] text-slate-400 mt-2 font-mono truncate w-full text-center">
                                            {d.name.split(':')[0]}h
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Transactions List */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm overflow-hidden flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">Live Feed</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {metrics.recentTransactions.map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-700/30">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", tx.status === 'success' ? 'bg-green-400' : 'bg-orange-400')} />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 font-mono">{tx.agentAddress?.slice(0, 6)}...</span>
                                        <span className="text-xs font-semibold text-white">{tx.endpoint.split('/').pop()}</span>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-white bg-slate-900 px-2 py-1 rounded">
                                    {tx.amountFormatted}
                                </span>
                            </div>
                        ))}
                        {metrics.recentTransactions.length === 0 && (
                            <div className="text-center text-slate-500 py-10">Waiting for traffic...</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={cn("px-3 py-1 text-xs rounded transition", filter === 'all' ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300")}
                        >All</button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={cn("px-3 py-1 text-xs rounded transition", filter === 'pending' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                        >Pending</button>
                        <button
                            onClick={() => setFilter('settled')}
                            className={cn("px-3 py-1 text-xs rounded transition", filter === 'settled' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                        >Settled</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Invoice Hash</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4 text-right">Method</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {metrics.recentTransactions
                                .filter(tx => {
                                    if (filter === 'all') return true;
                                    if (filter === 'settled') return tx.status === 'success';
                                    if (filter === 'pending') return tx.status !== 'success';
                                    return true;
                                })
                                .slice(0, 10).map((tx, i) => (
                                    <tr key={i} className="hover:bg-slate-700/20 transition">
                                        <td className="px-6 py-4 font-mono text-white">
                                            {tx.hash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                                tx.status === 'success' ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                                            )}>
                                                {tx.status === 'success' ? 'Settled' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-xs">
                                            x402
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
