import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";
import { getMyRefsList } from "../controllers/userController";

const { telegram: bot } = telegramService;

const sendMyRefsListMsg = async (user: TUserDocument) => {
  const lng = langs[user.lang];
  let list = await getMyRefsList(user.id);
  if (list === "") {
    list = lng.message.noRefs;
  } else {
    list = lng.button.myReferals + list;
  }
  await bot
    .sendMessage(user.id, list, { parse_mode: "HTML" })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendMyRefsListMsg;
