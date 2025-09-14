export const authToken = localStorage.getItem("authToken");

let _user;

(async () => {
	if (!authToken) {
		cookieStore.delete("agree");
		window.location.href = "/";
		return;
	}

	const response = await fetch("/api/auth/me", {
		headers: { Authorization: `Bearer ${authToken}` },
	});

	const { user, error } = await response.json();

	if (error || !user) {
		localStorage.removeItem("authToken");
		window.location.href = "/";
		return;
	}
	_user = user;
	document.querySelector(".account img").src =
		user.avatar || `https://unavatar.io/${user.username}`;
	document.querySelector("#compose-avatar").src =
		user.avatar || `https://unavatar.io/${user.username}`;
	document.querySelector(".account").addEventListener("click", (e) => {
		// Allow right-click or ctrl+click to go to account settings
		if (e.metaKey || e.ctrlKey || e.button === 2) {
			window.location.href = `/account`;
		} else {
			// Default click goes to user's profile
			import("./profile.js").then(({ default: openProfile }) => {
				openProfile(user.username);
			});
		}
	});

	document.querySelector(".loader").style.opacity = "0";
	setTimeout(() => {
		document.querySelector(".loader").style.display = "none";
	}, 150);
})();

export default function getUser() {
	return new Promise((resolve) => {
		if (_user) resolve(_user);

		const interval = setInterval(() => {
			if (!_user) return;
			resolve(_user);
			clearInterval(interval);
		}, 1);
	});
}
