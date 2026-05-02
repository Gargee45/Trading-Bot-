import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import ccxt from "ccxt";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Logging configuration
const LOG_FILE = path.join(process.cwd(), "server.log");

function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(logMessage.trim());
}

app.use(cors());
app.use(express.json());

// Binance Client Initialization (Helper)
const getBinanceClient = (apiKey: string, secret: string) => {
  return new ccxt.binance({
    apiKey: apiKey,
    secret: secret,
    options: {
      defaultType: "future",
    },
  });
};

// Ensure logging file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "--- Trading Bot Log Started ---\n");
}

// API Routes
app.post("/api/order", async (req, res) => {
  const { symbol, side, type, quantity, price, apiKey, secret } = req.body;

  if (!apiKey || !secret) {
    return res.status(400).json({ error: "API Key and Secret are required" });
  }

  const binance = getBinanceClient(apiKey, secret);
  binance.setSandboxMode(true); // Always use testnet

  try {
    logToFile(`ORDER REQUEST: ${type} ${side} ${quantity} ${symbol} @ ${price || 'MARKET'}`);
    
    let order;
    if (type.toUpperCase() === "LIMIT") {
      if (!price) throw new Error("Price is required for LIMIT orders");
      order = await binance.createLimitOrder(symbol, side.toLowerCase(), quantity, price);
    } else {
      order = await binance.createMarketOrder(symbol, side.toLowerCase(), quantity);
    }

    logToFile(`ORDER RESPONSE: SUCCESS - ID: ${order.id}, Status: ${order.status}`);
    res.json(order);
  } catch (error: any) {
    const errorMsg = error.message || "Unknown API Error";
    logToFile(`ORDER RESPONSE: FAILURE - ${errorMsg}`);
    res.status(500).json({ error: errorMsg });
  }
});

app.get("/api/logs", (req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, "utf-8");
    res.send(logs);
  } catch (error) {
    res.status(500).send("Could not read logs");
  }
});

app.get("/api/balance", async (req, res) => {
    const { apiKey, secret } = req.query as { apiKey: string, secret: string };
    if (!apiKey || !secret) return res.status(400).json({ error: "Unauthorized" });

    try {
        const binance = getBinanceClient(apiKey, secret);
        binance.setSandboxMode(true);
        const balance = await binance.fetchBalance();
        res.json(balance);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    logToFile("Server started on port 3000");
  });
}

startServer();
