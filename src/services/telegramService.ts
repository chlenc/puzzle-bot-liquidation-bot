import TelegramBot from "node-telegram-bot-api";
import { TOKEN } from "../config";

class TelegramService {
  telegram: TelegramBot;
  constructor() {
    this.telegram = new TelegramBot(TOKEN, { polling: true });
  }
}
export default new TelegramService();
