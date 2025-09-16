import toastQueue from "../../shared/toasts.js";
import { authToken } from "./auth.js";
import showPage, { addRoute } from "./pages.js";

let currentUser = null;

const settingsPages = [
	{
		key: "account",
		title: "Account",
		content: () => createAccountContent(),
	},
	{
		key: "themes",
		title: "Themes",
		content: () => createThemesContent(),
	},
	{
		key: "other",
		title: "Other",
		content: () => `
        <h1>Other Settings</h1>
        <p>Additional settings will be added here.</p>
        `,
	},
];

const createThemesContent = () => {
	return `
		<div class="settings-section">
			<h1>Themes</h1>
			<div class="setting-group">
				<h2>Appearance</h2>
				<div class="setting-item">
					<label class="setting-label">
						<span class="setting-title">Theme Mode</span>
						<span class="setting-description">Choose light or dark mode</span>
					</label>
					<div class="theme-mode-picker setting-control">
						<button class="theme-btn" data-theme="light">☀️ Light</button>
						<button class="theme-btn" data-theme="dark">🌙 Dark</button>
						<button class="theme-btn" data-theme="auto">🖥️ Auto</button>
					</div>
				</div>
				<div class="setting-item">
					<label class="setting-label">
						<span class="setting-title">Accent Color</span>
						<span class="setting-description">Customize the accent color</span>
					</label>
					<div class="accent-color-section setting-control">
						<div class="color-presets">
							<div class="color-option" data-color="#1185fe" style="background-color: #1185fe"></div>
							<div class="color-option" data-color="#dc2626" style="background-color: #dc2626"></div>
							<div class="color-option" data-color="#059669" style="background-color: #059669"></div>
							<div class="color-option" data-color="#7c3aed" style="background-color: #7c3aed"></div>
							<div class="color-option" data-color="#ea580c" style="background-color: #ea580c"></div>
							<div class="color-option" data-color="#0891b2" style="background-color: #0891b2"></div>
						</div>
						<input type="color" id="customColorPicker" class="custom-color-picker" title="Choose custom color">
					</div>
				</div>
			</div>
		</div>
	`;
};

const createAccountContent = () => {
	return `
		<div class="settings-section">
			<h1>Account Settings</h1>
			<div class="setting-group">
				<h2>Profile</h2>
				<div class="setting-item">
					<button class="btn secondary" id="changeUsernameBtn">
						Change Username
					</button>
				</div>
				<div class="setting-item">
					<button class="btn secondary" id="changePasswordBtn">
						Change Password
					</button>
				</div>
			</div>
			<div class="setting-group danger-group">
				<h2>Danger Zone</h2>
				<div class="setting-item">
					<button class="btn danger" id="deleteAccountBtn">
						Delete Account
					</button>
				</div>
			</div>
		</div>

		<!-- Change Username Modal -->
		<div id="changeUsernameModal" class="modal" style="display: none">
			<div class="modal-content">
				<div class="modal-header">
					<h2>Change Username</h2>
					<button class="close-btn" id="closeUsernameModal">&times;</button>
				</div>
				<div class="modal-body">
					<form id="changeUsernameForm">
						<div class="form-group">
							<label for="newUsername">New Username</label>
							<div class="username-wrapper">
								<span inert>@</span>
								<input
									type="text"
									id="newUsername"
									placeholder="new username"
									required
								/>
							</div>
							<small>
								Username must be 3-20 characters and contain only letters,
								numbers, and underscores.
							</small>
						</div>
						<div class="form-actions">
							<button
								type="button"
								class="btn secondary"
								id="cancelUsernameChange"
							>
								Cancel
							</button>
							<button type="submit" class="btn primary">Change Username</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<!-- Delete Account Modal -->
		<div id="deleteAccountModal" class="modal" style="display: none">
			<div class="modal-content">
				<div class="modal-header">
					<h2>Delete Account</h2>
					<button class="close-btn" id="closeDeleteModal">&times;</button>
				</div>
				<div class="modal-body">
					<p>
						<strong>Warning:</strong>
						This action cannot be undone. All your tweets, likes, follows, and
						account data will be permanently deleted.
					</p>
					<form id="deleteAccountForm">
						<div class="form-group">
							<label for="deleteConfirmation">
								Type "DELETE MY ACCOUNT" to confirm:
							</label>
							<input
								type="text"
								id="deleteConfirmation"
								placeholder="DELETE MY ACCOUNT"
								required
							/>
						</div>
						<div class="form-actions">
							<button
								type="button"
								class="btn secondary"
								id="cancelAccountDelete"
							>
								Cancel
							</button>
							<button type="submit" class="btn danger">Delete Account</button>
						</div>
					</form>
				</div>
			</div>
		</div>

		<!-- Change Password Modal -->
		<div id="changePasswordModal" class="modal" style="display: none">
			<div class="modal-content">
				<div class="modal-header">
					<h2>Change Password</h2>
					<button class="close-btn" id="closePasswordModal">&times;</button>
				</div>
				<div class="modal-body">
					<p id="passwordModalDescription">
						Set a password for your account to enable traditional
						username/password login.
					</p>
					<form id="changePasswordForm">
						<div
							class="form-group"
							id="currentPasswordGroup"
							style="display: none"
						>
							<label for="current-password">Current Password</label>
							<input
								type="password"
								id="current-password"
								placeholder="enter your current password"
								required
							/>
						</div>
						<div class="form-group">
							<label for="new-password">New Password</label>
							<input
								type="password"
								id="new-password"
								placeholder="enter your new password"
								minlength="8"
								required
							/>
							<small>Password must be at least 8 characters long.</small>
						</div>
						<div class="form-actions">
							<button
								type="button"
								class="btn secondary"
								id="cancelPasswordChange"
							>
								Cancel
							</button>
							<button
								type="submit"
								class="btn primary"
								id="changePasswordSubmit"
							>
								Set Password
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	`;
};

