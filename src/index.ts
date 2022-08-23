import telegramService from "./services/telegramService";
import {
  createUser,
  getUserById,
  updateUserActivityInfo,
} from "./controllers/userController";
import { initMongo } from "./services/mongo";
import sendWelcomeMsg from "./messages/sendWelcomeMsg";
import {
  buttons,
  inlineKeyboardKeys,
  keyboards,
  userStates,
} from "./constants";
import sendAddTokenMsg from "./messages/sendAddTokenMsg";
import { sendUpdates, updateDb } from "./crons";
import { Asset } from "./models/asset";
import sendAddPercentMsg from "./messages/sendAddPercentMsg";
import { createInlineButton, sleep } from "./utils/utils";
import { User } from "./models/user";

const { telegram: bot } = telegramService;
initMongo().then();

bot.on("message", async (msg) => {
  const user = await getUserById(msg.from.id);
  if (/\/start[ \t]*(.*)/.test(msg.text)) return;
  if (user == null) {
    await bot
      .sendMessage(msg.from.id, "👇🏻 Please, press here 👇🏻\\n/start")
      .catch(() => console.log(`❗️cannot send message to ${msg.from.id}`));
    return;
  }

  if (user.state != null) {
    switch (user.state.key) {
      case userStates.addToken:
        const asset = await Asset.findOne({
          $or: [
            { id: { $regex: `^${msg.text}$`, $options: "i" } },
            { shortcode: { $regex: `^${msg.text}$`, $options: "i" } },
            { name: { $regex: `^${msg.text}$`, $options: "i" } },
          ],
        }).exec();
        if (asset == null) {
          await bot.sendMessage(
            msg.from.id,
            `Cannot find asset "${msg.text}"\nPlease check our token list [here](https://app.lineup.finance/#/tokens)`,
            { parse_mode: "Markdown" }
          );
          await sendAddTokenMsg(user);
        } else {
          await user.update({
            state: { key: userStates.addPercent, data: { assetId: asset.id } },
          });
          await sendAddPercentMsg(user, asset);
        }
        return;
    }
  }

  switch (msg.text) {
    case buttons.welcome.addToken.text:
      await sendAddTokenMsg(user);
      await user.update({ state: { key: userStates.addToken, data: {} } });
      break;

    case buttons.welcome.contactUs.text:
      await bot.sendMessage(
        msg.from.id,
        "Telegram: https://t.me/lineupFinance\nSite: https://lineup.finance\nTwitter: soon\nChannnel: soon",
        { disable_web_page_preview: true }
      );
      break;

    case buttons.welcome.editTokens.text:
      const assets = await Asset.find({}).exec();
      const inline_keyboard = user.assets.map(({ assetId }) => {
        const asset = assets.find(({ id }) => id === assetId);
        return asset != null
          ? [
              createInlineButton(
                `Remove ${asset.shortcode}`,
                inlineKeyboardKeys.removeAsset,
                { symbol: asset.shortcode }
              ),
            ]
          : [];
      });
      await bot.sendMessage(msg.from.id, "Your assets", {
        reply_markup: { inline_keyboard: [...inline_keyboard] },
      });
      break;

    default:
      await user.update({ state: undefined });
  }
  await updateUserActivityInfo(user);
});
//Sorry, I don't understand. Please call /menu

bot.on("callback_query", async ({ from, message, data: raw }) => {
  try {
    const { key, data } = JSON.parse(raw);

    //Trying to find user
    const user = await getUserById(from.id);
    if (user == null) {
      await bot
        .sendMessage(message.from.id, "👇🏻 Please, press here 👇🏻\\n/start")
        .catch(() => console.log(`❗️cannot send message to ${from.id}`));
      return;
    }
    switch (key) {
      case inlineKeyboardKeys.addTokenCancel:
        await user.update({ state: undefined });
        await bot.deleteMessage(message.chat.id, String(message.message_id));
        // await user.updateOne({ state: keys.enterAddress }).exec();
        // await sendTranslatedMessage(user, "enterWalletAddress");
        break;
      case inlineKeyboardKeys.removeAsset:
        const a = await Asset.findOne({ shortcode: data.symbol }).exec();
        if (a == null) return;
        const i = user.assets.findIndex(({ assetId }) => assetId === a.id);
        if (i === -1) return;
        const assets = user.assets;
        assets.splice(i, 1);
        await user.update({ assets }).exec();
        await bot.deleteMessage(message.chat.id, String(message.message_id));
        await bot.sendMessage(
          message.chat.id,
          `${a.shortcode} was removed from list`,
          { reply_markup: { keyboard: keyboards.welcome } }
        );
        // await user.updateOne({ state: keys.enterAddress }).exec();
        // await sendTranslatedMessage(user, "enterWalletAddress");
        break;
      case inlineKeyboardKeys.addPercent:
        const userAssets = user.assets == null ? [] : user.assets;
        const asset = await Asset.findOne({
          id: user.state.data.assetId,
        }).exec();
        const index = user.assets.findIndex(
          ({ assetId }) => assetId === user.state.data.assetId
        );
        if (index !== -1) userAssets.splice(index, 1);
        userAssets.push({
          assetId: user.state.data.assetId,
          percent: data.percent,
          lastPrice: asset.data["lastPrice_usd-n"],
        });
        await user.update({
          state: undefined,
          assets: userAssets,
        });
        await bot.sendMessage(
          message.chat.id,
          `Coin ${asset.shortcode} was added!`,
          { reply_markup: { keyboard: keyboards.welcome } }
        );
        await bot.deleteMessage(message.chat.id, String(message.message_id));
        break;
    }
  } catch (e) {}
});

//COMMANDS
bot.onText(/\/start[ \t]*(.*)/, async ({ chat, from }, match) => {
  let user = await getUserById(from.id);
  if (user == null) {
    user = await createUser(from, match ? String(match[1]) : null);
  }
  await updateUserActivityInfo(user);
  await sendWelcomeMsg(user);
});

(async () => {
  while (true) {
    await updateDb();
    await sendUpdates(bot);
    await sleep(60 * 1000);
  }
})();

process.stdout.write("Bot has been started ✅ ");
