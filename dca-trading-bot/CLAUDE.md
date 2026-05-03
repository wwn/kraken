markdown# DCA Trading Bot

## Project
Kraken DCA bot using Claude Agent SDK and kraken-mcp.

## Commands
- `npx tsx bot.ts` — run in paper trading mode
- `npx tsx run.ts` — start daemon

## Rules
- liveTrading is always false by default
- never remove --validate flag without explicit confirmation
- tickerPair format is always BASE/QUOTE e.g. XBT/USD
