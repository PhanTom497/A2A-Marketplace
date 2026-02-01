import React, { useState } from 'react';
import axios from 'axios';
import { useAccount, useSignTypedData } from 'wagmi';

export const Marketplace: React.FC = () => {
    return (
        <section id="marketplace" className="py-24 px-8 relative">
            <div className="max-w-[1600px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16 animate-in fade-in duration-700">
                    <ProductCard
                        title="Arc Stablecoin Analytics"
                        price="0.001 USDC"
                        endpoint="/api/v1/stablecoins/arc"
                        description="Comprehensive analytics for stablecoin movements across Arc protocol."
                    />
                    <ProductCard
                        title="LATAM Market Trends"
                        price="0.002 USDC"
                        endpoint="/api/v1/markets/latam"
                        description="Real-time market trend analysis for the LATAM region."
                    />
                    <ProductCard
                        title="Crypto Global Trends"
                        price="0.005 USDC"
                        endpoint="/api/v1/crypto/trends"
                        description="Global cryptocurrency trend data aggregated from multiple sources."
                    />
                </div>
            </div>
        </section>
    );
};

function ProductCard({ title, price, endpoint, description }: { title: string, price: string, endpoint: string, description: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { signTypedDataAsync } = useSignTypedData();
    const { address } = useAccount();

    const handleBuy = async () => {
        setLoading(true);
        try {
            try {
                const initialRes = await axios.get(`http://localhost:4021${endpoint}`);
                console.log("✅ Data received directly:", initialRes.data);
                setData(initialRes.data);
            } catch (err: any) {
                if (err.response && err.response.status === 402) {
                    const { paymentRequired } = err.response.data;

                    if (!address) {
                        alert("Please connect your wallet first!");
                        setLoading(false);
                        return;
                    }

                    const nonce = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');

                    const validAfter = 0;
                    const validBefore = Math.floor(Date.now() / 1000) + 3600;
                    const value = BigInt(paymentRequired.amount);
                    const usdcAddress = paymentRequired.asset.split(':').pop();

                    const signature = await signTypedDataAsync({
                        domain: {
                            name: "USD Coin",
                            version: "2",
                            chainId: 80002,
                            verifyingContract: usdcAddress as `0x${string}`,
                        },
                        types: {
                            TransferWithAuthorization: [
                                { name: 'from', type: 'address' },
                                { name: 'to', type: 'address' },
                                { name: 'value', type: 'uint256' },
                                { name: 'validAfter', type: 'uint256' },
                                { name: 'validBefore', type: 'uint256' },
                                { name: 'nonce', type: 'bytes32' },
                            ]
                        },
                        primaryType: 'TransferWithAuthorization',
                        message: {
                            from: address,
                            to: paymentRequired.recipient,
                            value: value,
                            validAfter: BigInt(validAfter),
                            validBefore: BigInt(validBefore),
                            nonce: nonce as `0x${string}`,
                        }
                    });

                    const paymentHeader = JSON.stringify({
                        x402Version: 1,
                        network: "eip155:80002",
                        scheme: "exact",
                        payload: {
                            payer: address,
                            currency: usdcAddress,
                            amount: value.toString(),
                            nonce: nonce,
                            validAfter: validAfter,
                            validBefore: validBefore,
                            signature: signature,
                            version: "1"
                        }
                    });

                    const res = await axios.get(`http://localhost:4021${endpoint}`, {
                        headers: {
                            'X-Payment': paymentHeader
                        }
                    });

                    setData(res.data);
                } else {
                    throw err;
                }
            }
        } catch (e: any) {
            console.error("Purchase Failed", e);
            if (e.message?.includes("User rejected")) {
                alert("Transaction rejected by user.");
            } else {
                alert(`Purchase Failed: ${e.response?.data?.message || e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[rgba(10,10,10,0.6)] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden transition-all duration-400 hover:border-[rgba(0,255,209,0.4)] hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,255,209,0.1)] cursor-pointer flex flex-col group h-full">
            <div className="p-8 bg-gradient-to-br from-[rgba(0,255,209,0.05)] to-[rgba(123,97,255,0.05)] border-b border-[rgba(255,255,255,0.06)] relative">
                <h3 className="text-[1.4rem] font-bold mb-3 text-white">{title}</h3>
                <div className="font-mono text-xs text-[var(--primary)] px-3 py-1.5 bg-[rgba(0,255,209,0.1)] rounded-md inline-block mb-4">
                    {endpoint}
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-black/40 border border-[var(--primary)] rounded-lg font-bold text-[0.95rem] text-[var(--primary)] w-fit">
                    {price}
                </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6 flex-1">
                    {description}
                </p>

                {data ? (
                    <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60 text-xs font-mono text-green-400 border border-white/10 relative shadow-inner">
                        <div className="absolute top-2 right-2 text-[10px] text-slate-500 uppercase font-bold tracking-wider">Verified Data</div>
                        <pre>{JSON.stringify(data, null, 2)}</pre>
                    </div>
                ) : (
                    <button
                        onClick={handleBuy}
                        disabled={loading}
                        className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-black shadow-[0_0_20px_rgba(0,255,209,0.2)] hover:shadow-[0_0_30px_rgba(0,255,209,0.4)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Access via Micropayment'}
                    </button>
                )}
            </div>
        </div>
    );
}
