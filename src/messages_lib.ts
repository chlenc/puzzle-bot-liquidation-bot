type TLocalization = Record<
  "ENG" | "RUS" | "SPA",
  Record<"message" | "button" | "link", Record<string, string>>
>;

const langs: TLocalization = require("./localizations.json");

export default langs;
