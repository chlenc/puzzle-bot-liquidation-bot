import TelegramBot from "node-telegram-bot-api";
import { CHAT_ID, LOG_CHAT_ID, TOKEN } from "../config";

class TelegramService {
  telegram: TelegramBot;
  constructor() {
    this.telegram = new TelegramBot(TOKEN, { polling: true });
    // this.telegram.on("message", (msg) => {
    //   this.telegram.sendMessage(msg.chat.id, msg.chat.id.toString());
    // });
  }
  log = (msg: string) => {
    console.log(msg);
    return this.telegram.sendMessage(LOG_CHAT_ID, msg);
  };
  groupMessage = (msg: string) => this.telegram.sendMessage(CHAT_ID, msg);
}
export default TelegramService;
