import telegramService from "../services/telegramService";
import { createInlineButton, randomInteger } from "../utils";
import { keys } from "../index";
import langs from "../messages_lib";

const { telegram: bot } = telegramService;

const sendCaptcha = async (userId: number, match: string | null) => {
  const first = randomInteger(1, 100);
  const second = randomInteger(1, 100);
  const keyboardValues = Array.from(
    { length: 5 },
    () => randomInteger(1, 100) + randomInteger(1, 100)
  );
  keyboardValues[randomInteger(0, 4)] = first + second;
  const buttons = keyboardValues.map((value) =>
    createInlineButton(String(value), keys.captcha, {
      valid: value === first + second,
      match,
    })
  );

  const message = langs.ENG.message.captcha.replace(
    "{{captcha}}",
    `${first} + ${second}`
  );

  await bot
    .sendMessage(userId, message, {
      reply_markup: { inline_keyboard: [buttons] },
    })
    .catch(() => console.log(`❗️cannot send message to ${userId}`));
};
export default sendCaptcha;
