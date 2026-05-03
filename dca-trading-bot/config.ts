import { Trade } from "./models/Trade.js";

export const config: Trade = {
  pairs: [
    { tickerPair: "XBT/USD", limit: 80000, quoteAmount: 50 },
    { tickerPair: "ETH/USD", limit: 3000,  quoteAmount: 30 },
  ],
  checkInterval: 60_000, // 1min
  liveTrading: false,
};
