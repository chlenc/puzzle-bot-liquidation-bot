import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import { langs } from "../messages_lib";
import { getStatisticFromDB, STATISTIC } from "../controllers/statsController";

const { telegram: bot } = telegramService;

const sendStatisticsMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  const stats = await getStatisticFromDB(STATISTIC.GAME);
  await bot.sendMessage(user.id, lng.button.statistics + stats, {
    parse_mode: "Markdown",
  });
};
export default sendStatisticsMsg;
