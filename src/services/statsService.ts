import axios from "axios";
import { buildHtmlUserLink, prettifyNums } from "../utils";
import * as moment from "moment";
import { decimals, TAuctionRespData, THatchingRespData } from "../interfaces";
import { IUserParams, User } from "../models/user";
import { getUserById } from "../controllers/userController";

export const getCurrentWavesRate = async () => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/coins/waves?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
  );
  return data.market_data.current_price.usd;
};
export const lastPriceForEgg = async () => {
  const { data } = await axios.get(
    "https://backend.swop.fi/exchangers/3PNVFWopwCD9CgGXkpYWEY94oQ5XCAEXBmQ"
  );
  const rate = await getCurrentWavesRate();
  const price =
    Number.parseInt(data.data.B_asset_balance) /
    Number.parseInt(data.data.A_asset_balance);

  return `🥚 Last price for EGG: *${price.toFixed(2)} WAVES ($${(
    rate * price
  ).toFixed(2)})*`;
};
export const totalFarmingPower = async () => {
  try {
    const { data } = await axios.get(
      "https://node2.duxplorer.com/farming/json"
    );
    const res = data.farmData.reduce(
      (acc, { farmingPower }) => acc + farmingPower,
      0
    );
    return `💪 Total farming power: *${res}*`;
  } catch (e) {
    console.log("totalFarmingPower", e);
    return "";
  }
};
export const lastDuckPriceForHatching = async () => {
  const { data } = await axios.get(
    "https://wavesducks.wavesnodes.com/addresses/data/3PEktVux2RhchSN63DsDo4b4mz4QqzKSeDv/ducks_last_price"
  );
  const hatching = data.value / 100;

  return `🥚 > 🦆 Last duck price for hatching: *${hatching} EGG*`;
};
export const totalNumberOfDucks = async () => {
  const hatching = await axios.get("https://node2.duxplorer.com/hatching/json");
  const breeding = await axios.get("https://node2.duxplorer.com/breeding/json");
  const ducksAmount =
    hatching.data.duckData.length + breeding.data.duckData.length;
  return `🦆 Total number of ducks: *${ducksAmount}*`;
};
export const numberOfDucksHatchedInTotalToday = async () => {
  const { data }: THatchingRespData = await axios.get(
    "https://node2.duxplorer.com/hatching/json"
  );

  const todayDate = Date.parse(moment().startOf("day").toString());
  const today = data.duckData.filter(
    (duck) => duck.timestamp >= todayDate
  ).length;

  return `🦆 <> 🦆 Number of ducks hatched in total / today: *${data.duckData.length}* / *${today}*`;
};
export const numberOfDucksBurnedToday = async () => {
  const { data }: any = await axios.get(
    "https://node2.duxplorer.com/rebirth/json"
  );
  const todayDate = Date.parse(moment().startOf("day").toString());
  const today = data.rebirthData.filter(
    (duck) => duck.timestamp >= todayDate
  ).length;
  return `🔥 Number of ducks burned in total / today : *${data.rebirthData.length}* / *${today}*`;
};
export const ducksSalesWeeklyInTotal = async () => {
  const { data }: TAuctionRespData = await axios.get(
    "https://node2.duxplorer.com/auction/json"
  );
  const today = new Date();
  const lastWeek = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7
  ).getTime();
  const twoWeekAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 14
  ).getTime();

  const rate = await getCurrentWavesRate();
  const twoWeekAgoDucks = data.auctionData.filter(
    (d) => d.timestamp >= twoWeekAgo && d.timestamp <= lastWeek
  );
  const lastWeekDucks = data.auctionData.filter((d) => d.timestamp >= lastWeek);
  const twoWeeksAgoSales =
    twoWeekAgoDucks.reduce((acc, { amount }) => acc + amount / decimals, 0) *
    rate;
  const lastWeekSales =
    lastWeekDucks.reduce((acc, { amount }) => acc + amount / decimals, 0) *
    rate;
  const totalSales =
    data.auctionData.reduce((acc, { amount }) => acc + amount / decimals, 0) *
    rate;
  // const difference = ((lastWeekSales - twoWeeksAgoSales) / lastWeekSales) * 100;

  const res = {
    lastWeekSales: prettifyNums(Math.round(lastWeekSales)),
    // difference: Math.abs(difference).toFixed(2),
    // percents: difference !== 0 ? Math.round(Math.abs(difference)) : "",
    totalSales: prettifyNums(Math.round(totalSales)),
  };

  // return `💰 Ducks sales weekly / in total: *$${res.lastWeekSales}* (${
  //   difference < 0 ? "⬇️" : "⬆️"
  // }️*${res.difference}%)* / *$${res.totalSales}*`;
  return `💰 Ducks sales weekly / in total: *$${res.lastWeekSales}* / *$${res.totalSales}*`;
};
export const topDuck = async () => {
  const { data }: TAuctionRespData = await axios.get(
    "https://node2.duxplorer.com/auction/json"
  );
  const yesterday = new Date(
    new Date().getTime() - 24 * 60 * 60 * 1000
  ).getTime();
  const rate = await getCurrentWavesRate();
  const ducksForLast24Hours = data.auctionData.filter(
    (duck) => duck.timestamp >= yesterday
  );
  const topDuck = ducksForLast24Hours.reduce((prev, current) =>
    prev.amount > current.amount ? prev : current
  );
  const res: any = {
    ...topDuck,
    amount: topDuck.amount / decimals,
    inDollar: (topDuck.amount / decimals) * rate,
  };

  try {
    const {
      data: { cacheId },
    } = await axios.get(
      `https://wavesducks.com/api/v1/preview/preload/duck/${res.NFT}?auctionId=${res.auctionId}`
    );
    const link = `https://wavesducks.com/duck/${topDuck.NFT}?cacheId=${cacheId}`;

    return `🤩 Top Duck [${
      res.duckRealName
    }](${link}) for last 24 hours sold for *${
      res.amount
    }* Waves *($${Math.round(res.inDollar)})*`;
  } catch (e) {
    console.log(e);
    return "";
  }
};
export const numberOfDucksSoldThiWeekToday = async () => {
  const { data }: any = await axios.get(
    "https://node2.duxplorer.com/auction/json"
  );
  const todayDate = Date.parse(moment().startOf("day").toString());
  const thisWeekDate = Date.parse(moment().startOf("week").toString());

  const twoWeekAgoDucks = data.auctionData.filter(
    (d) => d.timestamp >= thisWeekDate
  );
  const todayDucks = twoWeekAgoDucks.filter(
    (d) => d.timestamp >= todayDate
  ).length;
  return `🦆 > 💵 Number of ducks sold this week / today:  *${twoWeekAgoDucks.length} / ${todayDucks}*`;
};
export const getStatsInfoFromBlockchain = async () => {
  const data: any = (
    await Promise.all(
      Object.entries({
        lastPriceForEgg: lastPriceForEgg(),
        lastDuckPriceForHatching: lastDuckPriceForHatching(),
        totalFarmingPower: totalFarmingPower(),
        totalNumberOfDucks: totalNumberOfDucks(),
        numberOfDucksHatchedInTotalToday: numberOfDucksHatchedInTotalToday(),
        topDuck: topDuck(),
        ducksSalesWeeklyInTotal: ducksSalesWeeklyInTotal(),
        numberOfDucksBurnedToday: numberOfDucksBurnedToday(),
        numberOfDucksSoldThiWeekToday: numberOfDucksSoldThiWeekToday(),
      }).map(
        ([key, promise]) =>
          new Promise(async (r) => {
            const result = await promise;
            return r({ key, result });
          })
      )
    )
  ).reduce((acc, { key, result }) => {
    acc[key] = result;
    return acc;
  }, {} as Record<string, any>);

  const msg = `
  
${data.lastPriceForEgg}

${data.lastDuckPriceForHatching}

${data.totalFarmingPower}

${data.numberOfDucksBurnedToday}

${data.totalNumberOfDucks}

${data.numberOfDucksHatchedInTotalToday}

${data.numberOfDucksSoldThiWeekToday}

${data.ducksSalesWeeklyInTotal}

${data.topDuck}`;

  return msg;
};

