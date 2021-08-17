// import axios from "axios";
// import * as crypto from "@waves/ts-lib-crypto";
//
const add = "3P6Ksahs71SiKQgQ4qaZuFAVhqncdi2nvJQ";
// const checkWalletAddress = async () => {
//   let res = null;
//   try {
//     const { data } = await axios.get(
//       `https://nodes.wavesexplorer.com/addresses/balance/${add}`
//     );
//     res = data;
//     console.log(res);
//   } catch (e) {
//     console.error(e);
//   }
//   return !!res;
// };
// checkWalletAddress().then((r) => console.log(r));

const re = new RegExp("^(3P)[A-Z0-9]{35}$");

console.log(re.test(add));
