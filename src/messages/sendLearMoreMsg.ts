import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendLearMoreMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  await bot.sendMessage(user.id, lng.message.toolbar, {
    reply_markup: {
      inline_keyboard: [
        // [createInlineButton(lng.button.balanceBtn, keys.balance)],
        [createInlineButton(lng.button.affiliateBtn, keys.affiliateLink)],
        // [createInlineButton(lng.button.influencers, keys.influencers)],
        [createInlineButton(lng.button.MyReferals, keys.myRefs)],
        [createInlineButton(lng.button.faq, keys.faq)],
        [createInlineButton(lng.button.resources, keys.resources)],
        [createInlineButton(lng.button.statistics, keys.statistics)],
        [createInlineButton(lng.button.chat, keys.chat)],
      ],
    },
  });
};
export default sendLearMoreMsg;
