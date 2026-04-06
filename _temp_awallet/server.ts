import express from "express";

import path from "path";
import { fileURLToPath } from "url";
import { setupMcpServer, AWALLET_TOOLS } from "./server/mcp-server.ts";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Mppx, tempo } from "mppx/express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "8080", 10);

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "AWallet ADK & MCP Server" });
  });

  let mppx: any = null;
  try {
    // Initialize MPP
    mppx = Mppx.create({
      methods: [tempo({
        currency: "0x20c0000000000000000000000000000000000000", // pathUSD on Tempo
        recipient: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      })],
    });
  } catch (err) {
    console.warn("Failed to initialize MPP:", err);
  }

  let mcpServer: any = null;
  try {
    mcpServer = setupMcpServer();
  } catch (err) {
    console.warn("Failed to set up MCP Server:", err);
  }
  
  app.get("/api/mcp/tools", async (req, res) => {
    res.json({ tools: AWALLET_TOOLS });
  });

  // Example of a Protected API Endpoint using MPP
  app.get("/api/premium-data", (req, res, next) => {
    if (mppx) {
      return mppx.charge({ amount: "0.1" })(req, res, next);
    }
    next();
  }, (req, res) => {
    res.json({ data: "This is premium exclusive data unlocked via MPP x402!" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AWallet Server running on http://localhost:${PORT}`);
    console.log(`MCP Server ready for AI Agents (Claude, Gemini)`);
  });
}

startServer().catch(console.error);
