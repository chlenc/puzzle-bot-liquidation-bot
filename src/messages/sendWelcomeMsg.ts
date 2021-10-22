import telegramService from "../services/telegramService";
import { getUserLanguageById } from "../controllers/userController";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";

const { telegram: bot } = telegramService;

const sendWelcomeMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.welcome, {
    reply_markup: { remove_keyboard: true },
  });
  await bot.sendMessage(user.id, lng.message.joinToCommunity, {
    reply_markup: { inline_keyboard: [] },
  });
};
export default sendWelcomeMsg;
