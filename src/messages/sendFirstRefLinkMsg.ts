import telegramService from "../services/telegramService";
import { langs } from "../messages_lib";

const { telegram: bot } = telegramService;

const sendFirstRefLinkMsg = async (user) => {
  const lng = langs[user.lang];
  await bot.sendMessage(
    user.id,
    lng.message.refMsg1
      .replace("{{botName}}", process.env.BOT_NAME)
      .replace("{{userId}}", user.id)
  );
  await bot.sendMessage(user.id, lng.message.refMsg2);
};
export default sendFirstRefLinkMsg;
