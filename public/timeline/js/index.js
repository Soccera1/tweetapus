/** biome-ignore-all lint/suspicious/noDocumentCookie: not available on older browsers */

import confetti from "../../shared/confetti.js";
import toastQueue from "../../shared/toasts.js";
import { addTweetToTimeline } from "./tweets.js";
import { authToken } from "./auth.js";

window.onerror = (message, source, lineno, colno) => {
	toastQueue.add(
		`<h1>${message}</h1><p>at ${lineno || "?"}:${colno || "?"} in ${source || "?"}</p>`,
	);

	return false;
};

window.onunhandledrejection = (event) => {
	const reason = event.reason;

	if (reason instanceof Error) {
		toastQueue.add(
			`<h1>${reason.message}</h1><p>at ${reason.lineNumber || "?"}:${reason.columnNumber || "?"} in ${reason.fileName || "?"}</p>`,
		);
	} else {
		toastQueue.add(`<h1>${String(reason)}</h1><p>Error</p>`);
	}
};

(async () => {
	if (!authToken) return;

	const { timeline } = await (
		await fetch("/api/timeline/", {
			headers: { Authorization: `Bearer ${authToken}` },
		})
	).json();

	document.querySelector(".tweets").innerText = "";

	document.querySelector(".loader").style.opacity = "0";
	setTimeout(() => {
		document.querySelector(".loader").style.display = "none";
	}, 150);

	timeline.forEach((tweet) => {
		addTweetToTimeline(tweet, false);
	});
})();

(() => {
	const textarea = document.getElementById("tweet-textarea");
	const charCount = document.getElementById("char-count");
	const tweetButton = document.getElementById("tweet-button");

	textarea.addEventListener("input", () => {
		const length = textarea.value.length;
		charCount.textContent = length;

		if (length > 400) {
			charCount.parentElement.id = "over-limit";
			tweetButton.disabled = true;
		} else {
			charCount.parentElement.id = "";
			tweetButton.disabled = length === 0;
		}
	});

	textarea.addEventListener("input", () => {
		textarea.style.height = `${Math.max(textarea.scrollHeight, 25)}px`;

		if (textarea.scrollHeight < 250) {
			textarea.style.overflow = "hidden";
		} else {
			textarea.style.overflow = "auto";
		}
	});

	tweetButton.addEventListener("click", async () => {
		const content = textarea.value.trim();

		if (!content || content.length > 400) {
			toastQueue.add({
				message: "Please enter a valid tweet (1-400 characters)",
				type: "error",
			});
			return;
		}

		tweetButton.disabled = true;

		try {
			const { error, tweet } = await (
				await fetch("/api/tweets/", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${authToken}`,
					},
					body: JSON.stringify({
						content,
						source: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
							? "mobile_web"
							: "desktop_web",
					}),
				})
			).json();

			if (tweet) {
				textarea.value = "";
				charCount.textContent = "0";
				textarea.style.height = "25px";

				const el = addTweetToTimeline(tweet, true);
				el.classList.add("created");

				confetti(tweetButton, {
					count: 40,
					fade: true,
				});

				toastQueue.add(`<h1>Tweet posted successfully!</h1>`);
			} else {
				toastQueue.add(`<h1>${error || "Failed to post tweet"}</h1>`);
			}
		} catch {
			toastQueue.add(`<h1>Network error. Please try again.</h1>`);
		} finally {
			tweetButton.disabled = false;
		}
	});

	textarea.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
			e.preventDefault();
			if (!tweetButton.disabled) {
				tweetButton.click();
			}
		}
	});
})();
