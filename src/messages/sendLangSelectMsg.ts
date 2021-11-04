import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendLangSelectMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.selectLanguage, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: [
        [{ text: lng.button.enLngButton }],
        [{ text: lng.button.ruLngButton }],
        [{ text: lng.button.esLngButton }],
      ],
      // inline_keyboard: [
      //   [
      //     createInlineButton(lng.button.ruLngButton, keys.lang, {
      //       lang: "ENG",
      //     }),
      //   ],
      //   [
      //     createInlineButton(lng.button.enLngButton, keys.lang, {
      //       lang: "RUS",
      //     }),
      //   ],
      //   [
      //     createInlineButton(lng.button.esLngButton, keys.lang, {
      //       lang: "SPA",
      //     }),
      //   ],
      // ],
    },
  });
};
export default sendLangSelectMsg;
