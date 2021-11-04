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
      resize_keyboard: true,
      keyboard: [
        [{ text: lng.button.account }],
        [{ text: lng.button.affiliateBtn }],
        [{ text: lng.button.influencers }],
        [{ text: lng.button.myReferals }],
        [{ text: lng.button.statistics }],
        [{ text: lng.button.resources }],
      ],
      inline_keyboard: [
        // [createInlineButton(lng.button.balanceBtn, keys.balance)],
        // [createInlineButton(lng.button.affiliateBtn, keys.affiliateLink)],
        // [createInlineButton(lng.button.influencers, keys.influencers)],
        // [createInlineButton(lng.button.myReferals, keys.myRefs)],
        [{ text: lng.button.faq, url: "https://wavesducks.com/#faq" }],
        // [createInlineButton(lng.button.resources, keys.resources)],
        // [createInlineButton(lng.button.statistics, keys.statistics)],
        [{ text: lng.button.chat, url: lng.button.telegramLink }],
      ],
    },
  });
};
export default sendLearMoreMsg;
