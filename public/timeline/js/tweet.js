import { createTweetElement } from "./tweets.js";
import switchPage from "./pages.js";

export default async function openTweet(tweet) {
	if (!tweet?.author)
		throw new Error("non-preloaded tweets arent supported yet");

	const page = switchPage("tweet");

	const tweetEl = createTweetElement(tweet);
	page.appendChild(tweetEl);
}

// STOP FOLLOWING ME.
