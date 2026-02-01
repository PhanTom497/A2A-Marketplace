/**
 * Mock Data for Knowledge API
 * Realistic data for Indian stablecoin (ARC) and LATAM market insights
 */

// Helper to generate random variation
const vary = (base: number, percent: number = 5): number => {
    const variation = base * (percent / 100);
    return +(base + (Math.random() - 0.5) * 2 * variation).toFixed(4);
};

// Indian Stablecoin (ARC) Data
export function getARCStablecoinData() {
    const timestamp = new Date().toISOString();

    return {
        timestamp,
        network: 'Polygon',
        stablecoin: {
            name: 'ARC (Indian Rupee Coin)',
            symbol: 'ARC',
            pegCurrency: 'INR',
            contractAddress: '0x7C6b91D9Be155A6Db01f749217d76fF02A7227F2',
        },
        metrics: {
            currentPrice: {
                inr: vary(1.0, 0.5),
                usd: vary(0.012, 1),
            },
            totalSupply: vary(150000000, 3),
            circulatingSupply: vary(125000000, 3),
            marketCap: {
                inr: vary(125000000, 3),
                usd: vary(1500000, 3),
            },
            volume24h: {
                inr: vary(8500000, 10),
                usd: vary(102000, 10),
            },
            holders: Math.floor(vary(12500, 5)),
            transactions24h: Math.floor(vary(4500, 15)),
        },
        reserves: {
            totalReserves: vary(128000000, 2),
            reserveRatio: vary(1.024, 1),
            lastAudit: '2026-01-15T00:00:00Z',
            auditor: 'KPMG India',
            breakdown: {
                bankDeposits: vary(95000000, 2),
                governmentBonds: vary(25000000, 3),
                shortTermSecurities: vary(8000000, 5),
            },
        },
        adoption: {
            integratedPlatforms: 47,
            topPlatforms: [
                { name: 'Zerodha', type: 'Brokerage', volume24h: vary(2500000, 15) },
                { name: 'Razorpay', type: 'Payments', volume24h: vary(1800000, 15) },
                { name: 'Groww', type: 'Investment', volume24h: vary(1200000, 15) },
                { name: 'PhonePe', type: 'Wallet', volume24h: vary(950000, 15) },
            ],
            geographicDistribution: {
                'Maharashtra': 28,
                'Karnataka': 18,
                'Delhi NCR': 15,
                'Tamil Nadu': 12,
                'Gujarat': 10,
                'Others': 17,
            },
        },
        regulatory: {
            status: 'RBI Sandbox Approved',
            license: 'Digital Asset License (Provisional)',
            complianceScore: 94,
            kycEnabled: true,
        },
    };
}

// LATAM Market Insights
export function getLATAMMarketData() {
    const timestamp = new Date().toISOString();

    return {
        timestamp,
        region: 'Latin America',
        overview: {
            totalCryptoUsers: Math.floor(vary(68000000, 5)),
            yearOverYearGrowth: vary(42.5, 10),
            dominantUseCase: 'Remittances',
            regulatoryClimate: 'Mixed - Improving',
        },
        countries: [
            {
                name: 'Brazil',
                code: 'BR',
                cryptoAdoption: vary(16.2, 5),
                preferredAssets: ['BTC', 'ETH', 'USDT', 'SOL'],
                volume24h: vary(850000000, 10),
                topExchanges: ['Mercado Bitcoin', 'Binance BR', 'Foxbit'],
                regulatory: 'Favorable - Crypto Law 2022',
                stablecoinUsage: vary(35.5, 8),
            },
            {
                name: 'Argentina',
                code: 'AR',
                cryptoAdoption: vary(12.8, 5),
                preferredAssets: ['USDT', 'USDC', 'DAI', 'BTC'],
                volume24h: vary(320000000, 10),
                topExchanges: ['Ripio', 'Lemon Cash', 'Buenbit'],
                regulatory: 'Neutral - No specific framework',
                stablecoinUsage: vary(68.2, 8),
                note: 'High stablecoin usage due to peso volatility',
            },
            {
                name: 'Mexico',
                code: 'MX',
                cryptoAdoption: vary(14.5, 5),
                preferredAssets: ['BTC', 'ETH', 'USDT', 'XRP'],
                volume24h: vary(420000000, 10),
                topExchanges: ['Bitso', 'Binance MX', 'Volabit'],
                regulatory: 'Regulated - Fintech Law',
                stablecoinUsage: vary(28.4, 8),
            },
            {
                name: 'Colombia',
                code: 'CO',
                cryptoAdoption: vary(8.6, 5),
                preferredAssets: ['BTC', 'USDT', 'ETH'],
                volume24h: vary(180000000, 10),
                topExchanges: ['Buda', 'Binance', 'Bitpoint'],
                regulatory: 'Sandbox Testing',
                stablecoinUsage: vary(41.2, 8),
            },
        ],
        trends: {
            remittances: {
                totalVolume: vary(95000000000, 5),
                cryptoShare: vary(8.5, 10),
                growthRate: vary(125, 15),
                topCorridors: [
                    { from: 'USA', to: 'Mexico', volume: vary(42000000000, 5) },
                    { from: 'USA', to: 'Brazil', volume: vary(12000000000, 5) },
                    { from: 'Spain', to: 'Argentina', volume: vary(8500000000, 5) },
                ],
            },
            defi: {
                tvlLatam: vary(2800000000, 8),
                topProtocols: ['Aave', 'Compound', 'MakerDAO', 'Lido'],
                yieldFarming: vary(18.5, 15),
            },
            nft: {
                volume30d: vary(45000000, 15),
                topCategories: ['Art', 'Gaming', 'Sports'],
                growthRate: vary(85, 20),
            },
        },
        forecast: {
            users2027: Math.floor(vary(120000000, 10)),
            expectedGrowthCagr: vary(28.5, 8),
            keyDrivers: [
                'Currency instability',
                'Remittance cost reduction',
                'DeFi yield opportunities',
                'Regulatory clarity',
            ],
        },
    };
}

