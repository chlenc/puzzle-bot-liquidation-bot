import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { getStatisticFromDB } from "../controllers/statsController";
import { keys } from "../index";
import { createInlineButton } from "../utils";

const { telegram: bot } = telegramService;

const sendRefLinkMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  const stats = await getStatisticFromDB();
  await bot.sendMessage(user.id, lng.button.statistics + stats, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    },
  });
};
export default sendRefLinkMsg;
