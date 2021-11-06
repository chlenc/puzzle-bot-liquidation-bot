import { ITelegramUser, TUserDocument, User } from "../models/user";
import { checkWalletAddress } from "../services/statsService";
import BigNumber from "bignumber.js";
import { buildHtmlUserLink } from "../utils";

export const getUserById = async (id: number) => {
  const users = await User.find({ id: { $eq: id } }).exec();
  if (users.length == 0 || (users[0] && users[0].id !== id)) return null;
  return users[0];
};

export const createUser = async (
  from: ITelegramUser,
  match?: RegExpExecArray
) => {
  const user = await User.create({ ...from });
  if (match[1] && +match[1] !== user.id) {
    const utmText = match[1];
    const isRefLink = !isNaN(parseFloat(utmText));
    if (isRefLink) {
      await User.findByIdAndUpdate(user._id, { ref: +utmText }).exec();
      const invitor = await getUserById(+utmText);
      const balance = new BigNumber(invitor.balance)
        .plus(process.env.EGG_AMOUNT)
        .toString();
      await invitor.updateOne({ balance }).exec();
    } else {
      await User.findByIdAndUpdate(user._id, {
        invitationChannel: utmText,
      }).exec();
    }
  }
  return user;
};

export const updateUserActivityInfo = async (user: TUserDocument) =>
  User.findByIdAndUpdate(user._id, {
    messagesNumber: (user.messagesNumber != null ? user.messagesNumber : 0) + 1,
    lastActivityDate: new Date(),
  }).exec();

export const getMyRefsCount = async (userId: number) => {
  const users = await User.find({ ref: userId });
  return users.length;
};

export const setWalletAddress = async (
  user: TUserDocument,
  address: string
): Promise<boolean> => {
  const isValidAddress = await checkWalletAddress(address)
    .then((valid) => valid)
    .catch(() => false);

  const updateUserParams: Partial<TUserDocument> = { state: undefined };
  if (isValidAddress) {
    updateUserParams.walletAddress = address;
  }

  await user.updateOne(updateUserParams).exec();
  return isValidAddress;
};

export const getMyRefsList = async (userId: number) => {
  const users = await User.find({ ref: userId });
  return users.reduce(
    (acc, user, index) => `${acc}\n${+index + 1} - ${buildHtmlUserLink(user)}`,
    ""
  );
};
