import * as commitCount from "git-commit-count";
import telegramService from "./services/telegramService";
import {
  checkWalletAddress,
  getCurrentWavesRate,
} from "./services/statsService";
import {
  findByTelegramIdAndUpdate,
  getUserById,
  updateUserActivityInfo,
} from "./controllers/userController";
import { User } from "./models/user";
import msg, { langs } from "./messages_lib";
import { initMongo } from "./services/mongo";
import {
  sendStatisticMessageToChannels,
  watchOnAuction,
  watchOnInfluencers,
  watchOnStats,
} from "./services/crons";
import { getStatisticFromDB, STATISTIC } from "./controllers/statsController";
import { createMessage } from "./controllers/messageController";
import sendLangSelectMsg from "./messages/sendLangSelectMsg";
import sendWelcomeMsg from "./messages/sendWelcomeMsg";
import sendWhatGetTokensForMessage from "./messages/sendWhatGetTokensForMessage";
import sendLearMoreMsg from "./messages/sendLearMoreMsg";
import sendStatisticsMsg from "./messages/sendStatisticsMsg";
import sendOfficialResourcesMsg from "./messages/sendOfficialResourcesMsg";
import sendMyRefsListMsg from "./messages/sendMyRefsListMsg";
import sendTopInfluencersMsg from "./messages/sendTopInfluencersMsg";
import sendFirstRefLinkMsg from "./messages/sendFirstRefLinkMsg";
import sendAffiliateLinkMsg from "./messages/sendAffiliateLinkMsg";
import sendJoinToCommunityMsg from "./messages/sendJoinToCommunityMsg";

const { telegram: bot } = telegramService;
const cron = require("node-cron");

initMongo().then();

const parse_mode = "Markdown";

bot.on("message", async (msg) => {
  const user = await getUserById(msg.from.id);
  switch (msg.text) {
    //LANGUAGES
    case langs.ENG.button.enLngButton:
      await user.update({ lang: "ENG" }).exec();
      await sendWelcomeMsg(user, "ENG");
      await sendJoinToCommunityMsg(user, "ENG");
      break;
    case langs.ENG.button.ruLngButton:
      await user.update({ lang: "RUS" }).exec();
      await sendWelcomeMsg(user, "RUS");
      await sendJoinToCommunityMsg(user, "RUS");
      break;
    case langs.ENG.button.esLngButton:
      await user.update({ lang: "SPA" }).exec();
      await sendWelcomeMsg(user, "SPA");
      await sendJoinToCommunityMsg(user, "SPA");
      break;

    //ALREADY WITH YOU BUTTON
    case langs.ENG.button.alreadyWithYou:
    case langs.RUS.button.alreadyWithYou:
    case langs.SPA.button.alreadyWithYou:
      const res = await telegramService.telegram.getChatMember(
        langs[user.lang].button.telegramChatID,
        user.id
      );
      if (res.status === "member" || res.status === "administrator") {
        await sendWhatGetTokensForMessage(user);
      } else {
        await sendJoinToCommunityMsg(user);
      }
      break;

    // LEARN MORE
    case langs.ENG.button.learnMore:
    case langs.RUS.button.learnMore:
    case langs.SPA.button.learnMore:
      await sendLearMoreMsg(user);
      break;

    // GET REF LINK
    case langs.ENG.button.getRefLink:
    case langs.RUS.button.getRefLink:
    case langs.SPA.button.getRefLink:
      await sendFirstRefLinkMsg(user);
      break;

    //affiliate button
    case langs.ENG.button.affiliateBtn:
    case langs.RUS.button.affiliateBtn:
    case langs.SPA.button.affiliateBtn:
      await sendAffiliateLinkMsg(user);
      break;

    //statistics button
    case langs.ENG.button.statistics:
    case langs.RUS.button.statistics:
    case langs.SPA.button.statistics:
      await sendStatisticsMsg(user);
      break;

    //resources button
    case langs.ENG.button.resources:
    case langs.RUS.button.resources:
    case langs.SPA.button.resources:
      await sendOfficialResourcesMsg(user);
      break;

    //refs button
    case langs.ENG.button.myReferals:
    case langs.RUS.button.myReferals:
    case langs.SPA.button.myReferals:
      await sendMyRefsListMsg(user);
      break;

    //influencers button
    case langs.ENG.button.influencers:
    case langs.RUS.button.influencers:
    case langs.SPA.button.influencers:
      await sendTopInfluencersMsg(user);
      break;
  }
  if (user != null) {
    await updateUserActivityInfo(msg.from);
    msg.chat.type === "private" && (await createMessage(msg.from.id, msg.text));
  }
});

