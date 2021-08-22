import * as TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import * as Twit from "twit";
import * as commitCount from "git-commit-count";
import watcherService from "./services/watcherService";
import { getDuckName } from "./utils";
import { getAnalytics, getCurrentWavesRate } from "./services/dataService";
const cron = require("node-cron");

require("dotenv").config();

const telegram = new TelegramBot(process.env.TOKEN, { polling: true });

const twitter = new Twit({
  consumer_key: "kjzrtE8Wl5Q4yiR9AOgRYsBda",
  consumer_secret: "Lrzc2iLzc2G8XXMldwNXe0NScCBWqjtrhiqrQTtty8wFGnVu7R",
  access_token: "1411844553351467008-DoA7Icg0ohPc15mKWRGR545FJFM3mc",
  access_token_secret: "AoBwxMaiTPt0GDuthAz3zuJLimK6SHUJQlzACQllwib1k",
});

telegram.onText(/\/start/, async ({ chat: { id } }) => {
  await telegram.sendMessage(
    id,
    "*Welcome to the Waves Ducks family!* \n" +
      "\n" +
      "[Waves Ducks](https://wavesducks.com/) is a game centered on collectable digital duck images, developed for active members of the Waves ecosystem. In this game, users acquire and collect digital images of ducks, which we call Waves Ducks\n" +
      "\n" +
      "To get daily game stats please click here 👉🏻 /stats !",
    { parse_mode: "Markdown" }
  );
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
    const res = await telegram.sendMessage(
      id,
      "Loading data from the blockchain – may take some time"
    );
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
          `
    https://wavesducks.com/api/v0/achievements?ids=${duck.NFT}`
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

      await sendChanelMessage(process.env.RU_GROUP_ID, ruMsg);
      await sendChanelMessage(process.env.EN_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.ES_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.AR_GROUP_ID, enMsg);
      await sendChanelMessage(process.env.PER_GROUP_ID, enMsg);

      const twitterErr = await new Promise((r) =>
        twitter.post("statuses/update", { status: twitterMsg }, (err) => r(err))
      );
      if (twitterErr) {
        console.log(twitterErr);
      }
      await sleep(1000);
    }
  }, 60 * 1000);
})();

process.stdout.write("Bot has been started ✅ ");