const createSettingsPage = () => {
	const settingsContainer = document.createElement("div");
	settingsContainer.className = "settings";
	settingsContainer.style.display = "none";

	const sidebarButtons = settingsPages
		.map(
			(page) =>
				`<button class="settings-tab-btn${page.key === "account" ? " active" : ""}" data-tab="${page.key}">${page.title}</button>`,
		)
		.join("");

	settingsContainer.innerHTML = `
		<div class="settings-header">
			<a href="/" class="back-button">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
					<path d="m12 19-7-7 7-7"/>
					<path d="M19 12H5"/>
				</svg>
			</a>
			<div class="settings-header-info">
				<h1>Settings</h1>
			</div>
		</div>

		<div class="settings-body">
			<div class="settings-sidebar">
				${sidebarButtons}
			</div>
			<div class="settings-content" id="settings-content"></div>
		</div>
	`;

	const style = document.createElement("style");
	style.textContent = `
		.settings {
			flex-direction: column;
			min-height: 100vh;
		}

		.settings-header {
			display: flex;
			align-items: center;
			padding: 20px 0;
			border-bottom: 1px solid var(--border-primary);
			margin-bottom: 20px;
		}

		.back-button {
			background: none;
			border: none;
			color: var(--text-primary);
			cursor: pointer;
			padding: 8px;
			margin-right: 20px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background-color 0.2s;
			text-decoration: none;
		}

		.back-button:hover {
			background-color: var(--bg-overlay-light);
		}

		.settings-header-info h1 {
			margin: 0;
			font-size: 24px;
			font-weight: 700;
			color: var(--text-primary);
		}

		.settings-body {
			display: flex;
			gap: 20px;
			flex: 1;
		}

		.settings-sidebar {
			background-color: var(--bg-secondary);
			border-radius: 8px;
			padding: 8px;
			width: 200px;
			height: fit-content;
		}

		.settings-tab-btn {
			width: 100%;
			background: transparent;
			border: none;
			color: var(--text-primary);
			text-align: left;
			padding: 12px 16px;
			font-size: 16px;
			cursor: pointer;
			border-radius: 6px;
			margin-bottom: 4px;
			font-family: inherit;
			font-weight: 400;
			transition: background-color 0.2s;
		}

		.settings-tab-btn:hover {
			background-color: var(--bg-overlay-light);
		}

		.settings-tab-btn.active {
			background-color: var(--primary);
			color: white;
			font-weight: 500;
		}

		.settings-content {
			background-color: var(--bg-secondary);
			border-radius: 8px;
			padding: 24px;
			flex: 1;
		}

		.settings-section h1 {
			margin: 0 0 24px 0;
			font-size: 24px;
			font-weight: 700;
			color: var(--text-primary);
		}

		.setting-group {
			margin-bottom: 32px;
		}

		.setting-group h2 {
			margin: 0 0 16px 0;
			font-size: 18px;
			font-weight: 600;
			color: var(--text-primary);
		}

		.setting-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 0;
			border-bottom: 1px solid var(--border-primary);
		}

		.setting-item:last-child {
			border-bottom: none;
		}

		.setting-label {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.setting-title {
			font-size: 16px;
			font-weight: 500;
			color: var(--text-primary);
		}

		.setting-description {
			font-size: 14px;
			color: var(--text-secondary);
		}

		.setting-control {
			flex-shrink: 0;
		}

		.theme-mode-picker {
			display: flex;
			gap: 8px;
			background: var(--bg-primary);
			border: 1px solid var(--border-primary);
			border-radius: 8px;
			padding: 4px;
		}

		.theme-btn {
			padding: 8px 12px;
			border: none;
			background: transparent;
			color: var(--text-secondary);
			border-radius: 6px;
			cursor: pointer;
			font-size: 14px;
			transition: all 0.2s;
		}

		.theme-btn:hover {
			background: var(--bg-overlay-light);
			color: var(--text-primary);
		}

		.theme-btn.active {
			background: var(--primary);
			color: white;
		}

		.accent-color-section {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.color-presets {
			display: flex;
			gap: 8px;
			align-items: center;
		}

		.accent-color-picker {
			display: flex;
			gap: 8px;
			align-items: center;
		}

		.color-option {
			width: 32px;
			height: 32px;
			border-radius: 50%;
			cursor: pointer;
			border: 2px solid var(--border-primary);
			transition: all 0.2s;
			position: relative;
		}

		.color-option:hover {
			transform: scale(1.1);
			border-color: var(--border-hover);
		}

		.color-option.active {
			border-color: var(--text-primary);
			transform: scale(1.1);
		}

		.color-option.active::after {
			content: '✓';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: white;
			font-size: 14px;
			font-weight: bold;
			text-shadow: 0 0 2px rgba(0,0,0,0.8);
		}

		.custom-color-picker {
			width: 32px;
			height: 32px;
			border: 2px solid var(--border-primary);
			border-radius: 50%;
			cursor: pointer;
			padding: 0;
			background: none;
			transition: all 0.2s;
		}

		.custom-color-picker:hover {
			transform: scale(1.1);
			border-color: var(--border-hover);
		}

		.danger-group {
			border: 1px solid var(--error-color);
			border-radius: 8px;
			padding: 16px;
			background-color: rgba(220, 38, 38, 0.05);
		}

		.danger-group h2 {
			color: var(--error-color);
		}

		.modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--bg-overlay);
			z-index: 1000;
			align-items: center;
			justify-content: center;
		}

		.modal-content {
			background: var(--bg-primary);
			border-radius: 12px;
			width: 90%;
			max-width: 500px;
			max-height: 90vh;
			overflow-y: auto;
			box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		}

		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20px 24px 0 24px;
			border-bottom: 1px solid var(--border-primary);
			margin-bottom: 20px;
		}

		.modal-header h2 {
			margin: 0;
			font-size: 20px;
			font-weight: 600;
			color: var(--text-primary);
		}

		.close-btn {
			background: none;
			border: none;
			font-size: 24px;
			cursor: pointer;
			color: var(--text-secondary);
			padding: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			transition: background-color 0.2s;
		}

		.close-btn:hover {
			background-color: var(--bg-overlay-light);
		}

		.modal-body {
			padding: 0 24px 24px 24px;
		}

		.form-group {
			margin-bottom: 20px;
		}

		.form-group label {
			display: block;
			margin-bottom: 8px;
			font-weight: 500;
			color: var(--text-primary);
		}

		.form-group input {
			width: 100%;
			padding: 12px;
			border: 1px solid var(--border-input);
			border-radius: 8px;
			font-size: 16px;
			background: var(--bg-primary);
			color: var(--text-primary);
			transition: border-color 0.2s;
			box-sizing: border-box;
		}

		.form-group input:focus {
			outline: none;
			border-color: var(--primary);
		}

		.form-group small {
			display: block;
			margin-top: 4px;
			color: var(--text-secondary);
			font-size: 14px;
		}

		.username-wrapper {
			display: flex;
			align-items: center;
			border: 1px solid var(--border-input);
			border-radius: 8px;
			overflow: hidden;
		}

		.username-wrapper span {
			padding: 12px 8px 12px 12px;
			background: var(--bg-secondary);
			color: var(--text-secondary);
			font-size: 16px;
		}

		.username-wrapper input {
			border: none;
			flex: 1;
		}

		.form-actions {
			display: flex;
			gap: 12px;
			justify-content: flex-end;
			margin-top: 24px;
		}

		.btn {
			padding: 10px 20px;
			border-radius: 8px;
			font-size: 16px;
			font-weight: 500;
			cursor: pointer;
			border: 1px solid transparent;
			transition: all 0.2s;
		}

		.btn.primary {
			background: var(--primary);
			color: white;
		}

		.btn.primary:hover {
			background: var(--primary-hover);
		}

		.btn.secondary {
			background: transparent;
			color: var(--btn-secondary-color);
			border-color: var(--btn-secondary-border);
		}

		.btn.secondary:hover {
			background: var(--btn-secondary-hover-bg);
			border-color: var(--btn-secondary-hover-border);
		}

		.btn.danger {
			background: var(--error-color);
			color: white;
		}

		.btn.danger:hover {
			background: #b91c1c;
		}

		@media (max-width: 768px) {
			.settings-body {
				flex-direction: column;
			}

			.settings-sidebar {
				width: 100%;
				display: flex;
				overflow-x: auto;
				gap: 8px;
			}

			.settings-tab-btn {
				white-space: nowrap;
				margin-bottom: 0;
			}

			.setting-item {
				flex-direction: column;
				align-items: stretch;
				gap: 12px;
			}

			.accent-color-picker {
				justify-content: center;
			}
		}
	`;

	document.head.appendChild(style);
	document.body.appendChild(settingsContainer);

	return settingsContainer;
};

