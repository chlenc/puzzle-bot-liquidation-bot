import telegramService from "../services/telegramService";
import { langs } from "../messages_lib";
import { keys } from "../index";
import { createInlineButton } from "../utils";

const { telegram: bot } = telegramService;

const sendFirstRefLinkMsg = async (user) => {
  const lng = langs[user.lang];
  const message =
    lng.message.refMsg1.replace("userId", user.id) + lng.message.refMsg2;

  await bot.sendMessage(user.id, message, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    },
  });
};
export default sendFirstRefLinkMsg;
