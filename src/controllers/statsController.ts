import { Statistic } from "../models/statistic";

export const updateStats = async (statsValue: string) => {
  const stats = await Statistic.findOne().exec();
  if (stats == null) {
    await Statistic.create({ value: statsValue });
    return;
  } else {
    await Statistic.findByIdAndUpdate(stats.id, {
      value: statsValue,
    });
  }
};

export const getStatisticFromDB = async (): Promise<string> => {
  const stats = await Statistic.findOne().exec();
  if (stats == null) return "";
  return stats.value;
};