let settingsPage;

const initializeSettings = () => {
	if (!settingsPage) {
		settingsPage = createSettingsPage();
	}

	const contentArea = settingsPage.querySelector("#settings-content");
	const tabButtons = settingsPage.querySelectorAll(".settings-tab-btn");

	const switchTab = (tabKey) => {
		const page = settingsPages.find((p) => p.key === tabKey);
		if (!page) {
			window.location.href = "/settings/account";
			return;
		}

		tabButtons.forEach((btn) => {
			if (btn.dataset.tab === tabKey) {
				btn.classList.add("active");
			} else {
				btn.classList.remove("active");
			}
		});

		contentArea.innerHTML = page.content();

		const newPath = `/settings/${tabKey}`;
		if (window.location.pathname !== newPath) {
			window.history.pushState(null, null, newPath);
		}
	};

	tabButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			switchTab(btn.dataset.tab);
		});
	});

	const backButton = settingsPage.querySelector(".back-button");
	backButton.addEventListener("click", () => {
		window.location.href = "/";
	});

	const pathParts = window.location.pathname.split("/");
	let initialTab = pathParts[2];
	if (!initialTab || !settingsPages.find((p) => p.key === initialTab)) {
		initialTab = "account";
		window.history.replaceState(null, null, "/settings/account");
	}
	switchTab(initialTab);

	setupSettingsEventHandlers();
};

