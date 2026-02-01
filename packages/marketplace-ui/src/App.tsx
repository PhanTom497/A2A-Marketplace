import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Stats } from './components/Stats';
import { Features } from './components/Features';
import { Marketplace } from './components/Marketplace';
import { RecentTransactions } from './components/RecentTransactions';

const Home = () => (
    <>
        <Hero />
        <Stats />
        <Features />
    </>
);

function App() {
    return (
        <Router>
            <div className="relative min-h-screen">
                {/* Animated Background */}
                <div className="animated-bg">
                    <div className="space-grid" />
                    <div className="mesh-gradient" />
                    <div className="network-nodes">
                        <div className="node" style={{ top: '20%', left: '15%', animationDelay: '0s' }}></div>
                        <div className="node" style={{ top: '60%', left: '80%', animationDelay: '1s' }}></div>
                        <div className="node" style={{ top: '40%', left: '60%', animationDelay: '2s' }}></div>
                    </div>
                    <div className="connection-line" style={{ top: '20%', left: '15%', width: '30%', transform: 'rotate(15deg)' }}></div>
                    <div className="connection-line" style={{ top: '60%', right: '20%', width: '40%', transform: 'rotate(-15deg)' }}></div>
                </div>

                <Header />
                <main className="relative z-10 pt-24">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/dashboard" element={<RecentTransactions />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>

                {/* Footer */}
                <footer className="relative z-10 py-12 border-t border-[rgba(255,255,255,0.06)] text-center text-[var(--text-dim)] text-sm">
                    <p>© 2026 A2A Market. Powered by Polygon Amoy.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
