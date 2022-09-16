import aggregatorService from "../src/services/aggregatorService";
import { AGGREGATOR, LIMIT_ORDERS, USDT_ASSET_ID } from "../src/constants";
import BN from "../src/utils/BN";
import { libs } from "@waves/waves-transactions";
import { SEED } from "../src/config";
import { getActiveOrdersIds, getOrderById } from "../src/services/dappService";
import blockchainService from "../src/services/blockchainService";
import { sleep } from "../src/utils/utils";

// user says "im selling 1 PUZZLE for 18 USDN"
// token0 = PUZZLE, token1 = USDN
// amount0 = 1 * 1e8, amount1 = 18 * 1e6

const ORDER_ID = 11;

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
    const amount1 = order.amount1.minus(order.fulfilled1);

    if (order.status !== "active") {
      throw new Error("You should to provide id of active order");
    }

    if (order.token1 !== USDT_ASSET_ID) {
      const amountIn = await aggregatorService //amountIn = 17.9 usdt
        .calcAmountInByAmountOut({
          token0: USDT_ASSET_ID, //usdt
          token1: order.token1, //usdn
          amountOut: amount1.toString(), //18 usdn
        })
        .catch((e) => {
          throw new Error(
            `❌ Cannot calc calcAmountInByAmountOut\n ${e.toString()}`
          );
        });
      if (amountIn == null) return;
      console.log({ amountIn: amountIn.toString() });

      const tx = await aggregatorService
        .swap({
          token0: USDT_ASSET_ID, //usdt
          token1: order.token1, //usdn
          amountIn: amountIn.toString(), // 17.9 usdt
        })
        .catch((e) => {
          const err = `❌ Cannot swap ${USDT_ASSET_ID} -> ${order.token1}\n\n`;
          throw new Error(err + (e.message ?? e.toString()));
        });
      if (tx == null) return;
      console.log(tx);
    }
  }, 5000000);

  it("stage 2: fulfill order", async () => {
    const order = await getOrderById(ORDER_ID.toString());
    const amount1 = order.amount1.minus(order.fulfilled1); //18 usdn
    if (order.status !== "active") {
      throw new Error("You should to provide id of active order");
    }

    const tx = await blockchainService
      .invoke({
        seed: SEED,
        dApp: LIMIT_ORDERS,
        args: [{ type: "string", value: order.id }],
        functionName: "fulfillOrder",
        payment: [
          {
            assetId: order.token1, //usdt
            amount: amount1.toString(), //18
          },
        ],
      })
      .catch((e) => {
        const err = `❌ Cannot FULFILL ORDER ${order.id}\n\n`;
        throw new Error(err + (e.message ?? e.toString()));
      });
    console.log(tx);
  }, 5000000);

  it("stage 3: swap token0 to USDT", async () => {
    const order = await getOrderById(ORDER_ID.toString());
    const address = libs.crypto.address(SEED, "W");

    if (order.token0 !== USDT_ASSET_ID) {
      // SWAP order.token0 -> USDT
      const amount0Balance = await blockchainService.getAssetBalance(
        address,
        order.token0
      );
      const params = await aggregatorService.calc({
        token0: order.token0,
        token1: USDT_ASSET_ID,
        amountIn: amount0Balance,
      });
      const txParams = {
        seed: SEED,
        dApp: AGGREGATOR,
        args: [
          { type: "string", value: params.parameters },
          {
            type: "integer",
            value: aggregatorService
              .calcMinimumToReceive(params.estimatedOut)
              .toString(),
          },
        ],
        functionName: "swap",
        payment: [
          {
            assetId: order.token0,
            amount: amount0Balance,
          },
        ],
      };
      console.log(txParams);
      const tx = await blockchainService.invoke(txParams as any).catch((e) => {
        const err = `❌ Cannot SWAP  ${order.token0} -> ${USDT_ASSET_ID}\n\n`;
        console.log(err + (e.message ?? e.toString()));
      });
      console.log(tx);
    }
  }, 5000000);
});
