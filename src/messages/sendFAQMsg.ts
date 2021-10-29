import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { keys } from "../index";
import { createInlineButton } from "../utils";

const { telegram: bot } = telegramService;

const sendFAQMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.button.faq, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    },
  });
};
export default sendFAQMsg;
