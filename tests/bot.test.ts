import blockchainService from "../src/services/blockchainService";
import makeNodeRequest, { TDataEntry } from "../src/utils/makeNodeRequest";
import BN from "../src/utils/BN";
import axios from "axios";
import BigNumber from "bignumber.js";
import aggregatorService from "../src/services/aggregatorService";
import { InvokeScriptCallArgument } from "@waves/ts-types";
import { SEED } from "../src/config";
import nodeService from "../src/services/nodeService";
//pool1
const pool = "3P4uA5etnZi4AmBabKinq2bMiWU8KcnHZdH";
const users = [
  "3P54YBUwh1L9NSBqvASeeR4VCwGtRbiRvnh",
  // "3PMCuLiPnBBUuetWZRriKcqvsAspApKLZjF",
  // "3PQ6BhaXbTGstToqFsvP4AnvoJtPEwCtL1J",
];

//pool2
// const pool = "3P4DK5VzDwL3vfc5ahUEhtoe5ByZNyacJ3X";
// const users = ["3PCDpPeELn6sHNSBCpEL3d7f4Zi9341Br9j"];

//3P93XuhLaLrUoVdm9frVMicbWLQz8GUossz
const getStateByKey = (values: TDataEntry[], key: string) =>
  values.find((state) => state.key === key)?.value;

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
  const tokenRates = await nodeService.evaluate(
    pool,
    `calculateTokenRates(false)`
  );
  const rates = String(tokenRates.result.value._2.value)
    .split(",")
    .filter((v) => v != "")
    .map((v) => ({
      brate: BN.formatUnits(v.split("|")[0], 16),
      srate: BN.formatUnits(v.split("|")[1], 16),
    }));

  return { setupTokens, cfs, lts, rates };
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

const getRates = async (
  pool: string
): Promise<Array<{ min: BN; max: BN }> | null> => {
  try {
    const tokensRatesUrl = `https://nodes-puzzle.wavesnodes.com/utils/script/evaluate/${pool}`;
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

describe("BOT TEST", () => {
  it("liquidate", async () => {
    //fetch settings data
    const setups = await getSetupsByPool(pool);
    if (setups == null) return;
    const { setupTokens, cfs, lts } = setups;

    //fetch rates
    const rates = await getRates(pool);
    if (rates == null) return;

    //fetch token details
    const tokenDetails = await blockchainService.getAssetsDetails([
      ...setupTokens,
    ]);
    //fetch lends
    const req = `/addresses/data/${pool}?matches=(.*)_(supplied%7Cborrowed)_(.*)`;
    const { data } = await makeNodeRequest(req);
    // const users = data
    //   .filter((lend: TDataEntry) => lend.key.includes("_borrowed_"))
    //   .reduce((acc: Array<string>, lend: TDataEntry) => {
    //     const [address] = lend.key.split("_borrowed_");
    //     address != "total" && !acc.includes(address) && acc.push(address);
    //     return acc;
    //   }, [] as Array<string>);

    //loop by users
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const bc = setupTokens.reduce((acc: BN, assetId: string, index) => {
        const key = `${user}_supplied_${assetId}`;
        const decimals = tokenDetails[index].decimals;
        const deposit = BN.formatUnits(getStateByKey(data, key) ?? 0, decimals);
        if (deposit.eq(0)) return acc;
        const cf = BN.formatUnits(cfs[index]);
        const rate = BN.formatUnits(rates[index].min, 6);
        const assetBc = cf
          .times(1)
          .times(deposit)
          .times(rate)
          .times(setups.rates[index].srate);
        return acc.plus(assetBc);
      }, BN.ZERO);
      const bcu = setupTokens.reduce((acc: BN, assetId: string, index) => {
        const key = `${user}_borrowed_${assetId}`;
        const decimals = tokenDetails[index].decimals;
        const borrow = BN.formatUnits(getStateByKey(data, key) ?? 0, decimals);
        const lt = BN.formatUnits(lts[index]);
        const rate = BN.formatUnits(rates[index].max, 6);
        const assetBcu = borrow
          .times(rate)
          .times(setups.rates[index].brate)
          .div(lt);
        return acc.plus(assetBcu);
      }, BN.ZERO);

      let health =
        bc.eq(0) || bcu.eq(0) ? new BN(1) : new BN(1).minus(bcu.div(bc));

      console.log(user, health.times(100).toString(), "%");
      if (health.lt(0)) {
        //todo max supply
        const liquidationToken = movePuzzle([...setupTokens]).find((t) => {
          const sup = getStateByKey(data, `${user}_supplied_${t}`);
          return sup != null && new BN(sup).times(0.1).gt(1);
        });
        const sup = getStateByKey(data, `${user}_supplied_${liquidationToken}`);
        const borrowEntry = data.find(({ key }: TDataEntry) => {
          const [address, asset] = key.split("_borrowed_");
          return address === user && asset != liquidationToken;
        });
        const [_, borrowToken] = borrowEntry?.key?.split("_borrowed_");
        if (sup == null || borrowToken == null || liquidationToken == null) {
          const msg =
            "❌ Liquidation error: cannot find sup|borrowToken|liquidationToken";
          console.log(msg);
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
        console.log(result.parameters);
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
              detail?.decimals
            ).toString();
            const msg = `🔥 Liquidation!!!\n${amount} ${detail?.name} were successfully liquidated\n\nTx: https://new.wavesexplorer.com/tx/${tx.id}\nUser: ${user}\nPool: ${pool}`;
            console.log(msg);
          })
          .catch((e) =>
            console.log("❌ Liquidation error:\n" + e.message ?? e.toString())
          );
      }
    }
  }, 999999999);
});
