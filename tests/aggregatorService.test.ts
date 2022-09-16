import aggregatorService from "../src/services/aggregatorService";
import { USDT_ASSET_ID } from "../src/constants";
import BN from "../src/utils/BN";

// user says "im selling 1 PUZZLE for 18 USDN"
// token0 = PUZZLE, token1 = USDN
// amount0 = 1 * 1e8, amount1 = 18 * 1e6

describe("aggregator service tests", () => {
  it("calcAmountInByAmountOut test", async () => {
    const res = await aggregatorService.calcAmountInByAmountOut({
      token0: "HEB8Qaw9xrWpWs8tHsiATYGBWDBtP2S7kcPALrMu43AS",
      token1: "WAVES",
      amountOut: (18e8).toString(),
    });
    console.log(res.toString(), BN.formatUnits(res, 8).toString());
  }, 5000000);
});
