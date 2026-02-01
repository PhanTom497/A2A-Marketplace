import { spawn } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

// Load environment from root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class MCPClient {
    private serverProcess: any;
    private requestId = 0;
    private pendingRequests = new Map<number, { resolve: Function, reject: Function }>();
    private rl: readline.Interface;

    constructor() {
        console.log("🚀 Starting LLM Wallet MCP Server...");

        // Spawn the MCP server
        this.serverProcess = spawn('npx', ['llm-wallet-mcp'], {
            env: {
                ...process.env,
                NETWORK: 'polygon-amoy',
            },
            stdio: ['pipe', 'pipe', 'inherit']
        });

        this.rl = readline.createInterface({
            input: this.serverProcess.stdout,
            terminal: false
        });

        this.rl.on('line', (line) => {
            if (!line) return;
            try {
                const message = JSON.parse(line);
                this.handleMessage(message);
            } catch (e) {
                // Ignore non-JSON lines
            }
        });
    }

    private handleMessage(message: any) {
        if (message.id !== undefined && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
                reject(message.error);
            } else {
                resolve(message.result);
            }
        }
    }

    public async initialize(): Promise<void> {
        console.log("   🔌 Initializing MCP Protocol...");
        const initResult = await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "antigravity-client", version: "1.0.0" }
        });
        console.log("   ✅ Initialized. Server Capabilities:", JSON.stringify(initResult.capabilities));

        // Send initialized notification (no ID)
        const notification = {
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: {}
        };
        this.serverProcess.stdin.write(JSON.stringify(notification) + '\n');
    }

    public async listTools(): Promise<any> {
        return this.sendRequest("tools/list", {});
    }

    public async callTool(name: string, args: any = {}): Promise<any> {
        return this.sendRequest("tools/call", { name, arguments: args });
    }

    private sendRequest(method: string, params: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.requestId++;
            const id = this.requestId;
            this.pendingRequests.set(id, { resolve, reject });

            const request = {
                jsonrpc: "2.0",
                id: id,
                method: method,
                params: params
            };

            // console.log("   -> Sending:", JSON.stringify(request));
            this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
        });
    }

    public close() {
        this.serverProcess.kill();
    }
}

function parseResult(res: any): any {
    if (res.content && Array.isArray(res.content) && res.content.length > 0 && res.content[0].text) {
        try {
            const inner = JSON.parse(res.content[0].text);
            // Handle double wrapping if present
            if (inner.content && Array.isArray(inner.content)) {
                return parseResult(inner);
            }
            return inner;
        } catch (e) {
            return res.content[0].text;
        }
    }
    return res;
}

async function main() {
    const client = new MCPClient();

    try {
        await client.initialize();

        console.log("\n🔍 Listing Tools...");
        const tools = await client.listTools();
        console.log("   Available Tools:", tools.tools.map((t: any) => t.name).join(", "));

        console.log("\n📦 1. Creating Agent Wallet...");
        // 1. Create Wallet
        const walletRes = await client.callTool("wallet_create", { label: "super-agent" });
        const wallet = parseResult(walletRes);
        console.log("   ✅ Wallet Created:", wallet);

        if (!wallet.address) {
            console.log("   ⚠️ Raw Wallet Response:", JSON.stringify(walletRes, null, 2));
        }

        if (wallet.address) {
            // 2. Fund Wallet
            console.log("\n💰 2. Funding Wallet...");
            console.log(`   Transferring funds to ${wallet.address} via scripts/fundWallet.ts`);

            try {
                // Run the funding script relative to project root (CWD)
                process.env.ADDITIONAL_AGENT_WALLETS = wallet.address;
                execSync('npx ts-node scripts/fundWallet.ts', {
                    stdio: 'inherit',
                    env: { ...process.env, ADDITIONAL_AGENT_WALLETS: wallet.address }
                });
            } catch (e) {
                console.error("   ❌ Funding failed (expected if keys missing). Proceeding to buy attempt...");
            }
        }

        // 3. Register Tool
        console.log("\n🔗 3. Registering API as MCP Tool...");
        const apiUrl = "http://localhost:4021/api/v1/stablecoins/arc";
        const regRes = await client.callTool("api_register", {
            name: "get_stablecoin_data",
            endpoint: apiUrl,
            method: "GET",
            description: "Get stablecoin data for ARC"
        });
        const toolReg = parseResult(regRes);
        console.log("   ✅ Tool Registered:", toolReg);

        // 4. Execute Purchase
        console.log("\n🤖 4. Executing AI Purchase...");
        console.log("   Invoking 'api_call' for 'get_stablecoin_data'...");

        // Wait a moment
        await new Promise(r => setTimeout(r, 1000));

        const purchaseRes = await client.callTool("api_call", {
            toolName: "get_stablecoin_data",
            parameters: {}
        });
        const result = parseResult(purchaseRes);

        console.log("\n🎉 Purchase Successful!");
        console.log("   Result Data:", JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        client.close();
        process.exit(0);
    }
}

main();
