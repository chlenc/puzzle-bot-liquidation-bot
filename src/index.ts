import * as TelegramBot from "node-telegram-bot-api";
import * as Twit from "twit";
import * as commitCount from "git-commit-count";
import {
  checkWalletAddress,
  compareBidDucks,
  compareFarmingDucks,
  compareRarityOfDucks,
  getAnalytics,
  getCurrentWavesRate,
  updateDuckForUser,
} from "./services/statsService";
import { getUserById } from "./controllers/userController";
import { DuckUser } from "./models/duckUser";
import watcherService from "./services/watcherService";
import axios from "axios";
import { getDuckName, sleep } from "./utils";
import msg from "./messages_lib";
import { initMongo } from "./services/mongo";

const cron = require("node-cron");

require("dotenv").config();

const telegram = new TelegramBot(process.env.TOKEN, { polling: true });

const twitter = new Twit({
  consumer_key: "kjzrtE8Wl5Q4yiR9AOgRYsBda",
  consumer_secret: "Lrzc2iLzc2G8XXMldwNXe0NScCBWqjtrhiqrQTtty8wFGnVu7R",
  access_token: "1411844553351467008-DoA7Icg0ohPc15mKWRGR545FJFM3mc",
  access_token_secret: "AoBwxMaiTPt0GDuthAz3zuJLimK6SHUJQlzACQllwib1k",
});

initMongo().then();

telegram.onText(/\/start/, async ({ chat, from }) => {
  const user = await getUserById(from.id);
  user == null && (await DuckUser.create({ ...from }));
  await telegram.sendMessage(chat.id, msg.welcome, { parse_mode: "Markdown" });
});

telegram.onText(/\/address[ \t](.+)/, async ({ chat, from }, match) => {
  const address = match[1];
  const isValidAddress = await checkWalletAddress(address);
  if (!isValidAddress) {
    return await telegram.sendMessage(chat.id, msg.wrong_wallet_address);
  }
  const user = await getUserById(from.id);
  if (user == null) {
    return await telegram.sendMessage(chat.id, "something went wrong");
  }
  await DuckUser.findByIdAndUpdate(user._id, {
    walletAddress: address,
  }).exec();
  await telegram.sendMessage(chat.id, msg.correct_wallet_address);
});

telegram.onText(/\/cancel/, async ({ chat, from }) => {
  const user = await getUserById(from.id);
  if (user == null) {
    return await telegram.sendMessage(chat.id, "something went wrong");
  }
  await DuckUser.findByIdAndUpdate(user._id, {
    walletAddress: null,
    auctionDucks: null,
    farmingDucks: null,
    userDucks: null,
  }).exec();
});

telegram.onText(/\/id/, async ({ chat: { id } }) => {
  await telegram.sendMessage(id, String(id));
});

telegram.onText(/\/rate/, async ({ chat: { id } }) => {
  const rate = await getCurrentWavesRate();
  await telegram.sendMessage(id, rate);
});

telegram.onText(/\/version/, async ({ chat: { id } }) => {
  await telegram.sendMessage(id, commitCount("chlenc/big-black-duck-bot/"));
});

telegram.onText(/\/stats/, async ({ chat: { id } }) => {
  try {
    const res = await telegram.sendMessage(id, msg.loading);
    const stats = await getAnalytics();
    await telegram.editMessageText(stats, {
      parse_mode: "Markdown",
      chat_id: id,
      message_id: res.message_id,
    });
  } catch (e) {
    await telegram.sendMessage(id, "ooops... something went wrong");
    console.log(e.toString());
  }
});

const sendChanelMessage = async (id: string, msg: string) => {
  try {
    await telegram.sendMessage(id, msg, { parse_mode: "Markdown" });
    await sleep(2000);
  } catch (e) {
    console.log(`❌ failed to send message to the group ${id}`);
  }
};

const decimals = 1e8;

cron.schedule("0 12,19 * * *", async () => {
  const msg = await getAnalytics();
  try {
    await sendChanelMessage(process.env.RU_GROUP_ID, msg);
    await sleep(2000);
    await sendChanelMessage(process.env.EN_GROUP_ID, msg);
    await sleep(2000);
    await sendChanelMessage(process.env.ES_GROUP_ID, msg);
    await sleep(2000);
    await sendChanelMessage(process.env.AR_GROUP_ID, msg);
    await sleep(2000);
    await sendChanelMessage(process.env.PER_GROUP_ID, msg);
    await sleep(2000);
  } catch (err) {
    console.error(err);
  }
});

