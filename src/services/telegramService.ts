import * as TelegramBot from "node-telegram-bot-api";
import { sleep } from "../utils";
require("dotenv").config();

class TelegramService {
  telegram: TelegramBot;
  constructor() {
    this.telegram = new TelegramBot(process.env.TOKEN, { polling: true });
  }
  sendChanelMessageWithDelay = async (id: string, msg: string) => {
    try {
      await this.telegram.sendMessage(id, msg, { parse_mode: "Markdown" });
      await sleep(2000);
    } catch (e) {
      console.log(`❌ failed to send message to the group ${id}`);
    }
  };
}
export default new TelegramService();
