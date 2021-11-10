import axios from "axios";
import { writeFileSync } from "fs";
const requestUrl =
  "https://opensheet.vercel.app/1XteieVkEyDS8xmA-BqWKaZUh4ib8ZU8kvWIwQnRMSRA/translates";
type TItemType = "message" | "button" | "link";
type TItem = {
  Type: TItemType;
  Key: string;
  ENG: string;
  RUS: string;
  SPA: string;
};

(async () => {
  const { data } = await axios.get<Array<TItem>>(requestUrl);

  const SPA = { message: {}, button: {}, link: {} };
  const RUS = { message: {}, button: {}, link: {} };
  const ENG = { message: {}, button: {}, link: {} };

  data.forEach((item) => {
    const type = item.Type;
    const key = item.Key;
    SPA[type][key] = item.SPA;
    ENG[type][key] = item.ENG;
    RUS[type][key] = item.RUS;
  });
  writeFileSync(
    "./src/localizations.json",
    JSON.stringify({ SPA, RUS, ENG }, null, 4)
  );
})();
