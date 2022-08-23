import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { keyboards } from "../constants";

const { telegram: bot } = telegramService;

const sendWelcomeMsg = async (user: TUserDocument) => {
  await bot
    .sendMessage(
      user.id,
      `Enter coin symbol or name (e.g WAVES, USDN) or token contract address:`,
      { reply_markup: keyboards.addToken }
    )
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendWelcomeMsg;
