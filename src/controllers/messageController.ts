import { Message } from "../models/message";
import TelegramBot from "node-telegram-bot-api";

export const createMessage = async (msg: TelegramBot.Message) => {
  if (msg.chat.type === "private") {
    await Message.create({ userId: msg.from.id, message: msg.text });
  }
};
