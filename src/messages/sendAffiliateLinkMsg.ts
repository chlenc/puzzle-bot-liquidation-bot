import telegramService from "../services/telegramService";
import { langs } from "../messages_lib";
import { keys } from "../index";
import { createInlineButton, diffDays } from "../utils";
import { getMyRefsCount, getUserById } from "../controllers/userController";

const { telegram: bot } = telegramService;

const sendAffiliateLinkMsg = async (user) => {
  const lng = langs[user.lang];
  const days = diffDays(new Date(user.createdAt), new Date());
  const sponsor = await getUserById(user.ref);
  const friends = await getMyRefsCount(user.id);

  const changeValues = {
    "{{daysWithUs}}": days,
    "{{sponsorName}}": sponsor ? sponsor.username : "-",
    "{{invitedFriends}}": friends,
    "{{userId}}": user.id,
    "{{botName}}": process.env.BOT_NAME,
  };

  const re = new RegExp(Object.keys(changeValues).join("|"), "gi");
  let str = lng.message.affiliateMsg.replace(
    re,
    (matched) => changeValues[matched]
  );

  await bot.sendMessage(user.id, str, {
    parse_mode: "Markdown",
    // reply_markup: {
    //   inline_keyboard: [[createInlineButton(lng.button.back, keys.learnMore)]],
    // },
  });
};
export default sendAffiliateLinkMsg;