const setupSettingsEventHandlers = async () => {
	if (!authToken) return;

	try {
		const response = await fetch("/api/auth/me", {
			headers: { Authorization: `Bearer ${authToken}` },
		});
		const data = await response.json();
		if (data.user) {
			currentUser = data.user;
		}
	} catch (error) {
		console.error("Failed to fetch user data:", error);
	}

	document.addEventListener("click", (event) => {
		const target = event.target;

		if (target.closest(".color-option")) {
			handleAccentColorChange(target.closest(".color-option"));
		}

		if (target.classList.contains("theme-btn")) {
			handleThemeModeChange(target.dataset.theme);
		}

		if (target.id === "changeUsernameBtn") {
			showModal(document.getElementById("changeUsernameModal"));
			if (currentUser?.username) {
				document.getElementById("newUsername").value = currentUser.username;
			}
		}

		if (target.id === "changePasswordBtn") {
			const modal = document.getElementById("changePasswordModal");
			const hasPassword = currentUser?.password_hash !== null;

			modal.querySelector("h2").textContent = hasPassword
				? "Change Password"
				: "Set Password";
			modal.querySelector("button[type='submit']").textContent = hasPassword
				? "Change Password"
				: "Set Password";

			const currentPasswordGroup = document.getElementById(
				"currentPasswordGroup",
			);
			currentPasswordGroup.style.display = hasPassword ? "block" : "none";

			document.getElementById("changePasswordForm").reset();
			showModal(modal);
		}

		if (target.id === "deleteAccountBtn") {
			showModal(document.getElementById("deleteAccountModal"));
		}

		if (
			target.classList.contains("close-btn") ||
			target.id.includes("cancel") ||
			target.id.includes("close")
		) {
			const modal = target.closest(".modal");
			if (modal) hideModal(modal);
		}
	});

	document.addEventListener("submit", (event) => {
		const form = event.target;

		if (form.id === "changeUsernameForm") {
			event.preventDefault();
			handleUsernameChange();
		}

		if (form.id === "changePasswordForm") {
			event.preventDefault();
			handlePasswordChange();
		}

		if (form.id === "deleteAccountForm") {
			event.preventDefault();
			handleAccountDeletion();
		}
	});

	document.addEventListener("input", (event) => {
		if (event.target.id === "newUsername") {
			event.target.value = event.target.value
				.toLowerCase()
				.replace(/[^a-z0-9_]/g, "");
		}
	});

	document.addEventListener("click", (event) => {
		if (event.target.closest(".modal") === event.target) {
			hideModal(event.target);
		}
	});

	loadCurrentAccentColor();
};

