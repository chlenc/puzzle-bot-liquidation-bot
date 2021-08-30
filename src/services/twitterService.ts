import * as Twit from "twit";

require("dotenv").config();

class TwitterService {
  twitter: Twit;

  constructor() {
    try {
      this.twitter = new Twit({
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN_KEY,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET,
      });
    } catch (e) {
      console.log(e);
    }
  }

  postTwit = async (msg: string) => {
    try {
      const twitterErr = await new Promise((r) =>
        this.twitter.post("statuses/update", { status: msg }, (err) => r(err))
      );
      if (twitterErr) {
        console.log(twitterErr);
      }
    } catch (e) {
      console.log(`❌ failed to post to the twitter ${e}`);
    }
  };
}

export default new TwitterService();
