import { createInlineButton } from "./utils/utils";

export const userStates = {
  addToken: "addToken",
  addPercent: "addPercent",
};

export const inlineKeyboardKeys = {
  addTokenCancel: "addTokenCancel",
  addPercent: "addPercent",
  removeAsset: "remove",
};

export const buttons = {
  welcome: {
    addToken: { text: "🪙 Add token" },
    editTokens: { text: "✏️ Edit tokens" },
    contactUs: { text: "✉️ Contact us" },
  },
  addToken: {
    percent1: createInlineButton("1%", inlineKeyboardKeys.addPercent, {
      percent: 1,
    }),
    percent3: createInlineButton("3%", inlineKeyboardKeys.addPercent, {
      percent: 3,
    }),
    percent5: createInlineButton("5%", inlineKeyboardKeys.addPercent, {
      percent: 5,
    }),
    percent7: createInlineButton("7%", inlineKeyboardKeys.addPercent, {
      percent: 7,
    }),
    percent10: createInlineButton("10%", inlineKeyboardKeys.addPercent, {
      percent: 10,
    }),
    percent15: createInlineButton("15%", inlineKeyboardKeys.addPercent, {
      percent: 15,
    }),
    cancel: createInlineButton("Cancel ❌", inlineKeyboardKeys.addTokenCancel),
  },
};
export const keyboards = {
  welcome: [
    [buttons.welcome.addToken, buttons.welcome.editTokens],
    [buttons.welcome.contactUs],
  ],
  addToken: { inline_keyboard: [[buttons.addToken.cancel]] },
  addPercent: {
    inline_keyboard: [
      [
        buttons.addToken.percent1,
        buttons.addToken.percent3,
        buttons.addToken.percent5,
      ],
      [
        buttons.addToken.percent7,
        buttons.addToken.percent10,
        buttons.addToken.percent15,
      ],
      [buttons.addToken.cancel],
    ],
  },
};
