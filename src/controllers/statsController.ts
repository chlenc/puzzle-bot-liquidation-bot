import { Statistic } from "../models/statistic";
import BigNumber from "bignumber.js";
import { getUserById } from "./userController";

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
  const influencers = await Statistic.findOne({ key: "INFLUENCERS" }).exec();
  const ids: number[] = JSON.parse(influencers.data);
  if (ids.length === 0) return;
  const promiseArray = ids.map(async (id) => {
    const user = await getUserById(id);
    const balance = new BigNumber(user.balance)
      .plus(process.env.INFLUENCERS_EGG_AMOUNT)
      .toString();
    await user.updateOne({ balance }).exec();
  });
  await Promise.all(promiseArray);
  console.log("rewardInfluencers for these ids", ids, new Date());
};
