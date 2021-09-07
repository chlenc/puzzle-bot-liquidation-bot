import { User } from "../models/user";
import {
  getCurrentWavesRate,
  getStatsInfoFromBlockchain,
} from "./statsService";
import axios from "axios";
import telegramService from "./telegramService";
import { getDuckName, sleep } from "../utils";
import watcherService from "./watcherService";
import { compareAllFields } from "./comparingService";
import { updateUserDetails } from "./updateService";
import {
  getStatisticFromDB,
  updateStats,
} from "../controllers/statsController";

const decimals = 1e8;

export const watchOnDucks = async () => {
  const users = await User.find({
    walletAddress: { $ne: null },
  }).exec();

  const { data: nameDictionary } = await axios.get(
    "https://wavesducks.com/api/v1/duck-names"
  );

  for (let index in users) {
    const user = users[index];
    const {
      farmingDucks: lastFarmingDucks,
      auctionDucks: lastAuctionDucks,
      userDucks: lastUserDucks,
      bids: lastBids,
    } = user;

    const { farmingDucks, auctionDucks, userDucks, bids } =
      await updateUserDetails(user.walletAddress);

    await user.update({ userDucks, farmingDucks, auctionDucks, bids }).exec();

    const message = compareAllFields(
      {
        farmingDucks,
        auctionDucks,
        userDucks,
        bids,
      },
      {
        lastFarmingDucks,
        lastAuctionDucks,
        lastUserDucks,
        lastBids,
      },
      nameDictionary
    );

    message != "" &&
      (await telegramService.telegram.sendMessage(user.id, message, {
        parse_mode: "Markdown",
      }));

    await sleep(1000);
  }
};

export const watchOnAuction = async () => {
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
        `https://wavesducks.com/api/v0/achievements?ids=${duck.NFT}`
      );
      const start = new Date().getTime();
      const {
        data: { cacheId },
      } = await axios.get(
        `https://wavesducks.com/api/v1/preview/preload/duck/${duck.NFT}?actionId=${duck.auctionId}`
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

    const ruMsg = `Утка [${name}](${link}) (#${duckNumber}) была приобретена за ${wavesAmount} Waves ($${usdAmount} USD)`;
    const enMsg = `Duck [${name}](${link}) (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD)`;
    const twitterMsg = `Duck ${name} (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD) \n#WavesDucks #nftgaming\n\n${link}`;

    const groups = [
      {
        groupId: process.env.RU_GROUP_ID,
        message: ruMsg,
      },
      {
        groupId: process.env.EN_GROUP_ID,
        message: enMsg,
      },
      {
        groupId: process.env.ES_GROUP_ID,
        message: enMsg,
      },
      {
        groupId: process.env.AR_GROUP_ID,
        message: enMsg,
      },
      {
        groupId: "383909141",
        // groupId: process.env.PER_GROUP_ID,
        message: enMsg,
      },
    ];

    for (let index in groups) {
      await telegramService.sendChanelMessageWithDelay(
        groups[index].groupId,
        groups[index].message
      );
    }

    // await twitterService.postTwit(twitterMsg);
    await sleep(1000);
  }
};

export const watchOnStats = async () => {
  await updateStats(await getStatsInfoFromBlockchain());
};

export const sendStatisticMessageToChannels = async () => {
  const msg = await getStatisticFromDB();
  await telegramService.sendChanelMessageWithDelay(
    process.env.RU_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.EN_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.ES_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.AR_GROUP_ID,
    msg
  );
  await telegramService.sendChanelMessageWithDelay(
    process.env.PER_GROUP_ID,
    msg
  );
};
