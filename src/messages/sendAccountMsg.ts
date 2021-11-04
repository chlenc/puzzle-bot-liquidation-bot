import telegramService from "../services/telegramService";
import { langs } from "../messages_lib";
import { diffDays } from "../utils";
import { getMyRefsCount, getUserById } from "../controllers/userController";

const { telegram: bot } = telegramService;

const sendAccountMsg = async (user) => {
  const lng = langs[user.lang];
  const days = diffDays(new Date(user.createdAt), new Date());
  //todo add  link to sponsor
  const changeValues = {
    "{{daysWithUs}}": days,
    "{{balance}}": "0.000",
  };
  const re = new RegExp(Object.keys(changeValues).join("|"), "gi");
  let str = lng.message.accountInfo.replace(
    re,
    (matched) => changeValues[matched]
  );

  await bot.sendMessage(user.id, str);
};
export default sendAccountMsg;
