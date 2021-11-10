import telegramService from "../services/telegramService";
import { TUserDocument } from "../models/user";
import langs from "../messages_lib";
import { getTxLink } from "../utils";

const { telegram: bot } = telegramService;

const sendSuccessWithdrawMsg = async (
  user: TUserDocument,
  transactionId: string
) => {
  const lng = langs[user.lang];
  await bot
    .sendMessage(user.id, lng.message.successWithdraw, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: lng.button.checkTransaction,
              url: getTxLink(transactionId),
            },
          ],
        ],
      },
    })
    .catch(() => console.log(`❗️cannot send message to ${user.id}`));
};
export default sendSuccessWithdrawMsg;
