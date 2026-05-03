import { Pair } from "./Pair.js";

export interface Trade {
  pairs: Pair[];
  checkInterval: number;
  liveTrading: boolean;
}
