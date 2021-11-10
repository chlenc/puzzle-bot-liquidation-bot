import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { buildHtmlUserLink, createInlineButton } from "../utils";
import { keys } from "../index";

const { telegram: bot } = telegramService;

const sendRequestApproveMsgToAdmins = async (user: TUserDocument) => {
  const msg = `${buildHtmlUserLink(user)} wants to withdraw ${
    user.balance
  } EGGs`;
  const inline_keyboard = [
    [createInlineButton("✅ Approve", keys.withdrawApprove, { id: user.id })],
    [createInlineButton("❌ Reject", keys.withdrawReject, { id: user.id })],
  ];
  await bot
    .sendMessage(process.env.CONFIRM_GROUP_ID, msg, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendRequestApproveMsgToAdmins;
