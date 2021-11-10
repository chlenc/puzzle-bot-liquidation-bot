import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendLearMoreMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(user.id, lng.message.toolbar, {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [
          [{ text: lng.button.account }],
          [{ text: lng.button.affiliateBtn }],
          [{ text: lng.button.influencers }],
          [{ text: lng.button.myReferals }],
          [{ text: lng.button.statistics }],
          [{ text: lng.button.resources }],
          [{ text: lng.button.faq }],
          [{ text: lng.button.chat }],
        ],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendLearMoreMsg;
