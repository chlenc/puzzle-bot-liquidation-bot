import { ITelegramUser, IUserParams, User } from "../models/user";

export const getUserById = async (id: number) => {
  const users = await User.find({ id: { $eq: id } }).exec();
  if (users.length == 0 || users[0].id !== id) return null;
  return users[0];
};

export const updateUserActivityInfo = async (from: ITelegramUser) => {
  let user = await getUserById(from.id);
  if (user == null) {
    user = await User.create({ ...from });
    user == null &&
      (await User.create({
        ...from,
        messagesNumber: 1,
        lastActivityDate: new Date(),
      }));
  } else {
    await User.findByIdAndUpdate(user._id, {
      messagesNumber: user.messagesNumber + 1,
      lastActivityDate: new Date(),
    });
  }
};

export const findByTelegramIdAndUpdate = async (
  telegramId: number,
  updateDetails: IUserParams
) => {
  let user = await getUserById(telegramId);
  await User.findByIdAndUpdate(user._id, {
    ...updateDetails,
    messagesNumber: user.messagesNumber + 1,
    lastActivityDate: new Date(),
  });
};
