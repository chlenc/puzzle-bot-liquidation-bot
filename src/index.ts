import * as commitCount from "git-commit-count";
import telegramService from "./services/telegramService";
import {
  checkWalletAddress,
  getCurrentWavesRate,
} from "./services/statsService";
import {
  createUser,
  getUserById,
  setWalletAddress,
  updateUserActivityInfo,
} from "./controllers/userController";
import { langs } from "./messages_lib";
import { initMongo } from "./services/mongo";
import {
  watchOnAuction,
  watchOnInfluencers,
  watchOnStats,
} from "./services/crons";
import {
  getStatisticFromDB,
  rewardInfluencers,
  STATISTIC,
} from "./controllers/statsController";
import sendLangSelectMsg from "./messages/sendLangSelectMsg";
import sendWelcomeMsg from "./messages/sendWelcomeMsg";
import sendWhatGetTokensForMessage from "./messages/sendWhatGetTokensForMessage";
import sendLearMoreMsg from "./messages/sendLearMoreMsg";
import sendStatisticsMsg from "./messages/sendStatisticsMsg";
import sendMyRefsListMsg from "./messages/sendMyRefsListMsg";
import sendTopInfluencersMsg from "./messages/sendTopInfluencersMsg";
import sendFirstRefLinkMsg from "./messages/sendFirstRefLinkMsg";
import sendAffiliateLinkMsg from "./messages/sendAffiliateLinkMsg";
import sendJoinToCommunityMsg from "./messages/sendJoinToCommunityMsg";
import sendNeedJoinToCommunityMsg from "./messages/sendNeedJoinToCommunityMsg";
import sendAccountMsg from "./messages/sendAccountMsg";
import { getTxLink, sleep, withdraw } from "./utils";
import { createMessage } from "./controllers/messageController";
import BigNumber from "bignumber.js";
import sendSuccessWithdrawMsg from "./messages/sendSuccessWithdrawMsg";
import sendRequestApproveMsgToAdmins from "./messages/sendRequestApproveMsgToAdmins";
import editApproveRequestMessage from "./messages/editApproveRequestMessage";
import sendTranslatedMessage from "./messages/sendTranslatedMessage";

const { telegram: bot } = telegramService;
const cron = require("node-cron");

initMongo().then();

const parse_mode = "Markdown";

