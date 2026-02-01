import React from 'react';
import { LayoutDashboard, Zap, Globe, Coins, ShieldCheck, Terminal } from 'lucide-react';

export const Features: React.FC = () => {
    const features = [
        {
            icon: <Zap className="w-8 h-8" />,
            tag: "EIP-3009",
            title: "Gasless Transactions",
            description: "Uses TransferWithAuthorization (EIP-3009) so the facilitator pays gas. Agents and users can buy data with just USDC—no POL required."
        },
        {
            icon: <LayoutDashboard className="w-8 h-8" />,
            tag: "Live Feed",
            title: "Real-time Dashboard",
            description: "WebSocket-powered analytics of every transaction. Live monitoring provides instant insights into marketplace activity and knowledge consumption."
        },
        {
            icon: <Globe className="w-8 h-8" />,
            tag: "HTTP 402",
            title: "x402 Protocol",
            description: "Standardized HTTP 402 \"Payment Required\" flow enables seamless integration with any API client. Universal protocol for pay-per-request knowledge access."
        },
        {
            icon: <ShieldCheck className="w-8 h-8" />,
            tag: "Verified",
            title: "Corbits Facilitator",
            description: "Integration with Corbits for verifying signatures off-chain. Ensures secure, trustless settlement while maintaining decentralization and transparency."
        },
        {
            icon: <Coins className="w-8 h-8" />,
            tag: "0.001 USDC",
            title: "Atomic Micropayments",
            description: "Request-level pricing at 0.001 USDC enables cost-effective data consumption. Perfect for AI agents making thousands of queries without subscriptions."
        },
        {
            icon: <Terminal className="w-8 h-8" />,
            tag: "Autonomous",
            title: "Agent-First Design",
            description: "Built for autonomous AI agents to discover, purchase, and consume knowledge APIs seamlessly. Machine-readable contracts with instant settlement."
        }
    ];

    return (
        <section className="py-32 px-8 relative">
            <div className="max-w-[800px] mx-auto text-center mb-20">
                <div className="inline-block px-4 py-1.5 bg-[rgba(0,255,209,0.05)] border border-[rgba(0,255,209,0.2)] rounded-full text-xs font-bold text-[var(--primary)] mb-6 uppercase tracking-widest">
                    Features
                </div>
                <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-black mb-6 leading-[1.1] tracking-tight text-white">
                    Built for the Agent <br />
                    <span className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">Economy</span>
                </h2>
                <p className="text-xl text-[var(--text-secondary)] leading-relaxed">
                    Gasless micropayments powered by EIP-3009, enabling seamless agent-to-agent knowledge exchange at scale.
                </p>
            </div>

            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <div key={index} className="p-10 bg-[rgba(10,10,10,0.4)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-all duration-400 group hover:border-[rgba(0,255,209,0.3)] hover:-translate-y-2 hover:bg-[rgba(0,255,209,0.02)] relative">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                        <div className="w-14 h-14 bg-[rgba(0,255,209,0.1)] rounded-xl flex items-center justify-center text-[var(--primary)] mb-6 border border-[rgba(0,255,209,0.2)] transition-all duration-300 group-hover:bg-[rgba(0,255,209,0.15)] group-hover:border-[var(--primary)] group-hover:scale-110">
                            {feature.icon}
                        </div>

                        <h3 className="text-[1.4rem] font-bold mb-4 text-white tracking-tight">{feature.title}</h3>
                        <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-[0.95rem]">
                            {feature.description}
                        </p>

                        <div className="inline-block px-3 py-1.5 bg-[rgba(0,255,209,0.08)] border border-[rgba(0,255,209,0.25)] rounded-md text-[0.7rem] font-bold text-[var(--primary)] uppercase tracking-wider">
                            {feature.tag}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
