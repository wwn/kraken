// DCA agent
// buy when price is below limit
// adjust livetrading for switch paper trading
// this is just an example as abase for more complex reaosing logic. this one should not use an agent in real life

import { query } from "@anthropic-ai/claude-agent-sdk";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { config } from "./config.js";
import { Pair } from "./models/Pair.js";

const LOG_FILE = "trades.csv";
const CSV_HEADER = "timestamp,mode,pair,status,price,volume,details\n";

function logTrade(timestamp: string, mode: string, pair: string, status: string, price: string, volume: string, details: string = "") {
  if (!existsSync(LOG_FILE)) {
    appendFileSync(LOG_FILE, CSV_HEADER);
  } else {
    const firstLine = readFileSync(LOG_FILE, 'utf8').split('\n')[0];
    if (firstLine && !firstLine.includes("details")) {
      const content = readFileSync(LOG_FILE, 'utf8').split('\n').slice(1).join('\n');
      writeFileSync(LOG_FILE, CSV_HEADER + content);
    }
  }
  appendFileSync(LOG_FILE, `${timestamp},${mode},${pair},${status},${price},${volume},"${details.replace(/"/g, '""')}"\n`);
}

async function checkAndTrade(pair: Pair, liveTrading: boolean) {
  const quoteCurrency = pair.tickerPair.split("/")[1];
  const validateFlag = liveTrading ? "" : "--validate";
  const mode = liveTrading ? "LIVE" : "PAPER";
  const timestamp = new Date().toISOString();

  try {
    const messages = query({
      prompt: `
        You are a trading bot assistant. Current pair: ${pair.tickerPair}.
        
        Follow these steps strictly:
        1. Fetch current price: kraken ticker --pair ${pair.tickerPair}
        2. Compare current price with limit (${pair.limit} ${quoteCurrency}):
           - IF price < ${pair.limit}: 
             * This is a BUY signal.
             * Calculate volume = ${pair.quoteAmount} / price.
             * Order: kraken order add --pair ${pair.tickerPair} --type buy --ordertype market --volume [volume] ${validateFlag}
             * Result: status="ORDER_PLACED", details="Price [price] is below limit ${pair.limit}"
           - ELSE (price >= ${pair.limit}):
             * This is a SKIP signal.
             * Result: status="SKIP", details="Price [price] is above or equal to limit ${pair.limit}"

        CRITICAL: 
        - Return ONLY a JSON object.
        - Ensure numerical values for "price" and "volume".
        
        Example JSON:
        {
          "status": "ORDER_PLACED",
          "price": 78800.5,
          "volume": 0.0006345,
          "details": "Price 78800.5 is below limit 80000"
        }
      `,
      options: {
        mcpServers: {
          kraken: { command: "npx", args: ["kraken-mcp-server"] }
        },
        allowedTools: ["Bash"],
        permissionMode: "bypassPermissions",
      }
    });

    for await (const msg of messages) {
      if (msg.type === "result" && 'result' in msg) {
        try {
          const rawResult = String(msg.result);
          const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found in response");
          
          const data = JSON.parse(jsonMatch[0]);
          console.log(`[${timestamp}] [${mode}] ${pair.tickerPair}:`, data);

          logTrade(
            timestamp, 
            mode, 
            pair.tickerPair, 
            data.status || "UNKNOWN", 
            String(data.price || ""), 
            String(data.volume || ""), 
            data.details || ""
          );
        } catch (parseError) {
          console.error(`[${timestamp}] Error parsing Claude response:`, parseError);
          logTrade(timestamp, mode, pair.tickerPair, "ERROR", "", "", `Parse error: ${String(msg.result)}`);
        }
      }
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp}] [${mode}] ${pair.tickerPair} failed:`, errorMsg);
    logTrade(timestamp, mode, pair.tickerPair, "ERROR", "", "", errorMsg);
  }
}

async function checkAllPairs() {
  if (config.liveTrading) {
    console.warn("LIVE TRADING MODE");
  } else {
    console.log("Paper trading mode");
  }
  await Promise.all(config.pairs.map(p => checkAndTrade(p, config.liveTrading)));
}

export { checkAllPairs, config };
