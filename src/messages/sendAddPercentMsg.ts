import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { keyboards } from "../constants";
import { Asset, IAsset } from "../models/asset";
import BN from "../utils/BN";

const { telegram: bot } = telegramService;

const sendWelcomeMsg = async (user: TUserDocument, asset: IAsset) => {
  const rate = new BN(asset.data["lastPrice_usd-n"]).toFormat(2);
  await bot
    .sendMessage(
      user.id,
      `${asset.name} (${asset.shortcode}) - $${rate}\n\nEnter % price change of ${asset.shortcode} to receive notifications:`,
      { reply_markup: keyboards.addPercent }
    )
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendWelcomeMsg;
