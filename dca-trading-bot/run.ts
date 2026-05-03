import { checkAllPairs, config } from "./dcaBuy.js";

async function main() {
  console.log("starting dcaBuy...");
  
  setInterval(async () => {
    try {
      await checkAllPairs();
    } catch (error) {
      console.error("Error in checkAllPairs:", error);
    }
  }, config.checkInterval);

  await checkAllPairs();
}

main().catch(console.error);