// Crypto Trends Analysis
export function getCryptoTrendsData() {
    const timestamp = new Date().toISOString();

    return {
        timestamp,
        globalMetrics: {
            totalMarketCap: vary(2850000000000, 3),
            btcDominance: vary(52.4, 2),
            ethDominance: vary(17.8, 3),
            altcoinSeason: false,
            fearGreedIndex: Math.floor(vary(62, 15)),
        },
        trending: {
            gainers24h: [
                { symbol: 'SOL', name: 'Solana', change: vary(8.5, 30) },
                { symbol: 'AVAX', name: 'Avalanche', change: vary(6.2, 30) },
                { symbol: 'LINK', name: 'Chainlink', change: vary(5.8, 30) },
                { symbol: 'MATIC', name: 'Polygon', change: vary(4.9, 30) },
                { symbol: 'DOT', name: 'Polkadot', change: vary(4.2, 30) },
            ],
            losers24h: [
                { symbol: 'DOGE', name: 'Dogecoin', change: vary(-3.2, 30) },
                { symbol: 'SHIB', name: 'Shiba Inu', change: vary(-2.8, 30) },
                { symbol: 'XRP', name: 'Ripple', change: vary(-2.1, 30) },
            ],
            mostTraded: [
                { symbol: 'BTC', volume24h: vary(28000000000, 10) },
                { symbol: 'ETH', volume24h: vary(15000000000, 10) },
                { symbol: 'USDT', volume24h: vary(52000000000, 10) },
            ],
        },
        sectors: {
            defi: {
                tvl: vary(85000000000, 5),
                change24h: vary(2.4, 50),
                topProtocols: ['Lido', 'Aave', 'MakerDAO', 'Uniswap', 'Compound'],
            },
            layer2: {
                tvl: vary(28000000000, 5),
                change24h: vary(4.2, 50),
                leaders: ['Arbitrum', 'Optimism', 'Polygon zkEVM', 'Base', 'zkSync'],
            },
            gaming: {
                volume24h: vary(1200000000, 10),
                activeUsers: Math.floor(vary(2500000, 10)),
                topGames: ['Axie Infinity', 'The Sandbox', 'Illuvium'],
            },
            ai: {
                marketCap: vary(12000000000, 8),
                change7d: vary(15.8, 30),
                topTokens: ['FET', 'OCEAN', 'AGIX', 'RNDR'],
            },
        },
        onChain: {
            btcActiveAddresses: Math.floor(vary(850000, 10)),
            ethGasPrice: vary(25, 30),
            stablecoinSupply: vary(145000000000, 3),
            defiUsers: Math.floor(vary(6800000, 8)),
        },
        sentiment: {
            socialMentions: {
                btc: Math.floor(vary(125000, 15)),
                eth: Math.floor(vary(85000, 15)),
                sol: Math.floor(vary(42000, 15)),
            },
            newsScore: vary(65, 20),
            developerActivity: vary(78, 10),
        },
    };
}

export default {
    getARCStablecoinData,
    getLATAMMarketData,
    getCryptoTrendsData,
};
