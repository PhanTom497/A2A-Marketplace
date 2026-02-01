import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Metrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    uniqueAgents: number;
}

export const Stats: React.FC = () => {
    const [metrics, setMetrics] = useState<Metrics | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await axios.get('http://localhost:4021/api/metrics/summary');
                setMetrics(res.data.metrics);
            } catch (e) {
                console.error("Failed to fetch metrics", e);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
        return () => clearInterval(interval);
    }, []);

    const stats = [
        { label: 'Total Invoices', value: metrics?.totalRequests ?? '120' },
        { label: 'USDC Per Call', value: '0.001' },
        { label: 'Gasless', value: '100%' },
        { label: 'Active Merchants', value: metrics?.uniqueAgents ?? '2' },
    ];

    return (
        <section className="relative z-10 -mt-20 px-8">
            <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.6s_both]">
                {stats.map((stat, index) => (
                    <div key={index} className="p-8 bg-[rgba(10,10,10,0.3)] border border-[rgba(255,255,255,0.06)] rounded-xl text-center transition-all duration-300 hover:border-[var(--primary)] hover:-translate-y-1 hover:bg-[rgba(0,255,209,0.02)] backdrop-blur-md">
                        <div className="text-[2.5rem] font-black text-[var(--primary)] mb-2 tabular-nums">
                            {stat.value}
                        </div>
                        <div className="text-[0.85rem] text-[var(--text-dim)] uppercase tracking-widest font-semibold">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
