import telegramService from "./services/telegramService";
import { sleep } from "./utils/utils";
import { getActiveOrdersIds, getOrderById } from "./services/dappService";
import aggregatorService from "./services/aggregatorService";
import BN, { TValue } from "./utils/BN";
import blockchainService from "./services/blockchainService";
import { AGGREGATOR, LIMIT_ORDERS, USDT_ASSET_ID } from "./constants";
import { libs } from "@waves/waves-transactions";
import { CHAT_ID, SEED } from "./config";

const { telegram: bot } = telegramService;

const log = (msg: string) => bot.sendMessage(CHAT_ID, msg);
//For normal bot life, the account must have enough money to pay commissions
//The bot will keep its funds in USDT, respectively, there should be enough of them on the account

const calcMinimumToReceive = (n: TValue) =>
  new BN(n).times(new BN(100 - 5).div(100));

// user says "im selling 1 PUZZLE for 18 USDN"
// token0 = PUZZLE, token1 = USDN
// amount0 = 1 * 10**8, amount1 = 18 * 10**6
(async () => {
  while (true) {
    const address = libs.crypto.address(SEED, "W");
    const activeOrderIds = await getActiveOrdersIds();

    //WAVES BALANCE CHECK
    const wavesBalance = await blockchainService.getWavesBalance(address);
    if (wavesBalance < 0.015 * 1e8) {
      await sleep(30 * 60 * 1000);
      await log("❌ WAVES 🔷 balance too low");
      continue;
    }

    //ORDERS LOOP
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
      const minimumToReceive = calcMinimumToReceive(checkParams.estimatedOut); //N usdn
      if (amount1.lt(minimumToReceive)) {
        //if 18 < N
        //1️⃣ SWAP: USDT -> order.token1
        if (order.token1 !== USDT_ASSET_ID) {
          const amountIn = await aggregatorService //amountIn = 17.9 usdt
            .calcAmountInByAmountOut({
              token0: USDT_ASSET_ID, //usdt
              token1: order.token1, //usdn
              amountOut: order.amount1.toString(), //18 usdn
            })
            .catch((e) => {
              log(`❌ Cannot calc calcAmountInByAmountOut\n ${e.toString()}`);
              return null;
            });
          if (amountIn == null) continue;

          const res = await aggregatorService
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
          if (res == null) continue;
        }

        // on wallet
        //   -17.9 usdt
        //   + 18.3 usdn

        // FULFILL ORDER
        const res = await blockchainService
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
            log(err + (e.message ?? e.toString()));
            return null;
          });
        if (res == null) continue;

        // on wallet
        //   -17.9 usdt
        //   + 0.3 usdn
        //   + 1 puzzle

        if (order.token0 !== USDT_ASSET_ID) {
          // SWAP order.token0 -> USDT
          const params = await aggregatorService.calc({
            token0: order.token0,
            token1: USDT_ASSET_ID,
            amountIn: amount0.toString(),
          });
          await blockchainService
            .invoke({
              seed: SEED,
              dApp: AGGREGATOR,
              args: [
                { type: "string", value: params.parameters },
                {
                  type: "integer",
                  value: calcMinimumToReceive(params.estimatedOut).toString(),
                },
              ],
              functionName: "swap",
              payment: [
                {
                  assetId: order.token0,
                  amount: amount0.toString(),
                },
              ],
            })
            .catch((e) => {
              const err = `❌ Cannot SWAP  ${order.token0} -> ${USDT_ASSET_ID}\n\n`;
              log(err + (e.message ?? e.toString()));
              return null;
            });
        }
        // on wallet
        //   + 0.2 usdt
        //   + 0.3 usdn
      }
    }
    await sleep(60 * 1000);
  }
})();

process.stdout.write("Bot has been started ✅ ");
