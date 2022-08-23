import {
  ITelegramUser,
  IUserParams,
  TUserDocument,
  User,
} from "../models/user";
import { Asset } from "../models/asset";
import { keyboards } from "../constants";

export const getUserById = async (id: number) => {
  const users = await User.find({ id: { $eq: id } }).exec();
  if (users.length == 0 || (users[0] && users[0].id !== id)) return null;
  return users[0];
};

export const createUser = async (from: ITelegramUser, match: string | null) => {
  const user = await User.create({ ...from });
  if (match && +match !== user.id) {
    const isRefLink = !isNaN(parseFloat(match));
    if (isRefLink) {
      await User.findByIdAndUpdate(user._id, { ref: +match }).exec();
    } else {
      await User.findByIdAndUpdate(user._id, {
        invitationChannel: match,
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

// export const setWalletAddress = async (
//   user: TUserDocument,
//   address: string
// ): Promise<boolean> => {
//   const isValidAddress = await checkWalletAddress(address)
//     .then((valid) => valid)
//     .catch(() => false);
//
//   const updateUserParams: Partial<TUserDocument> = { state: undefined };
//   if (isValidAddress) {
//     updateUserParams.walletAddress = address;
//   }
//
//   await user.updateOne(updateUserParams).exec();
//   return isValidAddress;
// };
