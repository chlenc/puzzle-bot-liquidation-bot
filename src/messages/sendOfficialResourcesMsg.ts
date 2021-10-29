import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { keys } from "../index";
import { createInlineButton } from "../utils";

const { telegram: bot } = telegramService;

const sendOfficialResourcesMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.resources, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    },
  });
};
export default sendOfficialResourcesMsg;