//COMMANDS
bot.onText(/\/start[ \t]*(.*)/, async ({ chat, from }, match) => {
  await updateUserActivityInfo(from);
  const user = await getUserById(from.id);
  if (user != null && match[1] && +match[1] !== from.id) {
    if (!isNaN(parseFloat(match[1]))) {
      await User.findByIdAndUpdate(user._id, {
        ref: +match[1],
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        invitationChannel: match[1],
      });
    }
  }
  await sendLangSelectMsg(user);
});

bot.onText(/\/id/, async ({ chat: { id } }) => {
  await bot.sendMessage(id, String(id));
});

bot.onText(/\/rate/, async ({ chat: { id } }) => {
  const rate = await getCurrentWavesRate();
  await bot.sendMessage(id, rate);
});

bot.onText(/\/version/, async ({ chat: { id } }) => {
  await bot.sendMessage(id, commitCount("chlenc/big-black-duck-bot/"));
});

bot.onText(/\/stats/, async ({ from, chat: { id } }) => {
  const stats = await getStatisticFromDB(STATISTIC.GAME);
  await bot.sendMessage(id, stats, { parse_mode });
});

bot.onText(/\/address[ \t](.+)/, async ({ chat, from }, match) => {
  const address = match[1];

  const isValidAddress = await checkWalletAddress(address).catch(() => false);
  if (!isValidAddress) {
    return await bot.sendMessage(chat.id, msg.wrong_wallet_address);
  }
  await findByTelegramIdAndUpdate(from.id, {
    walletAddress: address,
  });
  await bot.sendMessage(chat.id, msg.correct_wallet_address);
});

bot.onText(/\/cancel/, async ({ chat, from }) => {
  await findByTelegramIdAndUpdate(from.id, {
    walletAddress: null,
    auctionDucks: null,
    farmingDucks: null,
    userDucks: null,
    bids: null,
  });
  await bot.sendMessage(chat.id, msg.cancel_subsc);
});

export enum keys {
  lang,
  alreadyWithYou,
  learnMore,
  getRefLink,
  affiliateLink,
  influencers,
  myRefs,
  resources,
  statistics,
}

bot.on("callback_query", async ({ from, message, data: raw }) => {
  try {
    const { key, data } = JSON.parse(raw);
    const user = await getUserById(from.id);
    await bot.deleteMessage(from.id, String(message.message_id));
    switch (key) {
      case keys.lang:
        await user.update(data).exec();
        await sendWelcomeMsg(user, data.lang);
        break;
      case keys.alreadyWithYou:
        await sendWhatGetTokensForMessage(user);
        break;
      case keys.getRefLink:
        await sendFirstRefLinkMsg(user);
        break;
      case keys.learnMore:
        await sendLearMoreMsg(user);
        break;
      case keys.affiliateLink:
        await sendAffiliateLinkMsg(user);
        break;
      case keys.statistics:
        await sendStatisticsMsg(user);
        break;
      case keys.resources:
        await sendOfficialResourcesMsg(user);
        break;
      case keys.myRefs:
        await sendMyRefsListMsg(user);
        break;
      case keys.influencers:
        await sendTopInfluencersMsg(user);
        break;
    }
  } catch (e) {}
});

cron.schedule("* * * * *", watchOnStats);

cron.schedule("0 * * * *", watchOnInfluencers);

cron.schedule("0 12,19 * * *", sendStatisticMessageToChannels);

cron.schedule("* * * * *", watchOnAuction);

// cron.schedule("*/5 * * * *", watchOnDucks);

process.stdout.write("Bot has been started ✅ ");
