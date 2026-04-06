import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { AWalletADK } from "../src/adk/AWalletADK.ts";

/**
 * AWallet MCP Server
 * 
 * This server exposes AWallet's ADK functions as "Tools" for LLMs (Claude, Gemini).
 * It allows AI agents to directly interact with AWallet infrastructure.
 */

// Define AWallet Tools for LLMs
export const AWALLET_TOOLS = [
  {
    name: "awallet_execute_micro_payment",
    description: "Execute a gasless micro-payment via AWallet PolicyGuard to purchase data or API access from another agent. The transaction will automatically fail if it exceeds the pre-defined daily limit.",
    inputSchema: {
      type: "object",
      properties: {
        target_agent_address: { type: "string", description: "The Ethereum address of the provider agent (0x...)" },
        amount_usdc: { type: "number", description: "The amount to pay in USDC (must be <= 2.0)" },
        reason: { type: "string", description: "Brief description of what is being purchased" },
      },
      required: ["target_agent_address", "amount_usdc"],
    },
  },
  {
    name: "awallet_create_erc8183_job",
    description: "Create an on-chain job escrow using the ERC-8183 standard. Locks funds in a smart contract until the specified evaluator agent attests to the job's completion.",
    inputSchema: {
      type: "object",
      properties: {
        provider_did: { type: "string", description: "The ERC-8004 DID or address of the agent being hired." },
        budget_usdc: { type: "integer", description: "The escrow amount in USDC." },
        task_description: { type: "string", description: "Detailed prompt or requirements for the provider agent." },
        evaluator_address: { type: "string", description: "Address of the impartial agent or oracle that will verify the work." },
      },
      required: ["budget_usdc", "task_description"],
    },
  },
  {
    name: "awallet_check_financial_health",
    description: "Retrieve the real-time USDC balance and the remaining daily spending allowance from the AWallet PolicyGuard.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

export function setupMcpServer() {
  const adk = new AWalletADK({
    rpcUrl: process.env.RPC_URL,
    privateKey: process.env.PRIVATE_KEY
  });

  const server = new Server(
    {
      name: "awallet-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle Tool Listing
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: AWALLET_TOOLS,
  }));

  // Handle Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "awallet_execute_micro_payment": {
          const result = await adk.pay({
            targetAddress: (args as any).target_agent_address,
            amount: (args as any).amount_usdc,
            currency: "USDC",
            reason: (args as any).reason || "AI API Access"
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        case "awallet_create_erc8183_job": {
          const result = await adk.createJob({
            providerAgent: (args as any).provider_did,
            evaluator: (args as any).evaluator_address || "0xNeutralAuditor",
            budget: (args as any).budget_usdc,
            currency: "USDC",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            taskDescription: (args as any).task_description
          });
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        case "awallet_check_financial_health": {
          const result = await adk.getBalance();
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * For local development/standalone MCP usage via stdio
 */
if (process.argv[1].endsWith("mcp-server.ts")) {
  const server = setupMcpServer();
  const transport = new StdioServerTransport();
  server.connect(transport).catch(console.error);
  console.error("AWallet MCP Server running on stdio");
}