const handleAccentColorChange = (colorOption) => {
	const color = colorOption.dataset.color;
	const root = document.documentElement;

	root.style.setProperty("--primary", color);

	const rgb = hexToRgb(color);
	if (rgb) {
		root.style.setProperty("--primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
	}

	const hoverColor = adjustBrightness(color, -10);
	const focusColor = adjustBrightness(color, -20);

	root.style.setProperty("--primary-hover", hoverColor);
	root.style.setProperty("--primary-focus", focusColor);

	localStorage.setItem("accentColor", color);

	document.querySelectorAll(".color-option").forEach((option) => {
		option.classList.remove("active");
	});
	colorOption.classList.add("active");

	toastQueue.add(
		`<h1>Accent Color Changed</h1><p>Your new accent color has been applied</p>`,
	);
};

const loadCurrentAccentColor = () => {
	const savedColor = localStorage.getItem("accentColor") || "#1185fe";
	const colorOption = document.querySelector(`[data-color="${savedColor}"]`);
	if (colorOption) {
		colorOption.classList.add("active");
	}

	const root = document.documentElement;
	root.style.setProperty("--primary", savedColor);

	const rgb = hexToRgb(savedColor);
	if (rgb) {
		root.style.setProperty("--primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
	}

	const hoverColor = adjustBrightness(savedColor, -10);
	const focusColor = adjustBrightness(savedColor, -20);

	root.style.setProperty("--primary-hover", hoverColor);
	root.style.setProperty("--primary-focus", focusColor);
};

const hexToRgb = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
};

const adjustBrightness = (hex, percent) => {
	const rgb = hexToRgb(hex);
	if (!rgb) return hex;

	const adjust = (color) => {
		const newColor = Math.round(color + (color * percent) / 100);
		return Math.max(0, Math.min(255, newColor));
	};

	const r = adjust(rgb.r).toString(16).padStart(2, "0");
	const g = adjust(rgb.g).toString(16).padStart(2, "0");
	const b = adjust(rgb.b).toString(16).padStart(2, "0");

	return `#${r}${g}${b}`;
};

const showModal = (modal) => {
	modal.style.display = "flex";
};

const hideModal = (modal) => {
	modal.style.display = "none";
};

const handleUsernameChange = async () => {
	const newUsername = document.getElementById("newUsername").value.trim();

	if (!newUsername || newUsername.length < 3 || newUsername.length > 20) {
		toastQueue.add(
			`<h1>Invalid Username</h1><p>Username must be between 3 and 20 characters</p>`,
		);
		return;
	}

	if (newUsername === currentUser?.username) {
		toastQueue.add(
			`<h1>No Change</h1><p>Please enter a different username</p>`,
		);
		return;
	}

	try {
		const response = await fetch(
			`/api/profile/${currentUser.username}/username`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({ newUsername }),
			},
		);

		const data = await response.json();

		if (data.error) {
			toastQueue.add(`<h1>Username Change Failed</h1><p>${data.error}</p>`);
			return;
		}

		if (data.success) {
			currentUser.username = data.username;

			if (data.token) {
				localStorage.setItem("authToken", data.token);
			}

			hideModal(document.getElementById("changeUsernameModal"));
			toastQueue.add(
				`<h1>Username Changed!</h1><p>Your username is now @${data.username}</p>`,
			);
		}
	} catch {
		toastQueue.add(
			`<h1>Username Change Failed</h1><p>Unable to connect to server</p>`,
		);
	}
};

