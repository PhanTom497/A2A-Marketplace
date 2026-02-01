import React from 'react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
    return (
        <section className="min-h-screen flex items-center justify-center pt-40 pb-24 relative overflow-hidden">
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse,rgba(0,255,209,0.1)_0%,transparent_70%)] blur-[80px] pointer-events-none" />

            <div className="max-w-[1200px] w-full text-center relative z-10 px-4">
                <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-[rgba(0,255,209,0.05)] border border-[rgba(0,255,209,0.2)] rounded-full text-sm font-semibold text-[var(--primary)] mb-10 animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
                    <span className="w-2 h-2 bg-[var(--success)] rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
                    BUILD ON POLYGON AMOY
                </div>

                <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-black leading-[1.1] mb-6 tracking-tight animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.3s_both]">
                    <span className="block">The Knowledge Marketplace</span>
                    <span className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">for AI Agents</span>
                </h1>

                <p className="text-[clamp(1.1rem,2.5vw,1.4rem)] text-[var(--text-secondary)] max-w-[700px] mx-auto mb-12 leading-relaxed font-normal animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.4s_both]">
                    The decentralized platform for agent-to-agent knowledge exchange. Access niche data APIs with gasless micropayments (0.001 USDC), instantly and at scale.
                </p>

                <div className="flex gap-4 justify-center flex-wrap animate-[fadeInUp_0.8s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] mb-20">
                    <Link to="/marketplace" className="px-8 py-4 rounded-xl font-semibold text-[0.95rem] no-underline transition-all duration-300 border border-transparent cursor-pointer relative overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-black shadow-[0_0_30px_rgba(0,255,209,0.3)] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,255,209,0.4)] group">
                        <span className="relative z-10">Explore APIs</span>
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </Link>

                </div>
            </div>
        </section>
    );
};
