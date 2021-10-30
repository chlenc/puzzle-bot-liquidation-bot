import { ITelegramUser, IUserParams, User } from "../models/user";
import { langs } from "../messages_lib";

export const getUserById = async (id: number) => {
  const users = await User.find({ id: { $eq: id } }).exec();
  if (users.length == 0 || (users[0] && users[0].id !== id)) return null;
  return users[0];
};

export const getUserLanguageById = async (id: number) => {
  const user = await getUserById(id);
  return langs[user.lang];
};

// export const createUser = async (from: ITelegramUser) => {
//   return await User.create({ ...from });
// };

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

export const getMyRefsCount = async (userId: number) => {
  const users = await User.find({ ref: userId });
  return users.length;
};

export const getMyRefsList = async (userId: number) => {
  const users = await User.find({ ref: userId });
  return users.reduce((acc, { username, first_name, last_name, id }, index) => {
    const name =
      username != null
        ? `@${username}`
        : `${first_name || ""} ${last_name || ""}`;
    return `${acc}\n${+index + 1} - <a href="tg://user?id=${id}">${name}</a>`;
  }, "");
};
