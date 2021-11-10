import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendWhatGetTokensForMessage = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(user.id, lng.message.whatGetTokensFor, {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{ text: lng.button.learnMore }],
          [{ text: lng.button.getRefLink }],
        ],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendWhatGetTokensForMessage;
