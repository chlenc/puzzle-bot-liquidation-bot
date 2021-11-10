import { Statistic } from "../models/statistic";
import { withdraw } from "../utils";
import BigNumber from "bignumber.js";
import sendSuccessWithdrawMsg from "../messages/sendSuccessWithdrawMsg";
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
  const amount = process.env.INFLUENCERS_EGG_AMOUNT;

  const promiseArray = ids.map(async (id) => {
    const user = await getUserById(id);
    if (!user.walletAddress) return;
    try {
      const res = await withdraw(
        user.walletAddress,
        new BigNumber(amount).times(1e8).toString()
      );
      if (res.applicationStatus.includes("succeeded")) {
        await sendSuccessWithdrawMsg(user, res.id);
      }
    } catch (e) {
      console.log("Не смог перевести деньги инфльенсеру", e);
    }
  });
  await Promise.all(promiseArray);
  console.log("rewardInfluencers for these ids", ids, new Date());
};
