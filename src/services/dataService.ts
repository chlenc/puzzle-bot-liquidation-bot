import axios from "axios";
import { prettifyNums } from "../utils";
import * as moment from "moment";

const decimals = 1e8;

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

export const lastPriceForEgg = async () => {
  const { data } = await axios.get(
    "https://backend.swop.fi/exchangers/3PNVFWopwCD9CgGXkpYWEY94oQ5XCAEXBmQ"
  );
  const price = (
    Number.parseInt(data.data.B_asset_balance) /
    100000000 /
    (Number.parseInt(data.data.A_asset_balance) / 100)
  ).toFixed(2);

  return `🥚 Last price for EGG: *$${price}*`;
};
export const totalFarmingPower = async () => {
  const { data } = await axios.get("https://duxplorer.com/farming/json");
  const res = data.farmData.reduce(
    (acc, { farmingPower }) => acc + farmingPower,
    0
  );
  return `💪 Total farming power: *$${res} EGG*`;
};

export const lastDuckPriceForHatching = async () => {
  const { data } = await axios.get(
    "https://wavesducks.wavesnodes.com/addresses/data/3PEktVux2RhchSN63DsDo4b4mz4QqzKSeDv/ducks_last_price"
  );
  const hatching = data.value / 100;

  return `🥚 > 🦆 Last duck price for hatching: *${hatching} EGG*`;
};

export const getCurrentWavesRate = async () => {
  const { data } = await axios.get(
    "https://api.coingecko.com/api/v3/coins/waves?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false"
  );
  return data.market_data.current_price.usd;
};

export const totalNumberOfDucks = async () => {
  const hatching = await axios.get("https://duxplorer.com/hatching/json");
  const breeding = await axios.get("https://duxplorer.com/breeding/json");
  const ducks = hatching.data.length + breeding.data.length;
  return `🦆 Total number of ducks: *${ducks}*`;
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
  return `🔥 Number of ducks burned today (с 12 часов ночи по мск) : *${data.rebirthData.length}* / *${today}*`;
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
  const difference = ((lastWeekSales - twoWeeksAgoSales) / lastWeekSales) * 100;

  const res = {
    lastWeekSales: prettifyNums(Math.round(lastWeekSales)),
    difference: Math.abs(difference).toFixed(2),
    percents: difference !== 0 ? Math.round(Math.abs(difference)) : "",
    totalSales: prettifyNums(Math.round(totalSales)),
  };

  return `💰 Ducks sales weekly / in total: *$${res.lastWeekSales}* (${
    difference < 0 ? "⬇️" : "⬆️"
  }️*${res.difference}%)* / *$${res.totalSales}*`;
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