export const NODE_URL_MAP = {
  W: "https://nodes.wavesexplorer.com",
  T: "https://nodes-testnet.wavesnodes.com",
};
export const EXPLORER_URL_MAP = {
  W: "https://wavesexplorer.com/",
  T: "https://testnet.wavesexplorer.com/",
};

export const checkWalletAddress = async (address: string): Promise<boolean> => {
  if (address == null) return false;
  return axios
    .get(`${NODE_URL_MAP[process.env.CHAIN_ID]}/addresses/balance/${address}`)
    .then(({ data }) => !!data)
    .catch(() => false);
};

export function getMostFrequentInfluencers(arr: IUserParams[]) {
  const hashmap = arr.reduce((acc, val) => {
    acc[val.ref] = (acc[val.ref] || 0) + 1;
    return acc;
  }, {}) as any;
  const array = [];
  for (let key in hashmap) {
    array.push({
      userId: key,
      value: hashmap[key],
    });
  }
  const res = array.sort((a, b) =>
    a.value > b.value ? 1 : b.value < a.value ? -1 : 0
  );
  return res.map((a) => a.userId);
}

export const getTopInfluencers = async () => {
  const todayDate = moment().startOf("day").toISOString();
  const userAddedToday = await User.find({
    createdAt: {
      $gte: todayDate,
    },
    ref: { $exists: true },
  });
  const influencers: Array<string> = getMostFrequentInfluencers(
    userAddedToday
  ).splice(0, 10);
  let res = "";
  const idsArray = [];
  for (let index in influencers) {
    const user = await getUserById(+influencers[index]);
    const num = +index + 1;
    idsArray.push(user.id);
    res += `\n${num} - ${buildHtmlUserLink(user)}`;
  }
  return { value: res, data: JSON.stringify(idsArray) };
};
