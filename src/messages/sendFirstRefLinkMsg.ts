import telegramService from "../services/telegramService";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendFirstRefLinkMsg = async (user) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(
      user.id,
      lng.message.refMsg1
        .replace("{{botName}}", process.env.BOT_NAME)
        .replace("{{userId}}", user.id)
    )
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
  await bot
    .sendMessage(user.id, lng.message.refMsg2)
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendFirstRefLinkMsg;
