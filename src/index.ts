import * as commitCount from "git-commit-count";
import telegramService from "./services/telegramService";
import {
  checkWalletAddress,
  getCurrentWavesRate,
  getStats,
} from "./services/statsService";
import { getUserById } from "./controllers/userController";
import { User } from "./models/user";
import msg from "./messages_lib";
import { initMongo } from "./services/mongo";
import { watchOnAuction, watchOnDucks } from "./services/crons";

const cron = require("node-cron");

initMongo().then();

telegramService.telegram.onText(/\/start/, async ({ chat, from }) => {
  const user = await getUserById(from.id);
  user == null && (await User.create({ ...from }));
  await telegramService.telegram.sendMessage(chat.id, msg.welcome, {
    parse_mode: "Markdown",
  });
});

telegramService.telegram.onText(
  /\/address[ \t](.+)/,
  async ({ chat, from }, match) => {
    const address = match[1];
    const isValidAddress = await checkWalletAddress(address);
    if (!isValidAddress) {
      return await telegramService.telegram.sendMessage(
        chat.id,
        msg.wrong_wallet_address
      );
    }
    const user = await getUserById(from.id);
    if (user == null) {
      return await telegramService.telegram.sendMessage(
        chat.id,
        "something went wrong"
      );
    }
    await User.findByIdAndUpdate(user._id, {
      walletAddress: address,
    }).exec();
    await telegramService.telegram.sendMessage(
      chat.id,
      msg.correct_wallet_address
    );
  }
);

telegramService.telegram.onText(/\/cancel/, async ({ chat, from }) => {
  const user = await getUserById(from.id);
  if (user == null) {
    return await telegramService.telegram.sendMessage(
      chat.id,
      "something went wrong"
    );
  }
  await User.findByIdAndUpdate(user._id, {
    walletAddress: null,
    auctionDucks: null,
    farmingDucks: null,
    userDucks: null,
  }).exec();
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

telegramService.telegram.onText(/\/stats/, async ({ chat: { id } }) => {
  try {
    const res = await telegramService.telegram.sendMessage(id, msg.loading);
    await getStats(id, res.message_id);
  } catch (e) {
    await telegramService.telegram.sendMessage(
      id,
      "ooops... something went wrong"
    );
    console.log(e.toString());
  }
});

cron.schedule("0 12,19 * * *", getStats);

cron.schedule("* * * * *", watchOnAuction);

cron.schedule("* * * * *", watchOnDucks);

process.stdout.write("Bot has been started ✅ ");
