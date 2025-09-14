import toastQueue from "../../shared/toasts.js";
import { authToken } from "./auth.js";
import { createComposer } from "./composer.js";
import showPage, { addRoute } from "./pages.js";
import { addTweetToTimeline } from "./tweets.js";
import "./profile.js"; // Import to register profile routes
import "./notifications.js"; // Import to initialize notifications

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

	let currentTimeline = "home"; // 'home' or 'following'

	const loadTimeline = async (type = "home") => {
		const endpoint =
			type === "following" ? "/api/timeline/following" : "/api/timeline/";

		try {
			const { timeline } = await (
				await fetch(endpoint, {
					headers: { Authorization: `Bearer ${authToken}` },
				})
			).json();

			document.querySelector(".tweets").innerHTML = "";

			if (timeline.length === 0 && type === "following") {
				const emptyMessage = document.createElement("div");
				emptyMessage.className = "empty-timeline";
				emptyMessage.innerHTML = `
					<h3>Welcome to your Following timeline!</h3>
					<p>Follow some accounts to see their tweets here.</p>
				`;
				document.querySelector(".tweets").appendChild(emptyMessage);
			} else {
				timeline.forEach((tweet) => {
					addTweetToTimeline(tweet, false);
				});
			}
		} catch (error) {
			console.error("Error loading timeline:", error);
			toastQueue.add(`<h1>Error loading timeline</h1><p>Please try again</p>`);
		}
	};

	// Add click handlers to timeline navigation
	const feedLinks = document.querySelectorAll("h1 a");
	feedLinks.forEach((link, index) => {
		link.addEventListener("click", async (e) => {
			e.preventDefault();

			// Remove active class from all links
			feedLinks.forEach((l) => l.classList.remove("active"));
			// Add active class to clicked link
			link.classList.add("active");

			const timelineType = index === 0 ? "home" : "following";
			currentTimeline = timelineType;
			await loadTimeline(timelineType);
		});
	});

	// Load initial timeline
	await loadTimeline("home");

	// Create and add the composer
	const composer = await createComposer({
		callback: (tweet) => {
			// Only add to timeline if we're on home feed or it's the user's own tweet
			if (currentTimeline === "home") {
				addTweetToTimeline(tweet, true).classList.add("created");
			}
		},
	});

	document.querySelector("#composer-container").appendChild(composer);
})();

addRoute(
	(pathname) => pathname === "/",
	() => showPage("timeline"),
);