bot.on("message", async (msg) => {
  const user = await getUserById(msg.from.id);
  if (/\/start[ \t]*(.*)/.test(msg.text)) return;
  if (user == null) {
    await bot
      .sendMessage(msg.from.id, langs.ENG.message.hasNoUserError)
      .catch(() => console.log(`❗️cannot send message to ${msg.from.id}`));

    return;
  }
  switch (msg.text) {
    //LANGUAGES
    case langs.ENG.button.enLngButton:
      await user.updateOne({ lang: "ENG" }).exec();
      await sendWelcomeMsg(user, "ENG");
      await sendJoinToCommunityMsg(user, "ENG");
      break;
    case langs.ENG.button.ruLngButton:
      await user.updateOne({ lang: "RUS" }).exec();
      await sendWelcomeMsg(user, "RUS");
      await sendJoinToCommunityMsg(user, "RUS");
      break;
    case langs.ENG.button.esLngButton:
      await user.updateOne({ lang: "SPA" }).exec();
      await sendWelcomeMsg(user, "SPA");
      await sendJoinToCommunityMsg(user, "SPA");
      break;

    //ALREADY WITH YOU BUTTON
    case langs.ENG.button.alreadyWithYou:
    case langs.RUS.button.alreadyWithYou:
    case langs.SPA.button.alreadyWithYou:
      const res = await telegramService.telegram.getChatMember(
        `@${langs[user.lang].link.telegramLink.split("/").pop()}`,
        String(user.id)
      );
      if (res.status === "member" || res.status === "administrator") {
        await sendWhatGetTokensForMessage(user);
      } else {
        await sendNeedJoinToCommunityMsg(user);
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

    //my account button
    case langs.ENG.button.account:
    case langs.RUS.button.account:
    case langs.SPA.button.account:
      await sendAccountMsg(user);
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
      await sendTranslatedMessage(user, "resources");
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

    //FAQ button
    case langs.ENG.button.faq:
    case langs.RUS.button.faq:
    case langs.SPA.button.faq:
      await sendTranslatedMessage(user, "faqMsg");
      break;

    //chat button
    case langs.ENG.button.chat:
    case langs.RUS.button.chat:
    case langs.SPA.button.chat:
      await sendTranslatedMessage(user, "chatMsg");
      break;
  }

  switch (user.state) {
    case keys.enterAddress:
      const success = await setWalletAddress(user, msg.text);
      if (!success) {
        await sleep(1000);
        await sendTranslatedMessage(user, "wrongWalletAddress");
      }
      await sendAccountMsg(await getUserById(msg.from.id));
      break;
  }

  await updateUserActivityInfo(user);
  await createMessage(msg);
});

//COMMANDS
bot.onText(/\/start[ \t]*(.*)/, async ({ chat, from }, match) => {
  let user = await getUserById(from.id);
  if (user == null) user = await createUser(from, match);
  await updateUserActivityInfo(user);
  await sendLangSelectMsg(user);
});

bot.onText(/\/id/, async ({ chat: { id } }) => {
  await bot
    .sendMessage(id, String(id))
    .catch(() => console.log(`❗️cannot send message to ${id}`));
});

bot.onText(/\/rate/, async ({ chat: { id } }) => {
  const rate = await getCurrentWavesRate();
  await bot
    .sendMessage(id, rate)
    .catch(() => console.log(`❗️cannot send message to ${id}`));
});

bot.onText(/\/version/, async ({ chat: { id } }) => {
  await bot
    .sendMessage(id, commitCount("chlenc/big-black-duck-bot/"))
    .catch(() => console.log(`❗️cannot send message to ${id}`));
});

bot.onText(/\/stats/, async ({ chat: { id } }) => {
  const stats = await getStatisticFromDB(STATISTIC.GAME);
  await bot
    .sendMessage(id, stats, { parse_mode })
    .catch(() => console.log(`❗️cannot send message to ${id}`));
});
//
// bot.onText(/\/address[ \t](.+)/, async ({ chat, from }, match) => {
//   const address = match[1];
//
//   const isValidAddress = await checkWalletAddress(address).catch(() => false);
//   if (!isValidAddress) {
//     return await bot.sendMessage(chat.id, msg.wrong_wallet_address);
//   }
//   await findByTelegramIdAndUpdate(from.id, {
//     walletAddress: address,
//   });
//   await bot.sendMessage(chat.id, msg.correct_wallet_address);
// });
//
// bot.onText(/\/cancel/, async ({ chat, from }) => {
//   await findByTelegramIdAndUpdate(from.id, {
//     walletAddress: null,
//     auctionDucks: null,
//     farmingDucks: null,
//     userDucks: null,
//     bids: null,
//   });
//   await bot.sendMessage(chat.id, msg.cancel_subsc);
// });

export enum keys {
  enterAddress = "enterAddress",
  withdraw = "withdraw",
  changeAddress = "changeAddress",
  withdrawApprove = "withdrawApprove",
  withdrawReject = "withdrawReject",
}

bot.on("callback_query", async ({ from, message, data: raw }) => {
  try {
    const { key, data } = JSON.parse(raw);
    const user = await getUserById(from.id);
    if (user == null) {
      await bot
        .sendMessage(from.id, langs.ENG.message.hasNoUserError)
        .catch(() => console.log(`❗️cannot send message to ${from.id}`));
      return;
    }
    // await bot.deleteMessage(from.id, String(message.message_id));
    switch (key) {
      case keys.enterAddress:
      case keys.changeAddress:
        await user.updateOne({ state: keys.enterAddress }).exec();
        await sendTranslatedMessage(user, "enterWalletAddress");
        break;
      case keys.withdraw:
        if (Number(user.balance) === 0) return;
        const isAddressValid = await checkWalletAddress(user.walletAddress);
        if (!isAddressValid) {
          await sendTranslatedMessage(user, "wrongWalletAddress");
          break;
        }
        if (new BigNumber(user.balance).gt(process.env.MAX_WITHDRAW)) {
          await sendTranslatedMessage(user, "waitingForAdminConfirm");
          await sendRequestApproveMsgToAdmins(user);
          return;
        } else {
          await sendTranslatedMessage(user, "withdrawProcess");
          const res = await withdraw(
            user.walletAddress,
            new BigNumber(user.balance).times(1e8).toString()
          );
          if (res.applicationStatus === ("succeeded" as any)) {
            await user.updateOne({ balance: "0" }).exec();
            await sendSuccessWithdrawMsg(user, res.id);
            await sendAccountMsg(await getUserById(from.id));
          } else {
            await sendTranslatedMessage(user, "somethingWrong");
          }
        }
        break;
      case keys.withdrawApprove:
        const targetUser = await getUserById(data.id);
        if (targetUser == null) break;
        if (Number(targetUser.balance) === 0) {
          await bot.deleteMessage(
            process.env.CONFIRM_GROUP_ID,
            String(message.message_id)
          );
          break;
        }
        await editApproveRequestMessage(message.message_id);
        const res = await withdraw(
          targetUser.walletAddress,
          new BigNumber(targetUser.balance).times(1e8).toString()
        );
        await editApproveRequestMessage(message.message_id, {
          text: "✅ Approved",
          url: getTxLink(res.id),
        });
        if (res.applicationStatus === ("succeeded" as any)) {
          await targetUser.updateOne({ balance: "0" }).exec();
          await sendSuccessWithdrawMsg(targetUser, res.id);
        } else {
          await sendTranslatedMessage(user, "somethingWrong");
        }
        break;
      case keys.withdrawReject:
        const requestedUser = await getUserById(data.id);
        if (requestedUser == null) break;
        if (Number(requestedUser.balance) === 0) {
          await bot.deleteMessage(
            process.env.CONFIRM_GROUP_ID,
            String(message.message_id)
          );
          break;
        }
        await editApproveRequestMessage(message.message_id, {
          text: `❌ Rejected by ${user.first_name}`,
          url: `tg://user?id=${user.id}`,
        });
        await sendTranslatedMessage(
          requestedUser,
          langs.RUS.message.withdrawRejected
        );
        break;
    }
  } catch (e) {}
});

// cron.schedule("* * * * *", watchOnStats);

// cron.schedule("0 * * * *", watchOnInfluencers);

// cron.schedule("0 12,19 * * *", sendStatisticMessageToChannels);

// cron.schedule("* * * * *", watchOnAuction);

// cron.schedule("*/5 * * * *", watchOnDucks);

(async () => {
  setInterval(async () => {
    await watchOnAuction();
  }, 5 * 60 * 1000);
})();

(async () => {
  setInterval(async () => {
    await watchOnInfluencers();
  }, 15 * 60 * 1000);
})();

(async () => {
  setInterval(async () => {
    await watchOnStats();
  }, 5 * 60 * 1000);
})();

cron.schedule("50 23 * * *", rewardInfluencers);

process.stdout.write("Bot has been started ✅ ");