(async () => {
  setInterval(async () => {
    const data = await watcherService.getUnsentData();
    const rate = await getCurrentWavesRate();
    const { data: dict } = await axios.get(
      "https://wavesducks.com/api/v1/duck-names"
    );
    for (let i = 0; i < data.length; i++) {
      const duck = data[i];

      const name = getDuckName(duck.duckName, dict);
      const wavesAmount = duck.amount / decimals;
      const usdAmount = (wavesAmount * rate).toFixed(2);
      let duckNumber = "-";
      let duckCacheId = "";
      try {
        const { data: numberRawData } = await axios.get(
          ` https://wavesducks.com/api/v0/achievements?ids=${duck.NFT}`
        );
        const start = new Date().getTime();
        const {
          data: { cacheId },
        } = await axios.get(
          `https://wavesducks.com/api/v1/preview/preload/duck/${duck.NFT}`
        );
        console.log(
          `⏰ preload time for cacheId ${cacheId} and NFT ${duck.NFT} is ${
            (new Date().getTime() - start) / 1000
          } sec`
        );
        duckCacheId = cacheId;
        duckNumber =
          numberRawData[duck.NFT].n != null ? numberRawData[duck.NFT].n : "-";
      } catch (e) {}
      if (wavesAmount < 1000 / rate) continue;
      const link = `https://wavesducks.com/duck/${duck.NFT}?cacheId=${duckCacheId}`;

      const ruMsg = `Утка ${name} (#${duckNumber}) была приобретена за ${wavesAmount} Waves ($${usdAmount} USD) \n\n${link}`;
      const enMsg = `Duck ${name} (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD) \n\n${link}`;
      const twitterMsg = `Duck ${name} (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD) \n#WavesDucks #nftgaming\n\n${link}`;

      await sendChanelMessage(process.env.RU_GROUP_ID, ruMsg);
      await sendChanelMessage(process.env.EN_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.ES_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.AR_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.PER_GROUP_ID, enMsg);

      // const twitterErr = await new Promise((r) =>
      //   twitter.post("statuses/update", { status: twitterMsg }, (err) => r(err))
      // );
      // if (twitterErr) {
      //   console.log(twitterErr);
      // }
      await sleep(1000);
    }
  }, 60 * 1000);
})();

// node api https://nodes.wavesexplorer.com/api-docs
// data services https://api.wavesplatform.com/v0/docs/#/
// dapp ui https://waves-dapp.com/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG
// ide https://waves-ide.com/
// explorer https://wavesexplorer.com/address/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG/script

//to get all duck for owner on auction
//https://nodes.wavesnodes.com/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG?matches=^address_3PFuiqdoNKcqXpWTQR1ga9EJNmt92dic72X_auction_(.*)_lockedNFT$
// (async () => {
//   setInterval(async () => {
//     const users = await DuckUser.find({ walletAddress: { $ne: null } }).exec();
//
//     await Promise.all(
//       Array.from(users, async ({ walletAddress }) => {
//         const ducksOnSale = await axios.get(
//           `https://nodes.wavesnodes.com/addresses/data/${auctionDappAddress}?matches=^address_${walletAddress}_auction_(.*)_lockedNFT$`
//         );
//         const ducksOnFarming = axios.get(
//           `https://nodes.wavesnodes.com/addresses/data/${farmingDappAddress}?matches=^address_${user.walletAddress}_asset(.*)_farmingPower$`
//         );
//       })
//     );
//
//     users.forEach((user) => {
//       if (user.walletAddress == null) return;
//       //todo duck on sale
//       axios.get(
//         `https://nodes.wavesnodes.com/addresses/data/${auctionDappAddress}?matches=^address_${user.walletAddress}_auction_(.*)_lockedNFT$`
//       );
//       //todo duck on farming
//       axios.get(
//         `https://nodes.wavesnodes.com/addresses/data/${farmingDappAddress}?matches=^address_${user.walletAddress}_asset(.*)_farmingPower$`
//       );
//
//       //todo получть список nft и отфильтровтаь уток
//       // https://nodes.wavesexplorer.com/assets/nft/<ADDRESS>/limit/1000FeedbackFormModal
//
//       //todo по каждой утке чекать и обнавлять данные
//       // базавая инва о утке https://wavesducks.wavesnodes.com/assets/details/D6qV2EN5ktciye7icSUxHJnvCMH1VBdPhczhPz69LvPs
//       // биды тянем из дапа https://wavesducks.wavesnodes.com/addresses/data/3PEBtiSVLrqyYxGd76vXKu8FFWWsD1c5uYG/auction_D6qV2EN5ktciye7icSUxHJnvCMH1VBdPhczhPz69LvPs_last
//       // - изменение бидов (изменение наивысшей ставки на утку) - тянем из ноды
//       // - изменение рарити утки / изменение доходности утки - тянем из даксэксплорера
//       // - момент продажи утки - тоже
//
//       //todo если хоть одно из данных меняется, то кидать сообщеньку
//     });
//   }, 60 * 1000);
// })();

(async () => {
  setInterval(async () => {
    const users = await DuckUser.find({
      walletAddress: { $ne: null },
    }).exec();

    for (let index in users) {
      let message = ``;
      const user = users[index];
      const {
        farmingDucks: lastFarmingDucks,
        auctionDucks: lastAuctionDucks,
        userDucks: lastUserDucks,
      } = user;
      const { farmingDucks, auctionDucks, userDucks } = await updateDuckForUser(
        user.walletAddress
      );
      await user.update({ userDucks, farmingDucks, auctionDucks }).exec();
      //fixme farming
      if (lastFarmingDucks != null) {
        message += compareFarmingDucks(lastFarmingDucks, farmingDucks);
      }
      //fixme bids
      if (auctionDucks != null) {
        message += compareBidDucks(lastAuctionDucks, auctionDucks);
      }

      //fixme rarity
      message += compareRarityOfDucks(
        [].concat(lastFarmingDucks, lastAuctionDucks, lastUserDucks),
        [].concat(farmingDucks, auctionDucks, userDucks)
      );

      message != "" && (await telegram.sendMessage(user.id, message));
      await sleep(1000);
    }
  }, 30 * 1000);
})();

process.stdout.write("Bot has been started ✅ ");
