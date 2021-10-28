import telegramService from "../services/telegramService";
import { getUserLanguageById } from "../controllers/userController";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendWelcomeMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.welcome);
  await bot.sendMessage(user.id, lng.message.joinToCommunity, {
    reply_markup: {
      inline_keyboard: [
        [{ text: lng.button.joinChat, url: "google.com" }],
        [createInlineButton(lng.button.alreadyWithYou, keys.alreadyWithYou)],
      ],
    },
  });
};
export default sendWelcomeMsg;
