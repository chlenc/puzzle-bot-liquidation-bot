import telegramService from "../services/telegramService";
import { getUserLanguageById } from "../controllers/userController";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";

const { telegram: bot } = telegramService;

const sendLangSelectMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.selectLanguage, {
    reply_markup: {
      keyboard: [
        [{ text: lng.button.enLngButtom }],
        [{ text: lng.button.ruLngButtom }],
        [{ text: lng.button.esLngButtom }],
      ],
    },
  });
};
export default sendLangSelectMsg;
