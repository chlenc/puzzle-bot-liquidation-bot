import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendJoinToCommunityMsg = async (user: TUserDocument, lang?: string) => {
  const lng = langs[lang != null ? lang : user.lang];
  await bot
    .sendMessage(user.id, lng.message.joinToCommunity, {
      reply_markup: {
        inline_keyboard: [
          [{ text: lng.button.joinChat, url: lng.link.telegramLink }],
        ],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendJoinToCommunityMsg;
