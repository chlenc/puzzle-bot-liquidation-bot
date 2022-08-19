import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";

const { telegram: bot } = telegramService;


const sendWelcomeMsg = async (user: TUserDocument, lang?: string) => {
  await bot
    .sendMessage(user.id, `🤖 Hey hey, ${user.first_name}, welcome on board!`, {
      reply_markup: {
        resize_keyboard: true,
        keyboard: [[{ text: "🪙 Add token" },{ text: "✏️ Edit tokens" }],[{ text: "✉️ Contact us" }],],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendWelcomeMsg;
