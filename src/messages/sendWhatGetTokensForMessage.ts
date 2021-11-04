import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendWhatGetTokensForMessage = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.whatGetTokensFor, {
    reply_markup: {
      keyboard: [
        [{ text: lng.button.learnMore }],
        [{ text: lng.button.getRefLink }],
      ],
      // inline_keyboard: [
      //   [createInlineButton(lng.button.learnMore, keys.learnMore)],
      //   [createInlineButton(lng.button.getRefLink, keys.getRefLink)],
      // ],
    },
  });
};
export default sendWhatGetTokensForMessage;
