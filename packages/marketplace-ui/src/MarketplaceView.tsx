import { useState } from 'react';
import axios from 'axios';
import { useAccount, useSignTypedData } from 'wagmi';

export function MarketplaceView() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <ProductCard
                title="Arc Stablecoin Analytics"
                price="0.001 USDC"
                endpoint="/api/v1/stablecoins/arc"
            />
            <ProductCard
                title="LATAM Market Trends"
                price="0.002 USDC"
                endpoint="/api/v1/markets/latam"
            />
            <ProductCard
                title="Crypto Global Trends"
                price="0.005 USDC"
                endpoint="/api/v1/crypto/trends"
            />
        </div>
    );
}

function ProductCard({ title, price, endpoint }: { title: string, price: string, endpoint: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { signTypedDataAsync } = useSignTypedData();
    const { address } = useAccount();

    const handleBuy = async () => {
        setLoading(true);
        try {
            // 1. Initial Request (Expect 402 or 200)
            try {
                const initialRes = await axios.get(`http://localhost:4021${endpoint}`);
                console.log("✅ Data received directly:", initialRes.data);
                setData(initialRes.data);
            } catch (err: any) {
                if (err.response && err.response.status === 402) {
                    const { paymentRequired } = err.response.data;
                    console.log("Payment Required:", paymentRequired);

                    if (!address) {
                        alert("Please connect your wallet first!");
                        setLoading(false);
                        return;
                    }

                    // 2. Prepare EIP-3009 TransferWithAuthorization
                    // Generate a random 32-byte hex string for nonce
                    const nonce = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');

                    const validAfter = 0;
                    const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
                    const value = BigInt(paymentRequired.amount);
                    const usdcAddress = paymentRequired.asset.split(':').pop();

                    // 3. Sign the Permit
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

                    console.log("✍️ Signed EIP-3009 Permit:", signature);

                    // 4. Construct X-Payment Header
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

                    // 5. Resend with Header
                    const res = await axios.get(`http://localhost:4021${endpoint}`, {
                        headers: {
                            'X-Payment': paymentHeader
                        }
                    });

                    setData(res.data);
                } else {
                    throw err; // Re-throw real errors
                }
            }
        } catch (e: any) {
            console.error("Purchase Failed", e);
            if (e.message.includes("User rejected")) {
                alert("Transaction rejected by user.");
            } else {
                alert(`Purchase Failed: ${e.response?.data?.message || e.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-purple-500 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">{title}</h3>
                <span className="bg-purple-900/50 text-purple-200 px-2 py-1 rounded text-xs font-mono border border-purple-500/20">{price}</span>
            </div>

            {data ? (
                <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-60 text-xs font-mono text-green-400 border border-slate-800 relative">
                    <div className="absolute top-2 right-2 text-[10px] text-slate-500 uppercase">Verified Data</div>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            ) : (
                <button
                    onClick={handleBuy}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-900/20"
                >
                    {loading ? 'Processing...' : 'Unlock Data'}
                </button>
            )}
        </div>
    )
}
