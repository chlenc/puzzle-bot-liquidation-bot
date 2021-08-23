import axios from "axios";
import { getDuckName, prettifyNums } from "../utils";
import * as moment from "moment";
import { IDuckNft } from "../models/duckNft";
import telegramService from "./telegramService";

const decimals = 1e8;
const farmingDappAddress = "3PAETTtuW7aSiyKtn9GuML3RgtV1xdq1mQW";
const auctionDappAddress = "3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG";
const significantChangeOfRarity = 1;

type TDataEntry = { key: string; type: string; value: string };

interface INodeResponse<T = TDataEntry[]> {
  data: T;
}

export interface IDuck {
  timestamp: number;
  duckName: string;
  amount: number; //waves
  NFT: string;
  date: string;
  buyType: "instantBuy" | "acceptBid";
}

export interface IHatchDuck {
  date: Date;
  timestamp: number;
  NFT: string;
  duckPrice: number;
  duckName: string;
}

type TAuctionRespData = { data: { auctionData: IDuck[] } };
type THatchingRespData = { data: { duckData: IHatchDuck[] } };

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
    100000000 /
    (Number.parseInt(data.data.A_asset_balance) / 100);

  return `🥚 Last price for EGG: *${price.toFixed(2)} WAVES ($${(
    rate * price
  ).toFixed(2)})*`;
};
export const totalFarmingPower = async () => {
  const { data } = await axios.get("https://duxplorer.com/farming/json");
  const res = data.farmData.reduce(
    (acc, { farmingPower }) => acc + farmingPower,
    0
  );
  return `💪 Total farming power: *${res}*`;
};

export const lastDuckPriceForHatching = async () => {
  const { data } = await axios.get(
    "https://wavesducks.wavesnodes.com/addresses/data/3PEktVux2RhchSN63DsDo4b4mz4QqzKSeDv/ducks_last_price"
  );
  const hatching = data.value / 100;

  return `🥚 > 🦆 Last duck price for hatching: *${hatching} EGG*`;
};

export const totalNumberOfDucks = async () => {
  const hatching = await axios.get("https://duxplorer.com/hatching/json");
  const breeding = await axios.get("https://duxplorer.com/breeding/json");
  const ducksAmount =
    hatching.data.duckData.length + breeding.data.duckData.length;
  return `🦆 Total number of ducks: *${ducksAmount}*`;
};

export const numberOfDucksHatchedInTotalToday = async () => {
  const { data }: THatchingRespData = await axios.get(
    "https://duxplorer.com/hatching/json"
  );

  const todayDate = Date.parse(moment().startOf("day").toString());
  const today = data.duckData.filter(
    (duck) => duck.timestamp >= todayDate
  ).length;

  return `🦆 <> 🦆 Number of ducks hatched in total / today: *${data.duckData.length}* / *${today}*`;
};

export const numberOfDucksBurnedToday = async () => {
  const { data }: any = await axios.get("https://duxplorer.com/rebirth/json");
  const todayDate = Date.parse(moment().startOf("day").toString());
  const today = data.rebirthData.filter(
    (duck) => duck.timestamp >= todayDate
  ).length;
  return `🔥 Number of ducks burned in total / today : *${data.rebirthData.length}* / *${today}*`;
};

export const ducksSalesWeeklyInTotal = async () => {
  const { data }: TAuctionRespData = await axios.get(
    "https://duxplorer.com/auction/json"
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
    "https://duxplorer.com/auction/json"
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

  const {
    data: { cacheId },
  } = await axios.get(
    `https://wavesducks.com/api/v1/preview/preload/duck/${topDuck.NFT}`
  );
  const link = `https://wavesducks.com/duck/${topDuck.NFT}?cacheId=${cacheId}`;

  return `🤩 Top Duck [${
    res.duckRealName
  }](${link}) for last 24 hours sold for *${res.amount}* Waves *($${Math.round(
    res.inDollar
  )})*`;
};

export const numberOfDucksSoldThiWeekToday = async () => {
  const { data }: any = await axios.get("https://duxplorer.com/auction/json");
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

export const getStats = async (chatId?: number, messageId?: number) => {
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
  *Daily Ducks Stats:*
  
${data.lastPriceForEgg}

${data.lastDuckPriceForHatching}

${data.totalFarmingPower}

${data.numberOfDucksBurnedToday}

${data.totalNumberOfDucks}

${data.numberOfDucksHatchedInTotalToday}

${data.numberOfDucksSoldThiWeekToday}

${data.ducksSalesWeeklyInTotal}

${data.topDuck}`;

  if (chatId && messageId) {
    await telegramService.telegram.editMessageText(msg, {
      parse_mode: "Markdown",
      chat_id: chatId,
      message_id: messageId,
    });
    return;
  }
  await telegramService.sendChanelMessageWithDelay(
    process.env.RU_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.EN_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.ES_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.AR_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.PER_GROUP_ID,
    msg
  );
};

export const checkWalletAddress = async (
  address?: string
): Promise<boolean> => {
  if (address == null) return false;
  let res = null;
  try {
    const { data } = await axios.get(
      `https://nodes.wavesexplorer.com/addresses/balance/${address}`
    );
    res = data;
  } catch (e) {
    console.error(e);
  }
  return !!res;
};

