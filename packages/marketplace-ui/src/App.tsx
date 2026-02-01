import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { LayoutDashboard, ShoppingBag, Terminal } from 'lucide-react';
// import { clsx } from 'clsx';

function clsx(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}
import { DashboardView } from './DashboardView';
import { MarketplaceView } from './MarketplaceView';

function App() {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'marketplace' | 'dashboard'>('marketplace');

    return (
        <div className="min-h-screen bg-slate-900 text-white relative selection:bg-purple-500/30">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Navbar */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                            <Terminal className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 text-transparent bg-clip-text">
                                A2A Marketplace
                            </h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Human & Agent Exchange</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-800/50 p-1 rounded-lg backdrop-blur-md border border-slate-700/50">
                        <button
                            onClick={() => setActiveTab('marketplace')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                activeTab === 'marketplace'
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            )}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Marketplace
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                activeTab === 'dashboard'
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                    </div>

                    <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} />
                </header>

                {/* content */}
                <main>
                    {!isConnected ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center rotate-3 border border-slate-700 shadow-xl shadow-purple-900/20">
                                <Terminal className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Connect to Begin</h2>
                            <p className="text-slate-400 max-w-md">Access premium data streams and monitor real-time payment flows on the Polygon network.</p>
                            <div className="scale-110">
                                <ConnectButton />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-5 duration-500">
                            {activeTab === 'marketplace' ? <MarketplaceView /> : <DashboardView />}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
