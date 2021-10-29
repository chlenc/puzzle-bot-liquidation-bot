import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { keys } from "../index";
import { createInlineButton } from "../utils";
import { getMyRefsList } from "../controllers/userController";

const { telegram: bot } = telegramService;

const sendMyRefsListMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  let list = await getMyRefsList(user.id);
  if (list === "") {
    list = "c";
  }
  await bot.sendMessage(user.id, list, {
    reply_markup: {
      inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    },
  });
};
export default sendMyRefsListMsg;
