import aggregatorService from "../src/services/aggregatorService";
import { USDT_ASSET_ID } from "../src/constants";
import { libs } from "@waves/waves-transactions";
import { SEED } from "../src/config";
import { getActiveOrdersIds, getOrderById } from "../src/services/dappService";
import blockchainService from "../src/services/blockchainService";
import { sleep } from "../src/utils/utils";
import { fulfillOrder, swapToken0ToUsdt, swapUsdtToToken1 } from "../src";

// user says "im selling 1 PUZZLE for 18 USDN"
// token0 = PUZZLE, token1 = USDN
// amount0 = 1 * 1e8, amount1 = 18 * 1e6

const ORDER_ID = 67;

describe("BOT TEST", () => {
  it("stage 0: Get orders and check profitable", async () => {
    const address = libs.crypto.address(SEED, "W");
    const activeOrderIds = await getActiveOrdersIds();

    //WAVES BALANCE CHECK
    const wavesBalance = await blockchainService.getWavesBalance(address);
    if (wavesBalance < 0.015 * 1e8) {
      await sleep(30 * 60 * 1000);
      throw new Error("❌ WAVES 🔷 balance too low");
    }
    console.log(activeOrderIds);
    expect(Array.isArray(activeOrderIds));

    // Filter profitable orders
    for (let i = 0; i < activeOrderIds.length; i++) {
      const order = await getOrderById(activeOrderIds[i]);
      if (order.status !== "active") continue;
      const amount0 = order.amount0.minus(order.fulfilled0); //1 puzzle
      const amount1 = order.amount1.minus(order.fulfilled1); //18 usdn
      const checkParams = await aggregatorService.calc({
        token0: order.token0, //puzzle
        token1: order.token1, //usdn
        amountIn: amount0.toString(), //1 puzzle
      });
      console.log(checkParams);
      const minimumToReceive = aggregatorService.calcMinimumToReceive(
        checkParams.estimatedOut
      );

      const title = amount1.lt(minimumToReceive)
        ? `✅ Order ${order.id} is profitable.`
        : `❌ Order ${order.id} is not profitable.`;
      console.log(
        `${title} \n\nAmount1 = ${amount1}\nReceive = ${minimumToReceive}`
      );
    }
  }, 5000000);

  it("stage 1: Exchange USDT to amount 1", async () => {
    const order = await getOrderById(ORDER_ID.toString());

    if (order.status !== "active") {
      throw new Error("You should to provide id of active order");
    }

    if (order.token1 !== USDT_ASSET_ID) {
      const tx = await swapUsdtToToken1(order);
      console.log(tx);
    }
  }, 5000000);

  it("stage 2: fulfill order", async () => {
    const order = await getOrderById(ORDER_ID.toString());
    if (order.status !== "active") {
      throw new Error("You should to provide id of active order");
    }

    const tx = fulfillOrder(order);
    console.log(tx);
  }, 5000000);

  it("stage 3: swap token0 to USDT", async () => {
    const order = await getOrderById(ORDER_ID.toString());
    if (order.token0 !== USDT_ASSET_ID) {
      const tx = await swapToken0ToUsdt(order);
      console.log(tx);
    }
  }, 5000000);
});
