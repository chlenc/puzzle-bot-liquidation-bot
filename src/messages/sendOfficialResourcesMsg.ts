import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendOfficialResourcesMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.selectLanguage, {
    reply_markup: {
      inline_keyboard: [
        [
          createInlineButton(lng.button.enLngButtom, keys.lang, {
            lang: "ENG",
          }),
        ],
      ],
    },
  });
};
export default sendOfficialResourcesMsg;
