import { Statistic } from "../models/statistic";
import { getMostFrequentInfluencers } from "../services/statsService";
import { getUniqueRandomWinnersFromArray } from "../utils";
import BigNumber from "bignumber.js";

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
  const influencers = await getMostFrequentInfluencers();
  const winners = getUniqueRandomWinnersFromArray(
    influencers.reduce(
      (acc, { count, user }) => [
        ...acc,
        ...Array.from({ length: count }, () => user.id),
      ],
      [] as Array<number>
    ),
    Number(process.env.EVERYDAY_WINNERS_COUNT)
  );
  await Promise.all(
    winners.map(async (id) => {
      const record = influencers.find(({ user }) => user.id === id);
      if (!record.user) return;
      const balance = new BigNumber(record.user.balance)
        .plus(process.env.EGG_AMOUNT)
        .toString();
      await record.user.updateOne({ balance }).exec();
    })
  );
};
