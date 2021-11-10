import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendTranslatedMessage = async (user: TUserDocument, key: string) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(user.id, lng.message[key])
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendTranslatedMessage;
