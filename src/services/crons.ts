import { User } from "../models/user";
import {
  compareBidDucks,
  compareFarmingDucks,
  compareRarityOfDucks,
  getCurrentWavesRate,
  updateDuckForUser,
} from "./statsService";
import axios from "axios";
import telegramService from "./telegramService";
import { getDuckName, sleep } from "../utils";
import watcherService from "./watcherService";
import twitterService from "./twitterService";

const decimals = 1e8;

export const watchOnDucks = async () => {
  const users = await User.find({
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

    const { data: dict } = await axios.get(
      "https://wavesducks.com/api/v1/duck-names"
    );

    await user.update({ userDucks, farmingDucks, auctionDucks }).exec();

    //fixme farming
    if (lastFarmingDucks != null) {
      message += compareFarmingDucks(lastFarmingDucks, farmingDucks, dict);
    }

    //fixme bids
    if (auctionDucks != null) {
      message += compareBidDucks(lastAuctionDucks, auctionDucks, dict);
    }

    //fixme rarity
    message += compareRarityOfDucks(
      [].concat(lastFarmingDucks, lastAuctionDucks, lastUserDucks),
      [].concat(farmingDucks, auctionDucks, userDucks),
      dict
    );

    message != "" &&
      (await telegramService.telegram.sendMessage(user.id, message));

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

    const ruMsg = `Утка [${name}](${link}) (#${duckNumber}) была приобретена за ${wavesAmount} Waves ($${usdAmount} USD)`;
    const enMsg = `Duck [${name}](${link}) (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD)`;
    const twitterMsg = `Duck ${name} (#${duckNumber}) was purchased for ${wavesAmount} Waves ($${usdAmount} USD) \n#WavesDucks #nftgaming\n\n${link}`;

    // await sendChanelMessageWithDelay(process.env.RU_GROUP_ID, ruMsg);
    // await sendChanelMessageWithDelay(process.env.EN_GROUP_ID, enMsg);
    // await sendChanelMessageWithDelay(process.env.ES_GROUP_ID, enMsg);
    // await sendChanelMessageWithDelay(process.env.AR_GROUP_ID, enMsg);
    // await sendChanelMessageWithDelay(process.env.PER_GROUP_ID, enMsg);

    await twitterService.postTwit(twitterMsg);
    await sleep(1000);
  }
};