export const getDuckOnUserWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/assets/nft/${address}/limit/1000`;
  try {
    const { data }: INodeResponse<IDuckNft[]> = await axios.get(url);
    return data.filter((item) => /^DUCK/.test(item.name)).map((i) => i.assetId);
  } catch (e) {
    console.error(e);
  }
};

export const getDuckOnFarmingRelatedToWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/addresses/data/${farmingDappAddress}?matches=^address_${address}_asset_(.*)_farmingPower$`;
  try {
    const { data }: INodeResponse = await axios.get(url);
    return data
      .filter((item) => +item.value > 0)
      .map((i) => i.key.split("_")[3]);
  } catch (e) {
    console.error(e);
  }
};

const getDuckDetails = async (address: string): Promise<IDuckNft> =>
  (await axios.get(`https://wavesducks.com/api/v1/ducks/nft/${address}`)).data;

export const getDuckOnActionRelatedToWallet = async (
  address: string
): Promise<string[]> => {
  const url = `https://nodes.wavesnodes.com/addresses/data/${auctionDappAddress}?matches=^address_${address}_auction_(.*)_lockedNFT$`;
  try {
    const { data }: INodeResponse = await axios.get(url);
    return data.map((i) => i.value);
  } catch (e) {
    console.error(e);
  }
};

export const updateDuckForUser = async (address: string) => {
  const [auctionDucksRaw, farmingDucksRaw, userDucksRaw] = await Promise.all([
    getDuckOnActionRelatedToWallet(address),
    getDuckOnFarmingRelatedToWallet(address),
    getDuckOnUserWallet(address),
  ]);
  const [farmingDucks, auctionDucks, userDucks] = await Promise.all([
    Promise.all(
      farmingDucksRaw.map(async (assetId) => ({
        ...(await getDuckDetails(assetId)),
      }))
    ),
    Promise.all(
      auctionDucksRaw.map(async (assetId) => ({
        ...(await getDuckDetails(assetId)),
      }))
    ),
    Promise.all(
      userDucksRaw.map(async (assetId) => ({
        ...(await getDuckDetails(assetId)),
      }))
    ),
  ]);
  return { farmingDucks, auctionDucks, userDucks };
};

export const compareFarmingDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string => {
  return lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    if (
      current != null &&
      last.farmingParams != null &&
      current.farmingParams != null &&
      last.farmingParams.farmingPower !== current.farmingParams.farmingPower
    ) {
      const duckName = getDuckName(current.name, namesDictionary);
      const duckLink = `https://wavesducks.com/duck/${current.assetId}`;
      acc += `Farming power of duck (${duckName})[${duckLink}] has been changed from ${last.farmingParams.farmingPower}
       to ${current.farmingParams.farmingPower}\n`;
    }
    return acc;
  }, "" as string);
};

export const compareRarityOfDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string =>
  lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    if (
      current != null &&
      last.rarity !== current.rarity &&
      Math.abs(last.rarity - current.rarity) > significantChangeOfRarity
    ) {
      const duckName = getDuckName(current.name, namesDictionary);
      const duckLink = `https://wavesducks.com/duck/${current.assetId}`;
      acc += `Rarity of duck (${duckName})[${duckLink}] has been changed from ${last.rarity.toFixed()} to ${current.rarity.toFixed()}\n`;
    }
    return acc;
  }, "" as string);

export const compareBidDucks = (
  lastArray: IDuckNft[],
  currentArray: IDuckNft[],
  namesDictionary
): string => {
  return lastArray.reduce((acc, last) => {
    const current = currentArray.find(
      ({ assetId }) => assetId === last.assetId
    );
    if (
      current != null &&
      last.startPrice != null &&
      current.startPrice != null &&
      last.auctionId !== current.auctionId
    ) {
      const duckName = getDuckName(current.name, namesDictionary);
      const duckLink = `https://wavesducks.com/duck/${current.assetId}`;

      //todo add quaery to get value of bid
      // https://wavesducks.com/api/blockchain/addresses/data/{auctiondApp}?matches=auction_{auctionId}.
      acc += `Highest Bid of (${duckName})[${duckLink}] has been changed from `;
    }
    return acc;
  }, "" as string);
};
