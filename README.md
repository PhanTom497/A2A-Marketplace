# 🤖 A2A Knowledge Marketplace

> **Agent-to-Agent Knowledge Marketplace with x402 Micropayments on Polygon**

A fully functional marketplace where AI agents pay micropayments (0.001 USDC per request) via the x402 HTTP payment protocol to access niche data APIs. Built for **Polygon Buildathon Wave 5**.

![Status](https://img.shields.io/badge/status-demo--ready-brightgreen)
![Network](https://img.shields.io/badge/network-Polygon%20Amoy-purple)
![Payment](https://img.shields.io/badge/payment-x402-blue)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Demo](#-running-the-demo)
- [API Reference](#-api-reference)
- [Agent Usage](#-agent-usage)
- [Dashboard](#-dashboard)
- [Docker Deployment](#-docker-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

This project demonstrates:

- **x402 Payment Protocol**: HTTP 402 "Payment Required" for API monetization
- **Polygon Integration**: Micropayments on Polygon Amoy testnet
- **AI Agent Autonomy**: Agents that automatically pay for data access
- **Real-time Dashboard**: Live metrics, revenue tracking, and transactions

### Key Features

| Feature | Description |
|---------|-------------|
| 💰 Micropayments | 0.001 USDC per API request |
| 🔗 x402 Protocol | Standard HTTP payment flow |
| ⛓️ Polygon Amoy | Fast, low-cost testnet transactions |
| 🤖 Agent Scripts | Python & TypeScript autonomous agents |
| 📊 Live Dashboard | Real-time metrics via WebSocket |
| 🐳 Docker Ready | One-command deployment |

---

## 🏗 Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│   AI Agents     │     │         Knowledge API Server         │
│  (Python/TS)    │────▶│  - Express.js + x402 Middleware      │
│                 │◀────│  - Rate Limiting                     │
└─────────────────┘     │  - Payment Verification              │
        │               └──────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌─────────────────┐     ┌──────────────────────────────────────┐
│ PayAI Facilitator│     │         Dashboard                    │
│ (Payment Verify) │     │  - WebSocket Real-time Updates       │
└─────────────────┘     │  - Chart.js Visualizations           │
        │               └──────────────────────────────────────┘
        ▼
┌─────────────────┐
│  Polygon Amoy   │
│   (USDC)        │
└─────────────────┘
```

### Payment Flow

1. Agent requests data without payment → receives **402 Payment Required**
2. Agent signs payment transaction with private key
3. Agent retries request with `X-Payment` header
4. Server verifies payment via PayAI Facilitator
5. Server returns data, updates metrics
6. Dashboard shows transaction in real-time

---

## ⚡ Quick Start

```bash
# Clone and enter directory
cd /home/baba/Polygon/a2a

# Copy environment template
cp .env.example .env

# Install dependencies
npm install

# Run the demo (test mode - no real payments)
TEST_MODE=true npm run demo
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard!

---

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Python** >= 3.8 (optional, for Python agent)
- **Wallet** with test USDC on Polygon Amoy (for real payments)

### Testnet Resources

| Resource | Link |
|----------|------|
| Polygon Amoy Faucet | https://faucet.polygon.technology/ |
| Circle USDC Faucet | https://faucet.circle.com/ |
| Polygon Explorer | https://amoy.polygonscan.com/ |

---

## 📦 Installation

```bash
# Install all dependencies
npm install

# Install API server dependencies
cd packages/api && npm install && cd ../..

# Install TypeScript agent dependencies
cd packages/agents/ts-agent && npm install && cd ../../..

# Install Python agent dependencies (optional)
pip install -r packages/agents/python-agent/requirements.txt
```

---

## ⚙️ Configuration

Copy the environment template and configure:

```bash
cp .env.example .env
```

### Required Variables

```env
# Wallet address to receive micropayments
RECEIVER_WALLET=0xYourWalletAddress

# For real payments (not needed in TEST_MODE)
AGENT_PRIVATE_KEY=0xYourAgentPrivateKey
```

### All Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `POLYGON_RPC` | Polygon Amoy RPC URL | `https://rpc-amoy.polygon.technology/` |
| `CHAIN_ID` | Chain ID | `80002` |
| `USDC_ADDRESS` | USDC contract address | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` |
| `FACILITATOR_URL` | x402 Facilitator URL | `https://facilitator.payai.network` |
| `PAYMENT_AMOUNT` | Price per request (USDC units) | `1000` (0.001 USDC) |
| `API_PORT` | API server port | `4021` |
| `WEBSOCKET_PORT` | WebSocket port | `4022` |
| `TEST_MODE` | Skip payment verification | `false` |

---

## 🚀 Running the Demo

### Option 1: E2E Demo Script (Recommended)

```bash
chmod +x scripts/e2e-demo.sh
./scripts/e2e-demo.sh
```

This will:
1. Install dependencies
2. Start the API server
3. Start the dashboard
4. Run agent demonstrations
5. Display metrics

### Option 2: Manual Start

**Terminal 1 - API Server:**
```bash
cd packages/api
npm run dev
```

**Terminal 2 - Dashboard:**
```bash
cd packages/dashboard
npx serve .
```

**Terminal 3 - Run Agent:**
```bash
# Python agent (test mode)
cd packages/agents/python-agent
python agent.py --test-mode --loop 5

# OR TypeScript agent
cd packages/agents/ts-agent
npx ts-node agent.ts --test-mode --loop 5
```

---

## 📡 API Reference

### Base URL
```
http://localhost:4021
```

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api` | GET | API information |
| `/api/metrics/summary` | GET | Dashboard metrics |
| `/api/metrics/transactions` | GET | Recent transactions |

### Protected Endpoints (Require Payment)

| Endpoint | Method | Price | Description |
|----------|--------|-------|-------------|
| `/api/v1/stablecoins/arc` | GET | 0.001 USDC | Indian stablecoin (ARC) data |
| `/api/v1/markets/latam` | GET | 0.001 USDC | LATAM market insights |
| `/api/v1/crypto/trends` | GET | 0.001 USDC | Global crypto trends |

### Payment Flow Example

**Request without payment:**
```bash
curl http://localhost:4021/api/v1/stablecoins/arc
```

**Response (402 Payment Required):**
```json
{
  "error": "Payment Required",
  "message": "This endpoint requires a payment of 0.001 USDC",
  "paymentRequired": {
    "network": "eip155:80002",
    "recipient": "0x...",
    "amount": "1000",
    "asset": "eip155:80002/erc20:0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
  }
}
```

**Request with payment:**
```bash
curl http://localhost:4021/api/v1/stablecoins/arc \
  -H "X-Payment: {\"payer\": \"0x...\", \"signature\": \"0x...\"}"
```

---

## 🤖 Agent Usage

### Python Agent

```bash
cd packages/agents/python-agent

# Test mode (no real payments)
python agent.py --test-mode

# Request specific endpoint
python agent.py --endpoint arc --test-mode

# Multiple loops with delay
python agent.py --loop 10 --delay 2 --test-mode

# Real payments (requires AGENT_PRIVATE_KEY in .env)
python agent.py --endpoint arc
```

### TypeScript Agent

```bash
cd packages/agents/ts-agent

# Test mode
npx ts-node agent.ts --test-mode

# Request specific endpoint with multiple loops
npx ts-node agent.ts --endpoint latam --loop 5 --test-mode

# Real payments
npx ts-node agent.ts --loop 3
```

### Agent CLI Options

| Option | Description |
|--------|-------------|
| `-e, --endpoint` | Endpoint: `arc`, `latam`, `trends`, `all` |
| `-l, --loop` | Number of request loops |
| `-d, --delay` | Delay between requests (seconds) |
| `-t, --test-mode` | Skip real payment verification |
| `--api-url` | Override API URL |

---

## 📊 Dashboard

Access the dashboard at [http://localhost:3000](http://localhost:3000)

### Features

- **Real-time Updates**: WebSocket connection for instant updates
- **Dark/Light Mode**: Toggle with button in header
- **Charts**: Requests over time, revenue by endpoint
- **Transaction Table**: Recent transactions with status
- **Endpoint Stats**: Per-endpoint performance metrics

### WebSocket Connection

The dashboard connects to `ws://localhost:4022` for real-time updates. Falls back to polling if WebSocket is unavailable.

---

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start API and Dashboard
docker-compose up -d

# Start with agents
docker-compose --profile agents up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Manual Docker Build

```bash
# Build development image
docker build --target dev -t a2a-api:dev .

# Build production image
docker build --target prod -t a2a-api:prod .

# Run container
docker run -p 4021:4021 -p 4022:4022 --env-file .env a2a-api:dev
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd packages/contracts
npm install
npx hardhat test
```

### API Server Tests

```bash
cd packages/api
npm test
```

### Manual Testing

```bash
# Test 402 response
curl -v http://localhost:4021/api/v1/stablecoins/arc

# Test with mock payment (test mode only)
curl http://localhost:4021/api/v1/stablecoins/arc \
  -H "X-Payment: {\"payer\": \"0xTest\", \"signature\": \"test\"}"

# Check metrics
curl http://localhost:4021/api/metrics/summary | jq
```

---

## 🔧 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 4021
lsof -ti:4021 | xargs kill -9
```

**WebSocket not connecting:**
- Ensure port 4022 is not blocked
- Dashboard falls back to polling automatically

**Payment verification failing:**
- Ensure `TEST_MODE=true` for demo
- Check facilitator URL is reachable
- Verify agent has USDC balance (for real payments)

**Agent wallet funding:**
```bash
# Fund agent wallets with test USDC
npx ts-node scripts/fundWallet.ts
```

### Getting Help

1. Check the logs: `npm run dev:api`
2. Verify configuration: `cat .env`
3. Test health endpoint: `curl http://localhost:4021/health`

---

## 📁 Project Structure

```
a2a/
├── packages/
│   ├── api/              # Express.js API server
│   │   ├── src/
│   │   │   ├── config/   # Configuration
│   │   │   ├── data/     # Mock data
│   │   │   ├── middleware/# Rate limiting
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Metrics, WebSocket, Logger
│   │   │   └── server.ts # Main server
│   │   └── package.json
│   ├── contracts/        # Solidity smart contracts
│   │   ├── contracts/    # Solidity files
│   │   ├── scripts/      # Deployment scripts
│   │   └── test/         # Contract tests
│   ├── dashboard/        # Frontend dashboard
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── agents/           # AI agent scripts
│   │   ├── python-agent/
│   │   └── ts-agent/
│   └── shared/           # Shared configuration
├── scripts/
│   ├── fundWallet.ts     # Wallet funding script
│   ├── fundWallet.py     # Python wallet funding
│   └── e2e-demo.sh       # E2E demo script
├── .env.example          # Environment template
├── docker-compose.yml    # Docker compose config
├── Dockerfile            # Multi-stage Dockerfile
└── package.json          # Root package.json
```

---

## 🏆 Wave 5 Demo Checklist

- [x] Knowledge API with x402 payment middleware
- [x] Polygon Amoy testnet integration
- [x] AI agent scripts (Python & TypeScript)
- [x] Real-time dashboard with WebSocket
- [x] Rate limiting and abuse prevention
- [x] Smart contract for revenue tracking
- [x] Docker deployment ready
- [x] Comprehensive documentation
- [x] E2E demo script

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [x402 Protocol](https://x402.org/) - Internet-native payments
- [PayAI Facilitator](https://facilitator.payai.network) - Polygon support
- [Polygon](https://polygon.technology/) - Scalable blockchain
- [Chart.js](https://chartjs.org/) - Beautiful charts

---

**Built with ❤️ for Polygon Buildathon Wave 5**
