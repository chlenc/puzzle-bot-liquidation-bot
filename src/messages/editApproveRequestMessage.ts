import telegramService from "../services/telegramService";
import { InlineKeyboardButton } from "node-telegram-bot-api";

const { telegram: bot } = telegramService;

const editApproveRequestMessage = async (
  message_id: number,
  button?: InlineKeyboardButton
) =>
  bot
    .editMessageReplyMarkup(
      { inline_keyboard: button != null ? [[button]] : undefined },
      { message_id, chat_id: process.env.CONFIRM_GROUP_ID }
    )
    .catch(() => console.log(`❗️cannot edit message ${message_id}`));

export default editApproveRequestMessage;
