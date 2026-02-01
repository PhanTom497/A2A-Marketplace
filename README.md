# 🤖 A2A Knowledge Marketplace (Polygon Buildathon Wave 5)

> **Agent-to-Agent & Human-to-Agent Exchange with Gasless Micropayments**

A fully functional marketplace on **Polygon Amoy** where users and AI agents can pay micropayments (0.001 USDC) to access niche data APIs.

It features **Gasless Transactions** (via EIP-3009), meaning any user with USDC can transact **without needing POL for gas fees**.

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Network](https://img.shields.io/badge/network-Polygon%20Amoy-purple)
![Payment](https://img.shields.io/badge/payment-x402%20(Gasless)-blue)

---

## ✨ Features

*   **Gasless Payments:** Uses `TransferWithAuthorization` (EIP-3009) so the facilitator pays the gas.
*   **Real-time Dashboard:** WebSocket-powered analytics of every transaction.
*   **x402 Protocol:** Standardized HTTP 402 "Payment Required" flow.
*   **Corbits Facilitator:** Integration with Corbits for verifying signatures off-chain.

---

## 🏗 Architecture

**Monorepo Structure:**
*   `packages/marketplace-ui`: The Frontend (React + Vite + Tailwind).
*   `packages/api`: The Backend (Express + x402 Middleware).

---

## ⚡ Quick Start

### 1. Prerequisites
*   Node.js (v18+)
*   Metamask Wallet (connected to Polygon Amoy)
*   **Test USDC** on Amoy (Contract: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`)

### 2. Configure Environment
Create a `.env` file in the root `a2a/` directory:

```env
# Network
POLYGON_RPC=https://rpc-amoy.polygon.technology/
CHAIN_ID=80002

# Payments (Amoy USDC)
USDC_ADDRESS=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582
FACILITATOR_URL=https://facilitator.corbits.dev
PAYMENT_AMOUNT=1000

# Server
API_PORT=4021
WEBSOCKET_PORT=4022
RECEIVER_WALLET=0x742d35Cc6634C0532925a3b844Bc454e4438f44e

# Features
TEST_MODE=false
```

### 3. Run the Project
Open two terminals to run the backend and frontend simultaneously.

**Terminal 1: API Server**
```bash
cd packages/api
npm install
npm run dev
```
*Server runs at: http://localhost:4021*

**Terminal 2: Marketplace UI**
```bash
cd packages/marketplace-ui
npm install
npm run dev
```
*UI runs at: http://localhost:3000*

---

## 🎮 How to Demo

1.  Open **[http://localhost:3000](http://localhost:3000)**.
2.  Connect your MetaMask wallet.
3.  Click **"Unlock Data"** on any dataset (e.g., Arc Stablecoin Analytics).
4.  **Sign the Permit**: A signature request will pop up. This is a **gasless** EIP-3009 permit.
5.  **Success**: The button will turn green, and the JSON data will be revealed.
6.  **Check Dashboard**: Switch to the "Dashboard" tab to see your transaction appear in real-time with the timestamp.

---

## 🔍 API Reference

**Protected Endpoint**: `GET /api/v1/stablecoins/arc`
*   **Returns**: 402 Payment Required
*   **Header**: `X-Payment` (Requires signed EIP-3009 payload)
*   **Price**: 0.001 USDC

---

## 🛠 Troubleshooting

**"PaymentVerifier Error"**
*   Ensure your wallet has Amoy USDC.
*   Ensure `TEST_MODE=false`.

**"Port already in use"**
*   Run `lsof -ti:4021 | xargs kill -9` to clear the API port.
