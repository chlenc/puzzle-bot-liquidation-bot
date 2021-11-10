import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendLangSelectMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(user.id, lng.message.selectLanguage, {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{ text: lng.button.enLngButton }],
          [{ text: lng.button.ruLngButton }],
          [{ text: lng.button.esLngButton }],
        ],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendLangSelectMsg;
