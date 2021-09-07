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
import msg from "./messages_lib";
import { initMongo } from "./services/mongo";
import {
  sendStatisticMessageToChannels,
  watchOnAuction,
  watchOnDucks,
  watchOnStats,
} from "./services/crons";
import { getStatisticFromDB } from "./controllers/statsController";
import { createMessage } from "./controllers/messageController";

const cron = require("node-cron");

initMongo().then();

const parse_mode = "Markdown";

telegramService.telegram.on("message", async (msg) => {
  await createMessage(msg.from.id, msg.text);
  await updateUserActivityInfo(msg.from);
});

telegramService.telegram.onText(
  /\/start[ \t]*(.*)/,
  async ({ chat, from }, match) => {
    const user = await getUserById(from.id);
    user != null &&
      match[1] &&
      (await User.findByIdAndUpdate(user._id, {
        invitationChannel: match[1],
      }));
    await telegramService.telegram.sendMessage(chat.id, msg.welcome, {
      parse_mode,
    });
  }
);

telegramService.telegram.onText(
  /\/address[ \t](.+)/,
  async ({ chat, from }, match) => {
    const address = match[1];

    const isValidAddress = await checkWalletAddress(address).catch(() => false);
    if (!isValidAddress) {
      return await telegramService.telegram.sendMessage(
        chat.id,
        msg.wrong_wallet_address
      );
    }
    await findByTelegramIdAndUpdate(from.id, {
      walletAddress: address,
    });
    await telegramService.telegram.sendMessage(
      chat.id,
      msg.correct_wallet_address
    );
  }
);

telegramService.telegram.onText(/\/cancel/, async ({ chat, from }) => {
  await findByTelegramIdAndUpdate(from.id, {
    walletAddress: null,
    auctionDucks: null,
    farmingDucks: null,
    userDucks: null,
    bids: null,
  });
  await telegramService.telegram.sendMessage(chat.id, msg.cancel_subsc);
});

telegramService.telegram.onText(/\/id/, async ({ chat: { id } }) => {
  await telegramService.telegram.sendMessage(id, String(id));
});

telegramService.telegram.onText(/\/rate/, async ({ chat: { id } }) => {
  const rate = await getCurrentWavesRate();
  await telegramService.telegram.sendMessage(id, rate);
});

telegramService.telegram.onText(/\/version/, async ({ chat: { id } }) => {
  await telegramService.telegram.sendMessage(
    id,
    commitCount("chlenc/big-black-duck-bot/")
  );
});

telegramService.telegram.onText(/\/stats/, async ({ from, chat: { id } }) => {
  const stats = await getStatisticFromDB();
  await telegramService.telegram.sendMessage(id, stats, { parse_mode });
});

cron.schedule("* * * * *", watchOnStats);

cron.schedule("0 12,19 * * *", sendStatisticMessageToChannels);

cron.schedule("* * * * *", watchOnAuction);

cron.schedule("*/5 * * * *", watchOnDucks);

process.stdout.write("Bot has been started ✅ ");
