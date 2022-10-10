import { sleep } from "./utils/utils";
import BN from "./utils/BN";
import makeNodeRequest, { TDataEntry } from "./utils/makeNodeRequest";
import axios from "axios";
import blockchainService from "./services/blockchainService";
import { SEED } from "./config";
import aggregatorService from "./services/aggregatorService";
import TelegramService from "./services/telegramService";
import BigNumber from "bignumber.js";
import { InvokeScriptCallArgument } from "@waves/ts-types";

const { log, groupMessage } = new TelegramService();

const pools = ["3PEhGDwvjrjVKRPv5kHkjfDLmBJK1dd2frT"];

export const getStateByKey = (values: TDataEntry[], key: string) =>
  values.find((state) => state.key === key)?.value;

const getRates = async (
  pool: string
): Promise<Array<{ min: BN; max: BN }> | null> => {
  try {
    const tokensRatesUrl = `https://nodes.wavesnodes.com/utils/script/evaluate/${pool}`;
    const { data } = await axios(tokensRatesUrl, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      data: { expr: `getPrices(false)` },
    });
    return data.result.value._2.value
      .split("|")
      .filter((str: string) => str !== "")
      .map((str: string) => {
        const [min, max] = str.split(",");
        return { min: new BN(min), max: new BN(max) };
      });
  } catch (err) {
    console.log(err, "ERR");
    return null;
  }
};

const getSetupsByPool = async (pool: string) => {
  const { data: settingsData } = await makeNodeRequest(
    `/addresses/data/${pool}`,
    { postData: { keys: ["setup_tokens", "setup_ltvs", "setup_lts"] } }
  );
  const setupTokens = getStateByKey(settingsData, "setup_tokens")?.split(",");
  const cfs = getStateByKey(settingsData, "setup_ltvs")?.split(",");
  const lts = getStateByKey(settingsData, "setup_lts")?.split(",");
  if (
    setupTokens == null ||
    cfs?.length != setupTokens.length ||
    lts?.length != setupTokens.length
  ) {
    return null;
  }
  return { setupTokens, cfs, lts };
};

function movePuzzle(arr: string[]) {
  let upperBound = arr.length;
  for (let i = 0; i < upperBound; i++) {
    if (arr[i] === "HEB8Qaw9xrWpWs8tHsiATYGBWDBtP2S7kcPALrMu43AS") {
      arr.push("HEB8Qaw9xrWpWs8tHsiATYGBWDBtP2S7kcPALrMu43AS");
      arr.splice(i, 1);
      upperBound--;
      i--;
    }
  }
  return arr;
}

(async () => {
  while (true) {
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      //fetch settings data
      const setups = await getSetupsByPool(pool);
      if (setups == null) continue;
      const { setupTokens, cfs, lts } = setups;

      //fetch rates
      const rates = await getRates(pool);
      if (rates == null) continue;

      //fetch token details
      const { data: tokenDetails } = await makeNodeRequest(
        `/assets/details?${setupTokens
          .map((id) => "id=" + id)
          .join("&")}&full=false`
      );
      //fetch lends
      const req = `/addresses/data/${pool}?matches=(.*)_(supplied%7Cborrowed)_(.*)`;
      const { data } = await makeNodeRequest(req);
      const users = data
        .filter((lend: TDataEntry) => lend.key.includes("_borrowed_"))
        .reduce((acc: Array<string>, lend: TDataEntry) => {
          const [address] = lend.key.split("_borrowed_");
          address != "total" && !acc.includes(address) && acc.push(address);
          return acc;
        }, [] as Array<string>);

      //loop by users
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const bc = setupTokens.reduce((acc: BN, assetId: string, index) => {
          const key = `${user}_supplied_${assetId}`;
          const decimals = tokenDetails[index].decimals;
          const deposit = BN.formatUnits(
            getStateByKey(data, key) ?? 0,
            decimals
          );
          if (deposit.eq(0)) return acc;
          const cf = BN.formatUnits(cfs[index]);
          const rate = BN.formatUnits(rates[index].min, decimals);
          const assetBc = cf.times(1).times(deposit).times(rate);
          return acc.plus(assetBc);
        }, BN.ZERO);
        const bcu = setupTokens.reduce((acc: BN, assetId: string, index) => {
          const key = `${user}_borrowed_${assetId}`;
          const decimals = tokenDetails[index].decimals;
          const borrow = BN.formatUnits(
            getStateByKey(data, key) ?? 0,
            decimals
          );
          const lt = BN.formatUnits(lts[index]);
          const rate = BN.formatUnits(rates[index].max, decimals);
          const assetBcu = borrow.times(rate).div(lt);
          return acc.plus(assetBcu);
        }, BN.ZERO);

        const health = new BN(1).minus(bcu.div(bc));

        console.log(user, health.times(100).toString(), "%");
        if (health.lt(0)) {
          //todo max supply
          const liquidationToken = movePuzzle([...setupTokens]).find((t) => {
            const sup = getStateByKey(data, `${user}_supplied_${t}`);
            return sup != null && new BN(sup).times(0.1).gt(1);
          });
          const sup = getStateByKey(
            data,
            `${user}_supplied_${liquidationToken}`
          );
          const borrowEntry = data.find(({ key }: TDataEntry) => {
            const [address, asset] = key.split("_borrowed_");
            return address === user && asset != liquidationToken;
          });
          const [_, borrowToken] = borrowEntry?.key?.split("_borrowed_");
          if (sup == null || borrowToken == null || liquidationToken == null) {
            const msg =
              "❌ Liquidation error: cannot find sup|borrowToken|liquidationToken";
            await log(msg);
            continue;
          }
          let amountIn = "0";
          try {
            amountIn = new BN(sup!)
              .times(0.1)
              .toSignificant(0, BigNumber.ROUND_UP)
              .toString();
          } catch (e) {
            console.log(e);
            continue;
          }
          const calcParams = {
            token0: liquidationToken, //supply
            token1: borrowToken, //borrow
            amountIn,
          };
          const result = await aggregatorService.calc(calcParams);
          const invokeParams = {
            dApp: pool,
            functionName: "liquidate",
            args: [
              { type: "boolean", value: false }, //debug
              { type: "string", value: user }, //address
              { type: "integer", value: amountIn }, //assetAmount
              { type: "string", value: liquidationToken }, //sAssetIdStr
              { type: "string", value: borrowToken }, //bAssetIdStr
              { type: "string", value: result.parameters }, //routeStr
            ] as InvokeScriptCallArgument<string | number>[],
            seed: SEED,
          };
          // console.log(invokeParams);
          await blockchainService
            .invoke(invokeParams)
            .then((tx) => {
              const detail = tokenDetails.find(
                (d: any) => d.assetId === liquidationToken
              );
              const amount = BN.formatUnits(
                amountIn,
                detail.decimals
              ).toString();
              const msg = `🔥 Liquidation!!!\n${amount} ${detail.name} were successfully liquidated\n\nTx: https://new.wavesexplorer.com/tx/${tx.id}\nUser: ${user}\nPool: ${pool}`;
              return log(msg);
            })
            .catch((e) =>
              log("❌ Liquidation error:\n" + e.message ?? e.toString()).catch(
                () => log("❌ Liquidation error! Please check logs")
              )
            );
        }
      }
    }
    await sleep(10000);
  }
})();

// COLLATERAL_FACTOR -> setup_ltvs
// LIQUIDATION_THRESHOLD -> setup_lts

process.stdout.write("Bot has been started ✅ ");
console.log();
