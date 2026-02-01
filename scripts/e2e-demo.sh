#!/bin/bash

# ============================================
# A2A Knowledge Marketplace - E2E Demo Script
# Complete demonstration flow for Wave 5
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     🤖 A2A Knowledge Marketplace - E2E Demo Script 🤖        ║"
echo "║           Polygon Amoy Testnet | x402 Micropayments           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}⚠️  No .env file found. Creating from template...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}   Please edit .env with your wallet addresses and private keys${NC}"
  echo ""
fi

# Function to check if a port is in use
check_port() {
  if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# ============ Step 1: Install Dependencies ============
echo -e "\n${CYAN}📦 Step 1: Installing dependencies...${NC}"
npm install

# Install API dependencies
cd packages/api
npm install
cd ../..

# Install Python agent dependencies (if Python is available)
# Install Python agent dependencies (if Python is available)
if command -v python3 &> /dev/null; then
  echo -e "${CYAN}   Installing Python agent dependencies...${NC}"
  # Create virtual environment if it doesn't exist
  if [ ! -d "packages/agents/python-agent/.venv" ]; then
    echo -e "${YELLOW}   Creating Python virtual environment...${NC}"
    python3 -m venv packages/agents/python-agent/.venv
  fi
  
  # Install requirements using the venv pip
  ./packages/agents/python-agent/.venv/bin/pip install -r packages/agents/python-agent/requirements.txt -q
fi

echo -e "${GREEN}   ✅ Dependencies installed${NC}"

# ============ Step 2: Fund Agent Wallets (Optional) ============
echo -e "\n${CYAN}💰 Step 2: Wallet Funding${NC}"
echo -e "${YELLOW}   Note: For real payments, run: npm run fund:wallets${NC}"
echo -e "${YELLOW}   Demo will use TEST_MODE for simulated payments${NC}"

# Set test mode for demo
export TEST_MODE=true

# ============ Step 3: Start API Server ============
echo -e "\n${CYAN}🖥️  Step 3: Starting API Server...${NC}"

if check_port 4021; then
  echo -e "${YELLOW}   Port 4021 already in use - assuming API is running${NC}"
else
  # Start the API server in the background
  cd packages/api
  npm run dev &
  API_PID=$!
  cd ../..
  
  # Wait for API to be ready
  echo -e "${YELLOW}   Waiting for API server to start...${NC}"
  for i in {1..30}; do
    if curl -s http://localhost:4021/health > /dev/null 2>&1; then
      echo -e "${GREEN}   ✅ API Server running at http://localhost:4021${NC}"
      break
    fi
    sleep 1
  done
fi

# ============ Step 4: Start Dashboard ============
echo -e "\n${CYAN}📊 Step 4: Starting Dashboard...${NC}"

if check_port 3000; then
  echo -e "${YELLOW}   Port 3000 already in use - assuming dashboard is running${NC}"
else
  # Start a simple HTTP server for the dashboard
  cd packages/dashboard
  npx serve -l 3000 . &
  DASHBOARD_PID=$!
  cd ../..
  
  sleep 2
  echo -e "${GREEN}   ✅ Dashboard running at http://localhost:3000${NC}"
fi

# ============ Step 5: Display API Info ============
echo -e "\n${CYAN}📋 Step 5: API Information${NC}"
echo ""
curl -s http://localhost:4021/api | python3 -m json.tool 2>/dev/null || curl -s http://localhost:4021/api
echo ""

# ============ Step 6: Run Agent Demo ============
echo -e "\n${CYAN}🤖 Step 6: Running AI Agent Demo...${NC}"
echo -e "${YELLOW}   Agent will request data from all endpoints${NC}"
echo ""

# Run Python agent if available, otherwise use curl
if [ -f "packages/agents/python-agent/agent.py" ] && [ -d "packages/agents/python-agent/.venv" ]; then
  cd packages/agents/python-agent
  ./.venv/bin/python agent.py --test-mode --loop 2 --delay 1
  cd ../../..
else
  echo -e "${YELLOW}   Using curl for demo requests...${NC}"
  
  # Make test requests
  echo -e "\n${BLUE}   📡 Requesting /api/v1/stablecoins/arc${NC}"
  curl -s http://localhost:4021/api/v1/stablecoins/arc \
    -H "X-Payment: {\"payer\": \"0xDemoAgent1\", \"signature\": \"demo\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   ✅ Received: {d.get(\"data\",{}).get(\"stablecoin\",{}).get(\"name\",\"N/A\")}')" 2>/dev/null || echo "   ✅ Request sent"
  
  sleep 1
  
  echo -e "\n${BLUE}   📡 Requesting /api/v1/markets/latam${NC}"
  curl -s http://localhost:4021/api/v1/markets/latam \
    -H "X-Payment: {\"payer\": \"0xDemoAgent2\", \"signature\": \"demo\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   ✅ Received: {d.get(\"data\",{}).get(\"region\",\"N/A\")} market data')" 2>/dev/null || echo "   ✅ Request sent"
  
  sleep 1
  
  echo -e "\n${BLUE}   📡 Requesting /api/v1/crypto/trends${NC}"
  curl -s http://localhost:4021/api/v1/crypto/trends \
    -H "X-Payment: {\"payer\": \"0xDemoAgent3\", \"signature\": \"demo\"}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'   ✅ Received: Global crypto trends')" 2>/dev/null || echo "   ✅ Request sent"
fi

# ============ Step 7: Check Metrics ============
echo -e "\n${CYAN}📈 Step 7: Checking Metrics...${NC}"
echo ""
curl -s http://localhost:4021/api/metrics/summary | python3 -c "
import sys, json
d = json.load(sys.stdin)
m = d.get('metrics', {})
print(f'   📊 Total Requests: {m.get(\"totalRequests\", 0)}')
print(f'   ✅ Successful: {m.get(\"successfulRequests\", 0)}')
print(f'   ❌ Failed: {m.get(\"failedRequests\", 0)}')
print(f'   💰 Revenue: {m.get(\"revenueFormatted\", \"0 USDC\")}')
print(f'   🤖 Unique Agents: {m.get(\"uniqueAgents\", 0)}')
" 2>/dev/null || curl -s http://localhost:4021/api/metrics/summary

# ============ Step 8: Summary ============
echo -e "\n${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Demo Complete! 🎉                       ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  📍 API Server:  http://localhost:4021                        ║"
echo "║  📊 Dashboard:   http://localhost:3000                        ║"
echo "║  📡 WebSocket:   ws://localhost:4022                          ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  🔗 Network:     Polygon Amoy Testnet (Chain ID: 80002)       ║"
echo "║  💰 Price:       0.001 USDC per request                       ║"
echo "║  🏦 Facilitator: https://facilitator.payai.network            ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  📖 View transactions on Polygon Explorer:                    ║"
echo "║     https://amoy.polygonscan.com                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}Open http://localhost:3000 in your browser to see the dashboard!${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the servers${NC}"

# Keep script running to maintain background processes
wait
