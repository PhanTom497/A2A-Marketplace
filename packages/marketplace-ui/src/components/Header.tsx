import React from 'react';
import { NavLink } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';

export const Header: React.FC = () => {

    const getLinkClass = ({ isActive }: { isActive: boolean }) => {
        const baseClass = "font-medium text-sm transition-colors relative py-2";
        const activeClass = "text-[var(--primary)] hover:text-white after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--primary)] after:rounded-sm";
        const inactiveClass = "text-[var(--text-secondary)] hover:text-white";

        return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 py-5 bg-black/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] animate-[slideDown_0.6s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="max-w-[1400px] mx-auto px-8 flex justify-between items-center relative">
                {/* Logo */}
                <NavLink to="/" className="flex items-center gap-3 no-underline group">
                    <div className="w-[42px] h-[42px] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-lg flex items-center justify-center relative overflow-hidden group-hover:translate-x-1 transition-transform">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(255,255,255,0.2)] animate-[shimmer_3s_infinite] -translate-x-full" />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-black fill-black">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold text-white tracking-tight">A2A Market</span>
                        <span className="text-[0.65rem] font-medium text-[var(--text-dim)] uppercase tracking-widest">Agent Exchange</span>
                    </div>
                </NavLink>

                {/* Centered Navigation */}
                <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-10 items-center">
                    <NavLink to="/" className={getLinkClass} end>
                        Home
                    </NavLink>
                    <NavLink to="/marketplace" className={getLinkClass}>
                        Marketplace
                    </NavLink>
                    <NavLink to="/dashboard" className={getLinkClass}>
                        Dashboard
                    </NavLink>
                </nav>

                {/* Connect Wallet */}
                <ConnectButton.Custom>
                    {({
                        account,
                        chain,
                        openAccountModal,
                        openChainModal,
                        openConnectModal,
                        authenticationStatus,
                        mounted,
                    }) => {
                        const ready = mounted && authenticationStatus !== 'loading';
                        const connected =
                            ready &&
                            account &&
                            chain &&
                            (!authenticationStatus ||
                                authenticationStatus === 'authenticated');

                        return (
                            <div
                                {...(!ready && {
                                    'aria-hidden': true,
                                    'style': {
                                        opacity: 0,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    },
                                })}
                            >
                                {(() => {
                                    if (!connected) {
                                        return (
                                            <button onClick={openConnectModal} className="flex items-center gap-2 px-6 py-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg font-semibold text-sm text-white hover:bg-[rgba(0,255,209,0.05)] hover:border-[var(--primary)] hover:-translate-y-0.5 transition-all">
                                                <Wallet className="w-[18px] h-[18px]" />
                                                Connect Wallet
                                            </button>
                                        );
                                    }

                                    if (chain.unsupported) {
                                        return (
                                            <button onClick={openChainModal} type="button" className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-semibold">
                                                Wrong network
                                            </button>
                                        );
                                    }

                                    return (
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={openChainModal}
                                                style={{ display: 'flex', alignItems: 'center' }}
                                                type="button"
                                                className="px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm font-medium hover:border-[var(--primary)] transition-colors"
                                            >
                                                {chain.hasIcon && (
                                                    <div
                                                        style={{
                                                            background: chain.iconBackground,
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: 999,
                                                            overflow: 'hidden',
                                                            marginRight: 4,
                                                        }}
                                                    >
                                                        {chain.iconUrl && (
                                                            <img
                                                                alt={chain.name ?? 'Chain icon'}
                                                                src={chain.iconUrl}
                                                                style={{ width: 12, height: 12 }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                                {chain.name}
                                            </button>

                                            <button onClick={openAccountModal} type="button" className="px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm font-medium hover:border-[var(--primary)] transition-colors text-[var(--primary)]">
                                                {account.displayName}
                                                {account.displayBalance
                                                    ? ` (${account.displayBalance})`
                                                    : ''}
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </header>
    );
};
