import { Statistic } from "../models/statistic";

export enum STATISTIC {
  GAME = "GAME",
  INFLUENCERS = "INFLUENCERS",
}

export const updateStats = async (value: string, key: string) => {
  const stats = await Statistic.findOne({ key }).exec();
  if (stats == null) {
    await Statistic.create({ value, key });
    return;
  } else {
    await Statistic.findByIdAndUpdate(stats.id, {
      value,
    }).exec();
  }
};

export const getStatisticFromDB = async (key: string): Promise<string> => {
  const stats = await Statistic.findOne({ key }).exec();
  if (stats == null) return "";
  return stats.value;
};
