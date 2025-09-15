import toastQueue from "../../shared/toasts.js";
import { authToken, exitImpersonation } from "./auth.js";
import { createComposer } from "./composer.js";
import showPage, { addRoute } from "./pages.js";
import { addTweetToTimeline, createTweetElement } from "./tweets.js";
import "./profile.js";
import "./notifications.js";
import "./settings.js";

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

// Check if user is being impersonated and show banner
const checkImpersonation = async () => {
	if (!authToken) return;

	try {
		const response = await fetch("/api/auth/me", {
			headers: { Authorization: `Bearer ${authToken}` },
		});
		const { user } = await response.json();

		if (user && user.impersonation) {
			const banner = document.querySelector(".impersonation-banner");
			if (banner) {
				banner.style.display = "block";
				banner
					.querySelector(".btn")
					.addEventListener("click", exitImpersonation);
			}
		}
	} catch (error) {
		console.error("Error checking impersonation:", error);
	}
};

(async () => {
	if (!authToken) return;

	// Check for impersonation banner
	await checkImpersonation();

	let currentTimeline = "home";

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

	const feedLinks = document.querySelectorAll("h1 a");
	feedLinks.forEach((link, index) => {
		link.addEventListener("click", async (e) => {
			e.preventDefault();

			feedLinks.forEach((l) => l.classList.remove("active"));
			link.classList.add("active");

			const timelineType = index === 0 ? "home" : index === 1 ? "following" : "search";
			currentTimeline = timelineType;

			if (timelineType === "search") {
				document.querySelector(".search-container").style.display = "block";
				document.querySelector("#composer-container").style.display = "none";
				document.querySelector(".tweets").style.display = "none";
			} else {
				document.querySelector(".search-container").style.display = "none";
				document.querySelector("#composer-container").style.display = "block";
				document.querySelector(".tweets").style.display = "block";
				await loadTimeline(timelineType);
			}
		});
	});

	const searchInput = document.getElementById("searchInput");
	let searchTimeout;
	searchInput.addEventListener("input", () => {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			const q = searchInput.value.trim();
			if (!q) {
				document.querySelector(".users-results").innerHTML = "";
				document.querySelector(".posts-results").innerHTML = "";
				return;
			}
			try {
				const [usersRes, postsRes] = await Promise.all([
					fetch(`/api/search/users?q=${encodeURIComponent(q)}`, {
						headers: { Authorization: `Bearer ${authToken}` },
					}),
					fetch(`/api/search/posts?q=${encodeURIComponent(q)}`, {
						headers: { Authorization: `Bearer ${authToken}` },
					}),
				]);
				const { users } = await usersRes.json();
				const { posts } = await postsRes.json();
				document.querySelector(".users-results").innerHTML = users.map(user => `
					<a href="/@${user.username}" class="search-user">
						<img src="${user.avatar || '/default-avatar.png'}" alt="${user.name}">
						<div>
							<h4>${user.name}</h4>
							<p>@${user.username}</p>
						</div>
					</a>
				`).join("");
				document.querySelector(".posts-results").innerHTML = "";
				posts.forEach(post => {
					const tweetEl = createTweetElement(post, { clickToOpen: true, showTopReply: true });
					document.querySelector(".posts-results").appendChild(tweetEl);
				});
			} catch (error) {
				console.error("Search error:", error);
			}
		}, 300);
	});

	const handleUrlParams = () => {
		const urlParams = new URLSearchParams(window.location.search);
		const tweetId = urlParams.get("tweet");
		const profileUsername = urlParams.get("profile");

		if (tweetId) {
			window.history.replaceState(null, "", `/tweet/${tweetId}`);
			window.dispatchEvent(new PopStateEvent("popstate"));
		} else if (profileUsername) {
			window.history.replaceState(null, "", `/@${profileUsername}`);
			window.dispatchEvent(new PopStateEvent("popstate"));
		}
	};

	await loadTimeline("home");
	handleUrlParams();

	const composer = await createComposer({
		callback: (tweet) => {
			if (currentTimeline === "home") {
				addTweetToTimeline(tweet, true).classList.add("created");
			}
		},
	});

	document.querySelector("#composer-container").appendChild(composer);

	document
		.getElementById("notificationsBtn")
		?.addEventListener("click", async () => {
			const { openNotifications } = await import("./notifications.js");
			openNotifications();
		});
})();

addRoute(
	(pathname) => pathname === "/",
	() => showPage("timeline"),
);
