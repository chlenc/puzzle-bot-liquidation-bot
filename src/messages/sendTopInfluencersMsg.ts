import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";
import { getStatisticFromDB, STATISTIC } from "../controllers/statsController";

const { telegram: bot } = telegramService;

const sendTopInfluencersMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  const top10 = await getStatisticFromDB(STATISTIC.INFLUENCERS);
  await bot
    .sendMessage(user.id, `${lng.button.influencers}\n ${top10}`, {
      parse_mode: "HTML",
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendTopInfluencersMsg;
