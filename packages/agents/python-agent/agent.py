#!/usr/bin/env python3
"""
A2A Knowledge Marketplace - Python AI Agent
Autonomous agent that requests data and pays via x402
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

# Load environment variables
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)


class Config:
    """Agent configuration from environment"""
    
    def __init__(self):
        self.api_url = os.getenv('API_URL', 'http://localhost:4021')
        self.polygon_rpc = os.getenv('POLYGON_RPC', 'https://rpc-amoy.polygon.technology/')
        self.agent_private_key = os.getenv('AGENT_PRIVATE_KEY', '')
        self.usdc_address = os.getenv('USDC_ADDRESS', '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582')
        self.payment_amount = int(os.getenv('PAYMENT_AMOUNT', '1000'))
        self.test_mode = os.getenv('TEST_MODE', 'false').lower() == 'true'
        
        # Endpoints
        self.endpoints = {
            'arc': '/api/v1/stablecoins/arc',
            'latam': '/api/v1/markets/latam',
            'trends': '/api/v1/crypto/trends',
        }
    
    def validate(self) -> list:
        errors = []
        if not self.agent_private_key and not self.test_mode:
            errors.append('AGENT_PRIVATE_KEY is required when not in test mode')
        return errors


class Logger:
    """Simple colored logger"""
    
    COLORS = {
        'info': '\033[36m',     # Cyan
        'success': '\033[32m',  # Green
        'warning': '\033[33m',  # Yellow
        'error': '\033[31m',    # Red
        'reset': '\033[0m',
    }
    
    @staticmethod
    def log(level: str, message: str):
        color = Logger.COLORS.get(level, '')
        reset = Logger.COLORS['reset']
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"{color}[{timestamp}] [{level.upper()}] {message}{reset}")
    
    @staticmethod
    def info(message: str):
        Logger.log('info', message)
    
    @staticmethod
    def success(message: str):
        Logger.log('success', message)
    
    @staticmethod
    def warning(message: str):
        Logger.log('warning', message)
    
    @staticmethod
    def error(message: str):
        Logger.log('error', message)


class A2AAgent:
    """AI Agent for A2A Knowledge Marketplace"""
    
    def __init__(self, config: Config):
        self.config = config
        self.session = requests.Session()
        self.wallet = None
        self.w3 = None
        
        # Initialize wallet if valid private key provided (not a placeholder)
        pk = config.agent_private_key
        is_valid_pk = pk and pk.startswith('0x') and len(pk) == 66 and not 'YOUR' in pk.upper()
        
        if is_valid_pk and not config.test_mode:
            try:
                self.wallet = Account.from_key(pk)
                self.w3 = Web3(Web3.HTTPProvider(config.polygon_rpc))
                Logger.info(f"Agent wallet: {self.wallet.address}")
            except Exception as e:
                Logger.warning(f"Could not initialize wallet: {e}")
    
    def request_data(
        self,
        endpoint: str,
        max_retries: int = 3,
        retry_delay: float = 2.0,
    ) -> dict:
        """
        Request data from an endpoint with automatic payment handling
        
        Args:
            endpoint: API endpoint to request
            max_retries: Maximum retry attempts
            retry_delay: Base delay between retries (exponential backoff)
        
        Returns:
            API response data
        """
        url = f"{self.config.api_url}{endpoint}"
        Logger.info(f"Requesting: {endpoint}")
        
        for attempt in range(max_retries):
            try:
                # Make initial request
                response = self.session.get(url)
                
                if response.status_code == 200:
                    # Success - data received
                    data = response.json()
                    Logger.success(f"Data received from {endpoint}")
                    return data
                
                elif response.status_code == 402:
                    # Payment required
                    Logger.info("Payment required - processing...")
                    
                    # Parse payment requirements
                    payment_required = response.json().get('paymentRequired', {})
                    
                    if not payment_required:
                        # Try header
                        payment_header = response.headers.get('X-Payment-Required')
                        if payment_header:
                            payment_required = json.loads(payment_header)
                    
                    if not payment_required:
                        raise Exception("No payment requirements received")
                    
                    # Create payment
                    payment = self._create_payment(payment_required)
                    
                    # Retry with payment
                    Logger.info("Retrying with payment...")
                    response = self.session.get(
                        url,
                        headers={'X-Payment': json.dumps(payment)}
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        Logger.success(f"✅ Payment successful! Data received from {endpoint}")
                        return data
                    else:
                        Logger.warning(f"Payment rejected: {response.text}")
                        raise Exception(f"Payment rejected: {response.status_code}")
                
                elif response.status_code == 429:
                    # Rate limited
                    retry_after = int(response.headers.get('Retry-After', retry_delay))
                    Logger.warning(f"Rate limited - waiting {retry_after}s...")
                    time.sleep(retry_after)
                    continue
                
                else:
                    raise Exception(f"Unexpected status: {response.status_code} - {response.text}")
            
            except Exception as e:
                Logger.warning(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
                
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                    Logger.info(f"Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    Logger.error(f"All {max_retries} attempts failed")
                    raise
        
        raise Exception("Request failed after all retries")
    
    def _create_payment(self, payment_required: dict) -> dict:
        """
        Create a signed payment for the x402 protocol
        
        Args:
            payment_required: Payment requirements from 402 response
        
        Returns:
            Signed payment object
        """
        if self.config.test_mode:
            Logger.info("🧪 Test mode: Creating mock payment")
            return {
                'payer': 'test-agent-address',
                'signature': 'test-signature',
                'testMode': True,
            }
        
        if not self.wallet:
            raise Exception("No wallet configured - set AGENT_PRIVATE_KEY")
        
        # Create payment message
        payment_data = {
            'network': payment_required.get('network', 'eip155:80002'),
            'recipient': payment_required.get('recipient'),
            'amount': payment_required.get('amount'),
            'asset': payment_required.get('asset'),
            'nonce': int(time.time() * 1000),
            'expiry': payment_required.get('expires'),
        }
        
        # Sign the payment
        message = json.dumps(payment_data, sort_keys=True)
        message_hash = encode_defunct(text=message)
        signed = self.wallet.sign_message(message_hash)
        
        payment = {
            'payer': self.wallet.address,
            'paymentData': payment_data,
            'signature': signed.signature.hex(),
        }
        
        Logger.info(f"Payment signed: {self.wallet.address}")
        return payment
    
    def run_demo(self, endpoints: list = None, loop_count: int = 1, delay: float = 2.0):
        """
        Run demonstration of agent requesting data
        
        Args:
            endpoints: List of endpoints to request (default: all)
            loop_count: Number of request loops
            delay: Delay between requests
        """
        if endpoints is None:
            endpoints = list(self.config.endpoints.values())
        
        Logger.info(f"🤖 Starting A2A Agent Demo")
        Logger.info(f"   API URL: {self.config.api_url}")
        Logger.info(f"   Test Mode: {self.config.test_mode}")
        Logger.info(f"   Endpoints: {len(endpoints)}")
        Logger.info(f"   Loops: {loop_count}")
        print()
        
        total_requests = 0
        successful_requests = 0
        
        for loop in range(loop_count):
            if loop > 0:
                Logger.info(f"--- Loop {loop + 1}/{loop_count} ---")
            
            for endpoint in endpoints:
                try:
                    data = self.request_data(endpoint)
                    total_requests += 1
                    successful_requests += 1
                    
                    # Print summary of received data
                    if 'data' in data:
                        timestamp = data['data'].get('timestamp', 'N/A')
                        Logger.success(f"   Timestamp: {timestamp}")
                    
                    time.sleep(delay)
                
                except Exception as e:
                    total_requests += 1
                    Logger.error(f"Failed: {e}")
        
        print()
        Logger.info(f"📊 Demo Complete")
        Logger.info(f"   Total Requests: {total_requests}")
        Logger.info(f"   Successful: {successful_requests}")
        Logger.info(f"   Failed: {total_requests - successful_requests}")


def main():
    parser = argparse.ArgumentParser(
        description='A2A Knowledge Marketplace - Python AI Agent'
    )
    parser.add_argument(
        '--endpoint', '-e',
        choices=['arc', 'latam', 'trends', 'all'],
        default='all',
        help='Endpoint to request (default: all)'
    )
    parser.add_argument(
        '--loop', '-l',
        type=int,
        default=1,
        help='Number of request loops (default: 1)'
    )
    parser.add_argument(
        '--delay', '-d',
        type=float,
        default=2.0,
        help='Delay between requests in seconds (default: 2.0)'
    )
    parser.add_argument(
        '--test-mode', '-t',
        action='store_true',
        help='Run in test mode (no real payments)'
    )
    parser.add_argument(
        '--api-url',
        default=None,
        help='Override API URL'
    )
    
    args = parser.parse_args()
    
    # Initialize config
    config = Config()
    
    # Override with CLI args
    if args.test_mode:
        config.test_mode = True
    if args.api_url:
        config.api_url = args.api_url
    
    # Validate config
    errors = config.validate()
    if errors:
        for error in errors:
            Logger.error(error)
        Logger.info("Hint: Set TEST_MODE=true or use --test-mode for demo without payments")
        sys.exit(1)
    
    # Determine endpoints
    if args.endpoint == 'all':
        endpoints = list(config.endpoints.values())
    else:
        endpoints = [config.endpoints[args.endpoint]]
    
    # Initialize and run agent
    agent = A2AAgent(config)
    
    try:
        agent.run_demo(
            endpoints=endpoints,
            loop_count=args.loop,
            delay=args.delay
        )
    except KeyboardInterrupt:
        print()
        Logger.info("Agent stopped by user")
        sys.exit(0)


if __name__ == '__main__':
    main()
