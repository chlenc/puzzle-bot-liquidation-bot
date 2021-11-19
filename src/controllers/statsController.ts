import { Statistic } from "../models/statistic";
import BigNumber from "bignumber.js";
import { getUserById } from "./userController";
import * as moment from "moment";
import { User } from "../models/user";
import { getMostFrequentInfluencers } from "../services/statsService";
import { getRandomNumbersFromArray } from "../utils";

export enum STATISTIC {
  GAME = "GAME",
  INFLUENCERS = "INFLUENCERS",
}

export const updateStats = async (
  v: { value: string; data?: string },
  key: string
) => {
  const stats = await Statistic.findOne({ key }).exec();
  if (stats == null) {
    await Statistic.create({ ...v, key });
    return;
  } else {
    await Statistic.findByIdAndUpdate(stats.id, {
      ...v,
    }).exec();
  }
};

export const getStatisticFromDB = async (key: string): Promise<string> => {
  const stats = await Statistic.findOne({ key }).exec();
  if (stats == null) return "";
  return stats.value;
};

export const rewardInfluencers = async () => {
  const todayDate = moment().startOf("day").toISOString();
  const userAddedToday = await User.find({
    createdAt: {
      $gte: todayDate,
    },
    ref: { $exists: true },
  });
  const influencers: Array<string> = getMostFrequentInfluencers(userAddedToday);
  const winnersPositionsArray = getRandomNumbersFromArray(
    influencers.length,
    Number(process.env.EVERYDAY_WINNERS_COUNT)
  );
  return await Promise.all(
    winnersPositionsArray.map(async (i) => {
      const influencer = influencers[i];
      //todo reward influancer
    })
  );
};
