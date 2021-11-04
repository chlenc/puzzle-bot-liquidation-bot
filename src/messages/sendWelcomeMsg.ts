import telegramService from "../services/telegramService";
import { getUserLanguageById } from "../controllers/userController";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendWelcomeMsg = async (user: TUserDocument, lang?: string) => {
  const lng = langs[lang != null ? lang : user.lang];
  await bot.sendMessage(user.id, lng.message.welcome, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [[{ text: lng.button.alreadyWithYou }]],
    },
  });
};
export default sendWelcomeMsg;
