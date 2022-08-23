import axios from "axios";
import { Asset } from "./models/asset";
import { User } from "./models/user";
import BN from "./utils/BN";
import TelegramBot from "node-telegram-bot-api";
export const updateDb = async () => {
  const { data } = await axios.get("https://wavescap.com/api/assets.json");
  await Asset.remove();
  await Asset.insertMany(data);
};

export const sendUpdates = async (bot: TelegramBot) => {
  const users = await User.find({}).exec();
  const stats = await Asset.find({}).exec();
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const assets = user.assets;
    const msg = assets.reduce((acc, asset) => {
      const statistic = stats.find(({ id }) => id === asset.assetId);
      if (statistic == null || statistic.data == null) {
        return acc;
      }
      const currentPrice = new BN(statistic.data["lastPrice_usd-n"]);
      const change = currentPrice.div(asset.lastPrice).minus(1).times(100);
      const mod = change.gte(0) ? change : change.times(-1);
      if (mod.gte(asset.percent)) {
        acc += `${change.gte(0) ? "🟢" : "🔴"} ${
          statistic.shortcode
        } price changed ${change.toFormat(
          2
        )}%! Current price $${currentPrice.toFormat(2)}\n\n`;
      }
      return acc;
    }, "");
    if (msg !== "") {
      await bot
        .sendMessage(user.id, msg)
        .catch(() => `Cannot send message to ${user.id}`);
    }
  }
};
