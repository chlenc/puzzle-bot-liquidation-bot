import telegramService from "./services/telegramService";
import {createUser, getUserById, updateUserActivityInfo,} from "./controllers/userController";
import {initMongo} from "./services/mongo";
import sendWelcomeMsg from "./messages/sendWelcomeMsg";

const { telegram: bot } = telegramService;
initMongo().then();

const parse_mode = "Markdown";

bot.on("message", async (msg) => {
  const user = await getUserById(msg.from.id);
  if (/\/start[ \t]*(.*)/.test(msg.text)) return;
  if (user == null) {
    await bot
      .sendMessage(msg.from.id, "👇🏻 Please, press here 👇🏻\\n/start")
      .catch(() => console.log(`❗️cannot send message to ${msg.from.id}`));

    return;
  }
  switch (msg.text) {

  }
  await updateUserActivityInfo(user);
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

bot.on("callback_query", async ({ from, message, data: raw }) => {
});

process.stdout.write("Bot has been started ✅ ");
