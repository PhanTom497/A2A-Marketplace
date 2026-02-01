#!/usr/bin/env python3
"""
Wallet Funding Script (Python)
Automatically funds AI agent wallets with test USDC on Polygon Amoy
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from web3 import Web3
from eth_account import Account

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Configuration
POLYGON_RPC = os.getenv('POLYGON_RPC', 'https://rpc-amoy.polygon.technology/')
USDC_ADDRESS = os.getenv('USDC_ADDRESS', '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582')
FUNDER_PRIVATE_KEY = os.getenv('FUNDER_PRIVATE_KEY')
AGENT_PRIVATE_KEY = os.getenv('AGENT_PRIVATE_KEY')

# Amount to fund each agent (0.1 USDC = 100000 in 6 decimals)
FUNDING_AMOUNT = 100000  # 0.1 USDC

# Minimal ERC20 ABI
ERC20_ABI = [
    {
        "name": "transfer",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "outputs": [{"name": "", "type": "bool"}]
    },
    {
        "name": "balanceOf",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "account", "type": "address"}],
        "outputs": [{"name": "", "type": "uint256"}]
    }
]


def get_agent_wallets() -> list[str]:
    """Get list of agent wallet addresses to fund."""
    wallets = []
    
    # Get agent wallet from private key
    if AGENT_PRIVATE_KEY:
        account = Account.from_key(AGENT_PRIVATE_KEY)
        wallets.append(account.address)
    
    # Add any additional wallets from environment
    additional = os.getenv('ADDITIONAL_AGENT_WALLETS', '')
    for wallet in additional.split(','):
        wallet = wallet.strip()
        if wallet.startswith('0x') and len(wallet) == 42:
            wallets.append(wallet)
    
    return wallets


def format_usdc(amount: int) -> str:
    """Format USDC amount with 6 decimals."""
    return f"{amount / 1_000_000:.6f}"


def check_usdc_balance(w3: Web3, usdc_contract, address: str) -> int:
    """Check USDC balance of an address."""
    return usdc_contract.functions.balanceOf(address).call()


def fund_wallet(w3: Web3, usdc_contract, funder_account, to_address: str, amount: int) -> str:
    """Fund a wallet with USDC."""
    print(f"  Sending {format_usdc(amount)} USDC to {to_address}...")
    
    # Build transaction
    nonce = w3.eth.get_transaction_count(funder_account.address)
    
    tx = usdc_contract.functions.transfer(to_address, amount).build_transaction({
        'from': funder_account.address,
        'nonce': nonce,
        'gas': 100000,
        'gasPrice': w3.eth.gas_price,
        'chainId': 80002
    })
    
    # Sign and send
    signed_tx = w3.eth.account.sign_transaction(tx, funder_account.key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    
    print(f"  Transaction hash: {tx_hash.hex()}")
    print(f"  Waiting for confirmation...")
    
    # Wait for receipt
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    
    if receipt['status'] == 1:
        print(f"  ✅ Successfully funded {to_address}")
    else:
        print(f"  ❌ Transaction failed")
    
    return tx_hash.hex()


def main():
    print("🚀 A2A Knowledge Marketplace - Wallet Funding Script (Python)\n")
    
    # Validate configuration
    if not FUNDER_PRIVATE_KEY:
        print("❌ Error: FUNDER_PRIVATE_KEY is required in .env")
        print("\nTo fund agent wallets, you need a wallet with USDC on Polygon Amoy.")
        print("Get test USDC from: https://faucet.circle.com/")
        sys.exit(1)
    
    # Connect to network
    w3 = Web3(Web3.HTTPProvider(POLYGON_RPC))
    
    if not w3.is_connected():
        print("❌ Error: Could not connect to Polygon Amoy")
        sys.exit(1)
    
    print(f"✅ Connected to Polygon Amoy (Chain ID: {w3.eth.chain_id})")
    
    # Create funder account
    funder_account = Account.from_key(FUNDER_PRIVATE_KEY)
    print(f"💰 Funder wallet: {funder_account.address}")
    
    # Create USDC contract instance
    usdc_contract = w3.eth.contract(
        address=Web3.to_checksum_address(USDC_ADDRESS),
        abi=ERC20_ABI
    )
    
    # Check funder balance
    funder_balance = check_usdc_balance(w3, usdc_contract, funder_account.address)
    print(f"   Balance: {format_usdc(funder_balance)} USDC\n")
    
    if funder_balance == 0:
        print("❌ Error: Funder wallet has no USDC")
        print("\nGet test USDC from: https://faucet.circle.com/")
        sys.exit(1)
    
    # Get agent wallets
    agent_wallets = get_agent_wallets()
    
    if not agent_wallets:
        print("⚠️  No agent wallets found. Set AGENT_PRIVATE_KEY in .env")
        sys.exit(0)
    
    print(f"📋 Found {len(agent_wallets)} agent wallet(s) to fund:\n")
    
    # Fund each wallet
    for wallet in agent_wallets:
        print(f"\n🤖 Agent wallet: {wallet}")
        
        # Check current balance
        current_balance = check_usdc_balance(w3, usdc_contract, wallet)
        print(f"   Current balance: {format_usdc(current_balance)} USDC")
        
        # Skip if already funded
        if current_balance >= FUNDING_AMOUNT:
            print(f"   ✅ Already has sufficient balance, skipping")
            continue
        
        # Fund the wallet
        try:
            fund_wallet(w3, usdc_contract, funder_account, wallet, FUNDING_AMOUNT)
            
            # Verify new balance
            new_balance = check_usdc_balance(w3, usdc_contract, wallet)
            print(f"   New balance: {format_usdc(new_balance)} USDC")
        except Exception as e:
            print(f"   ❌ Error funding wallet: {e}")
    
    print("\n✨ Wallet funding complete!\n")
    print("📊 View transactions on Polygon Amoy Explorer:")
    print(f"   https://amoy.polygonscan.com/address/{funder_account.address}")


if __name__ == "__main__":
    main()