const handlePasswordChange = async () => {
	const hasPassword = currentUser?.password_hash !== null;
	const currentPassword = document.getElementById("current-password")?.value;
	const newPassword = document.getElementById("new-password").value;

	if (!newPassword || newPassword.length < 8) {
		toastQueue.add(
			`<h1>Invalid Password</h1><p>Password must be at least 8 characters long</p>`,
		);
		return;
	}

	if (hasPassword && !currentPassword) {
		toastQueue.add(
			`<h1>Current Password Required</h1><p>Please enter your current password</p>`,
		);
		return;
	}

	try {
		const response = await fetch(
			`/api/profile/${currentUser.username}/password`,
			{
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					currentPassword: hasPassword ? currentPassword : undefined,
					newPassword,
				}),
			},
		);

		const data = await response.json();

		if (data.error) {
			toastQueue.add(`<h1>Password Change Failed</h1><p>${data.error}</p>`);
			return;
		}

		if (data.success) {
			currentUser.password_hash = true;
			hideModal(document.getElementById("changePasswordModal"));
			toastQueue.add(
				`<h1>Password ${hasPassword ? "Changed" : "Set"}!</h1><p>Your password has been ${hasPassword ? "updated" : "set"} successfully</p>`,
			);
		}
	} catch {
		toastQueue.add(
			`<h1>Password Change Failed</h1><p>Unable to connect to server</p>`,
		);
	}
};

const handleAccountDeletion = async () => {
	const confirmationText = document.getElementById("deleteConfirmation").value;

	if (confirmationText !== "DELETE MY ACCOUNT") {
		toastQueue.add(
			`<h1>Confirmation Required</h1><p>Please type "DELETE MY ACCOUNT" exactly as shown</p>`,
		);
		return;
	}

	try {
		const response = await fetch(`/api/profile/${currentUser.username}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({ confirmationText }),
		});

		const data = await response.json();

		if (data.error) {
			toastQueue.add(`<h1>Account Deletion Failed</h1><p>${data.error}</p>`);
			return;
		}

		if (data.success) {
			hideModal(document.getElementById("deleteAccountModal"));
			toastQueue.add(
				`<h1>Account Deleted</h1><p>Your account has been permanently deleted</p>`,
			);

			setTimeout(() => {
				localStorage.removeItem("authToken");
				window.location.href = "/account";
			}, 2000);
		}
	} catch {
		toastQueue.add(
			`<h1>Account Deletion Failed</h1><p>Unable to connect to server</p>`,
		);
	}
};

export const openSettings = (section = "account") => {
	const page = showPage("settings", {
		path: `/settings/${section}`,
		recoverState: () => initializeSettings(),
	});

	if (!page) {
		initializeSettings();
		showPage("settings", { path: `/settings/${section}` });
	}

	return settingsPage;
};

addRoute(
	(pathname) => pathname.startsWith("/settings"),
	(pathname) => {
		const pathParts = pathname.split("/");
		const section = pathParts[2] || "account";
		const validSection = settingsPages.find((p) => p.key === section);
		openSettings(validSection ? section : "account");
	},
);
