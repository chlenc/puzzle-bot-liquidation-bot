import TelegramService from "./services/telegramService";
import { sleep } from "./utils/utils";
import {
  getActiveOrdersIds,
  getOrderById,
  IOrder,
} from "./services/dappService";
import aggregatorService from "./services/aggregatorService";
import BN from "./utils/BN";
import blockchainService from "./services/blockchainService";
import { AGGREGATOR, LIMIT_ORDERS, USDT_ASSET_ID } from "./constants";
import { libs } from "@waves/waves-transactions";
import { SEED } from "./config";
import { InvokeScriptCallArgument } from "@waves/ts-types";

const { log, groupMessage } = new TelegramService();

//For normal bot life, the account must have enough money to pay commissions
//The bot will keep its funds in USDT, respectively, there should be enough of them on the account

const blackList = ["AbunLGErT5ctzVN8MVjb4Ad9YgjpubB8Hqb17VxzfAck"];

//stage 1
export const swapUsdtToToken1 = async (order: IOrder) => {
  const amount1 = order.amount1.minus(order.fulfilled1);
  const amountIn = await aggregatorService //amountIn = 17.9 usdt
    .calcAmountInByAmountOut({
      token0: USDT_ASSET_ID, //usdt
      token1: order.token1, //usdn
      amountOut: amount1.toString(), //18 usdn
    })
    .catch((e) => {
      log(`❌ Cannot calc calcAmountInByAmountOut\n ${e.toString()}`);
      return null;
    });
  if (amountIn == null) return null;

  return await aggregatorService
    .swap({
      token0: USDT_ASSET_ID, //usdt
      token1: order.token1, //usdn
      amountIn: amountIn.toString(), // 17.9 usdt
    })
    .catch((e) => {
      const err = `❌ Cannot swap ${USDT_ASSET_ID} -> ${order.token1}\n\n`;
      log(err + (e.message ?? e.toString()));
      return null;
    });
};

//stage 2 fulfill order
export const fulfillOrder = async (order: IOrder) => {
  const address = libs.crypto.address(SEED, "W");
  const amount1 = order.amount1.minus(order.fulfilled1);
  if (order.token1 === "WAVES") {
    const params = {
      seed: SEED,
      dApp: LIMIT_ORDERS,
      args: [{ type: "string", value: order.id }] as InvokeScriptCallArgument[],
      functionName: "fulfillOrder",
      payment: [{ assetId: order.token1, amount: amount1.toString() }],
    };
    return await blockchainService.invoke(params).catch((e) => {
      const err = `❌ Cannot FULFILL ORDER ${order.id}\n\n`;
      log(err + e.toString());
      return null;
    });
  } else {
    const token1Balance = await blockchainService
      .getAssetBalance(address, order.token1)
      .then((b) => new BN(b))
      .catch((e) => {
        const err = `❌ Cannot get balance address:${address} token:${order.token1}\n\n`;
        log(err + e.toString());
        return null;
      });
    if (token1Balance == null) return null;

    const aggrRes = await aggregatorService
      .calc({
        token0: order.token1,
        token1: order.token0,
        amountIn: token1Balance.minus(amount1).toString(),
      })
      .catch((e) => {
        log(`❌ Cannot calc\n\n ${e.toString()}`);
        return null;
      });
    if (aggrRes == null) return null;

    const params = {
      seed: SEED,
      dApp: LIMIT_ORDERS,
      args: [
        { type: "string", value: order.id },
        { type: "string", value: aggrRes.parameters },
        {
          type: "integer",
          value: aggregatorService
            .calcMinimumToReceive(aggrRes.estimatedOut)
            .toString(),
        },
      ] as InvokeScriptCallArgument[],
      functionName: "fulfillOrderAndSwapCashback",
      payment: [
        {
          assetId: order.token1, //usdt
          amount: token1Balance.toString(), //18
        },
      ],
    };
    return await blockchainService.invoke(params).catch((e) => {
      const err = `❌ Cannot FULFILL ORDER ${order.id}\n\n`;
      log(err + (e.message ?? e.toString()));
      return null;
    });
  }
};

//stage 3
export const swapToken0ToUsdt = async (order: IOrder) => {
  const address = libs.crypto.address(SEED, "W");
  const token0Balance = await blockchainService.getAssetBalance(
    address,
    order.token0
  );
  const amountIn =
    order.token0 === "WAVES"
      ? new BN(token0Balance).minus(1e8).toString()
      : token0Balance.toString();

  const aggrRes = await aggregatorService
    .calc({
      token0: order.token0,
      token1: USDT_ASSET_ID,
      amountIn: amountIn,
    })
    .catch((e) => {
      log(`❌ Cannot calc\n\n ${e.toString()}`);
      return null;
    });
  if (aggrRes == null) return null;

  const txParams = {
    seed: SEED,
    dApp: AGGREGATOR,
    args: [
      { type: "string", value: aggrRes.parameters },
      {
        type: "integer",
        value: aggregatorService
          .calcMinimumToReceive(aggrRes.estimatedOut)
          .toString(),
      },
    ] as InvokeScriptCallArgument[],
    functionName: "swap",
    payment: [{ assetId: order.token0, amount: amountIn }],
  };
  return await blockchainService.invoke(txParams).catch((e) => {
    const err = `❌ Cannot SWAP  ${order.token0} -> ${USDT_ASSET_ID}\n\n`;
    log(err + (e.message ?? e.toString()));
    return null;
  });
};

// user says "im selling 1 PUZZLE for 18 USDN"
// token0 = PUZZLE, token1 = USDN
// amount0 = 1 * 10**8, amount1 = 18 * 10**6
(async () => {
  while (true) {
    const address = libs.crypto.address(SEED, "W");
    const activeOrderIds = await getActiveOrdersIds();
    // WAVES BALANCE CHECK
    const wavesBalance = await blockchainService.getWavesBalance(address);
    if (wavesBalance < 0.015 * 1e8) {
      await sleep(30 * 60 * 1000);
      await log("❌ WAVES 🔷 balance too low");
      continue;
    }

    //ORDERS LOOP
    for (let i = 0; i < activeOrderIds.length; i++) {
      const order = await getOrderById(activeOrderIds[i]);
      if (
        order.status !== "active" ||
        blackList.includes(order.token0) ||
        blackList.includes(order.token1)
      ) {
        continue;
      }
      const amount0 = order.amount0.minus(order.fulfilled0); //1 puzzle
      const amount1 = order.amount1.minus(order.fulfilled1); //18 usdn
      const { estimatedOut } = await aggregatorService.calc({
        token0: order.token0, //puzzle
        token1: order.token1, //usdn
        amountIn: amount0.toString(), //1 puzzle
      });
      const minimumToReceive =
        aggregatorService.calcMinimumToReceive(estimatedOut); //N usdn
      if (amount1.lt(minimumToReceive)) {
        console.log(`✅ Order ${order.id} is profitable.`);
        //============================
        //1️⃣ SWAP: USDT -> order.token1
        if (order.token1 !== USDT_ASSET_ID) {
          const tx = await swapUsdtToToken1(order);
          if (tx == null) continue;
        }
        //============================
        //2️⃣ FULFILL ORDER
        const tx = await fulfillOrder(order);
        if (tx == null) continue;
        //============================
        //3️⃣ SWAP order.token0 -> USDT
        if (order.token0 !== USDT_ASSET_ID) {
          await swapToken0ToUsdt(order);
        }
        await groupMessage(`Order ${order.id} was closed`);
        console.log(`✅ Order ${order.id} is completed`);
      }
    }
    await sleep(1000);
  }
})();

process.stdout.write("Bot has been started ✅ ");
