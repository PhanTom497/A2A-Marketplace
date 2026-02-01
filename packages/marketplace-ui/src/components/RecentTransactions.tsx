import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Define interface for transaction
interface Transaction {
    hash: string;
    status: 'success' | 'pending' | 'failed';
    timestamp: string; // ISO string expected
    amountFormatted?: string;
    endpoint: string;
}

type Timeframe = 'daily' | 'weekly' | 'monthly';

export const RecentTransactions: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'pending' | 'settled'>('all');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [timeframe, setTimeframe] = useState<Timeframe>('daily');
    const [graphData, setGraphData] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/metrics/summary`);
                if (res.data.metrics && res.data.metrics.recentTransactions) {
                    setTransactions(res.data.metrics.recentTransactions);
                }
            } catch (e) {
                console.error("Failed to fetch transactions", e);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    // Process data for graph based on timeframe
    useEffect(() => {
        if (transactions.length === 0) {
            setGraphData([]);
            return;
        }

        const now = new Date();
        const dataMap = new Map<string, number>();
        let labels: string[] = [];

        // Helper to format hour AM/PM
        const formatHour = (date: Date) => {
            let hours = date.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            return `${hours}${ampm}`;
        };

        if (timeframe === 'daily') {
            // "Daily" means "Today" (00:00 to 24:00)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Generate 12 fixed buckets: 12AM-2AM, 2AM-4AM, ...
            for (let i = 0; i < 12; i++) {
                const bucketStart = new Date(today.getTime() + i * 2 * 60 * 60 * 1000);
                const bucketEnd = new Date(today.getTime() + (i + 1) * 2 * 60 * 60 * 1000);

                // e.g. "12AM - 2AM"
                const label = `${formatHour(bucketStart)} - ${formatHour(bucketEnd)}`;
                labels.push(label);
                dataMap.set(label, 0);
            }

            transactions.forEach(tx => {
                const txDate = new Date(tx.timestamp);

                // Only count transactions from "Today"
                if (txDate >= today) {
                    const hoursSinceMidnight = (txDate.getTime() - today.getTime()) / (1000 * 60 * 60);
                    const bucketIndex = Math.floor(hoursSinceMidnight / 2);

                    if (bucketIndex >= 0 && bucketIndex < 12) {
                        const label = labels[bucketIndex];
                        dataMap.set(label, (dataMap.get(label) || 0) + 1);
                    }
                }
            });

        } else if (timeframe === 'weekly') {
            // Last 7 days
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                labels.push(days[d.getDay()]);
            }

            labels.forEach(l => dataMap.set(l, 0));

            transactions.forEach(tx => {
                const txDate = new Date(tx.timestamp);
                const diffTime = Math.abs(now.getTime() - txDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) {
                    const dayName = days[txDate.getDay()];
                    dataMap.set(dayName, (dataMap.get(dayName) || 0) + 1);
                }
            });

        } else if (timeframe === 'monthly') {
            // Last 30 days, aggregated by approx weeks (4 weeks)
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            labels.forEach(l => dataMap.set(l, 0));

            transactions.forEach(tx => {
                const txDate = new Date(tx.timestamp);
                const diffTime = Math.abs(now.getTime() - txDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) {
                    let week = 4 - Math.floor(diffDays / 7);
                    if (week < 1) week = 1;
                    if (week > 4) week = 4;
                    const label = `Week ${week}`;
                    dataMap.set(label, (dataMap.get(label) || 0) + 1);
                }
            });
        }

        const finalData = labels.map(label => ({
            label,
            value: dataMap.get(label) || 0
        }));

        setGraphData(finalData);

    }, [transactions, timeframe]);


    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'all') return true;
        if (filter === 'settled') return tx.status === 'success';
        if (filter === 'pending') return tx.status !== 'success';
        return true;
    });

    const maxValue = Math.max(...graphData.map(d => d.value), 5); // Minimum scale of 5

    return (
        <section id="recent-transactions" className="py-20 px-8 relative max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Graph Section */}
                <div className="lg:col-span-3 bg-[rgba(10,10,10,0.4)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-[var(--accent)] rounded-full"></span>
                            Request Volume
                        </h3>
                        <div className="flex bg-[rgba(255,255,255,0.05)] rounded-lg p-1 border border-[rgba(255,255,255,0.06)]">
                            {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${timeframe === t
                                        ? 'bg-[var(--primary)] text-black shadow-sm'
                                        : 'text-[var(--text-secondary)] hover:text-white'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[200px] flex items-end justify-between gap-2">
                        {graphData.map((item, index) => (
                            <div key={index} className="flex flex-col items-center gap-2 flex-1 group h-full justify-end">
                                <div className="w-full bg-[rgba(255,255,255,0.03)] rounded-t-lg relative group-hover:bg-[rgba(255,255,255,0.06)] transition-colors h-full flex items-end">
                                    <div
                                        style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
                                        className="w-full bg-gradient-to-t from-[var(--primary)] to-[var(--accent)] opacity-60 group-hover:opacity-100 transition-all duration-500 rounded-t-lg relative"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-1.5 rounded-md text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-[rgba(255,255,255,0.1)] shadow-xl pointer-events-none">
                                            {item.value} reqs
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[0.65rem] text-[var(--text-secondary)] font-medium uppercase tracking-wider truncate w-full text-center">{item.label}</span>
                            </div>
                        ))}
                        {graphData.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-dim)]">
                                No data available for this timeframe
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="text-center text-[3.5rem] font-black mb-12 tracking-tight text-white">
                Recent Transactions
            </h2>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${filter === 'all' ? 'bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(0,255,209,0.3)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${filter === 'pending' ? 'bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(0,255,209,0.3)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('settled')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${filter === 'settled' ? 'bg-[var(--primary)] text-black shadow-[0_0_20px_rgba(0,255,209,0.3)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                    Settled
                </button>
            </div>

            <div className="bg-[rgba(10,10,10,0.4)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-[rgba(255,255,255,0.06)]">
                            <tr>
                                <th className="px-8 py-6 text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Invoice Hash</th>
                                <th className="px-8 py-6 text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-6 text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest text-right">Method</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.slice(0, 10).map((tx, i) => (
                                    <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                                        <td className="px-8 py-5 font-mono text-sm text-[var(--primary)]">
                                            {tx.hash || `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-block px-3 py-1 rounded border text-[0.7rem] font-bold uppercase tracking-wider ${tx.status === 'success'
                                                ? 'bg-[rgba(0,255,209,0.1)] border-[var(--primary)] text-[var(--primary)]'
                                                : 'bg-[rgba(255,184,0,0.1)] border-[var(--warning)] text-[var(--warning)]'
                                                }`}>
                                                {tx.status === 'success' ? 'Settled' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-[var(--text-secondary)]">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="inline-block px-3 py-1 bg-[rgba(123,97,255,0.1)] rounded text-xs text-[var(--accent-light)] font-mono border border-[rgba(123,97,255,0.3)]">
                                                x402
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-[var(--text-dim)]">
                                        No transactions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};
