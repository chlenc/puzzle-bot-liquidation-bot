import * as commitCount from "git-commit-count";
import telegramService from "./services/telegramService";
import {
  checkWalletAddress,
  getCurrentWavesRate,
} from "./services/statsService";
import {
  createUser,
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
  watchOnDucks,
  watchOnStats,
} from "./services/crons";
import { getStatisticFromDB } from "./controllers/statsController";
import { createMessage } from "./controllers/messageController";
import sendLangSelectMsg from "./messages/sendLangSelectMsg";
import sendWelcomeMsg from "./messages/sendWelcomeMsg";
import sendWhatGetTokensForMessage from "./messages/sendWhatGetTokensForMessage";
import sendLearMoreMsg from "./messages/sendLearMoreMsg";

const { telegram: bot } = telegramService;
const cron = require("node-cron");

initMongo().then();

const parse_mode = "Markdown";

//COMMANDS
bot.onText(/\/start/, async ({ from }) => {
  const user = await createUser(from);
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
  const stats = await getStatisticFromDB();
  await bot.sendMessage(id, stats, { parse_mode });
});

export enum keys {
  lang,
  alreadyWithYou,
  learnMore,
  getRefLink,
  balance,
  affiliateLink,
  influencers,
  myRefs,
  faq,
  officialResources,
  statistics,
  chat,
}

bot.on("callback_query", async ({ from, message, data: raw }) => {
  try {
    const { key, data } = JSON.parse(raw);
    const user = await getUserById(from.id);
    switch (key) {
      case keys.lang:
        await user.update(data).exec();
        await bot.deleteMessage(from.id, String(message.message_id));
        await sendWelcomeMsg(user);
        break;
      case keys.alreadyWithYou:
        await bot.deleteMessage(from.id, String(message.message_id));
        await sendWhatGetTokensForMessage(user);
        break;
      case keys.learnMore:
        await bot.deleteMessage(from.id, String(message.message_id));
        await sendLearMoreMsg(user);
    }
  } catch (e) {}
});

// you can use MESSAGES template to handle text callbacks
// bot.on("message", async ({ from, text, message_id }) => {
// const user = await getUserById(from.id);
// const lng = langs[user.lang];
// switch (text) {
// case lng.button.enLngButtom:
//   await user.update({ lang: "ENG" }).exec();
//   await sendWelcomeMsg(user);
//   break;
// }
// });

// todo refactor this shit 👇🏻

// bot.onText(/\/start[ \t]*(.*)/, async ({ chat, from }, match) => {
//   const user = await getUserById(from.id);
//   user != null &&
//     match[1] &&
//     (await User.findByIdAndUpdate(user._id, {
//       invitationChannel: match[1],
//     }));
//   await bot.sendMessage(chat.id, msg.welcome, {
//     parse_mode,
//   });
// });

bot.on("message", async (msg) => {
  await createMessage(msg.from.id, msg.text);
  await updateUserActivityInfo(msg.from);
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

cron.schedule("* * * * *", watchOnStats);

cron.schedule("0 12,19 * * *", sendStatisticMessageToChannels);

cron.schedule("* * * * *", watchOnAuction);

cron.schedule("*/5 * * * *", watchOnDucks);

process.stdout.write("Bot has been started ✅ ");
