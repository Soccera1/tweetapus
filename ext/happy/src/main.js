(() => {
	const moods = ["radiant", "calm", "sparkly", "brave", "zen", "buoyant"];
	const seeds = [
		"Community uptime held steady all week.",
		"Reports cleared before lunch every day.",
		"New creators praised the welcoming vibe.",
	];

	const createNavLink = () => {
		const link = document.createElement("a");
		link.className = "nav-link";
		link.href = "#";
		link.dataset.section = "happies";
		link.title = "Secret Happies";
		const icon = document.createElement("i");
		icon.className = "bi bi-emoji-smile";
		link.appendChild(icon);
		link.appendChild(document.createTextNode(" Happies"));
		return link;
	};

	const createHappiesSection = () => {
		const section = document.createElement("div");
		section.id = "happies-section";
		section.className = "section d-none";

		const header = document.createElement("div");
		header.className = "d-flex align-items-center justify-content-between mb-3";
		section.appendChild(header);

		const headingWrap = document.createElement("div");
		header.appendChild(headingWrap);

		const title = document.createElement("h4");
		title.className = "mb-1";
		title.textContent = "Happies";
		headingWrap.appendChild(title);

		const subtitle = document.createElement("p");
		subtitle.className = "text-muted mb-0";
		subtitle.textContent = "Private gratitude feed for admins.";
		headingWrap.appendChild(subtitle);

		const addBtn = document.createElement("button");
		addBtn.type = "button";
		addBtn.className = "btn btn-success";
		addBtn.textContent = "Add Happy";
		header.appendChild(addBtn);

		const emptyState = document.createElement("div");
		emptyState.id = "happiesEmpty";
		emptyState.className = "alert alert-info d-none";
		emptyState.textContent = "No happies yet. Share the first one.";
		section.appendChild(emptyState);

		const addForm = document.createElement("div");
		addForm.className =
			"card bg-dark text-light border border-success mb-3 d-none";
		addForm.innerHTML = `
			<div class="card-body">
				<label class="form-label fw-bold">Share a happy thought</label>
				<textarea class="form-control mb-3" rows="3" placeholder="What made you smile today?"></textarea>
				<div class="d-flex justify-content-end gap-2">
					<button type="button" data-action="cancel" class="btn btn-outline-secondary btn-sm">Cancel</button>
					<button type="button" data-action="confirm" class="btn btn-success btn-sm">Add it</button>
				</div>
			</div>
		`;
		section.appendChild(addForm);

		const list = document.createElement("div");
		list.id = "happiesList";
		list.className = "row g-3";
		section.appendChild(list);

		return { section, addBtn, emptyState, list, addForm };
	};

	const wireInteractions = ({
		navLink,
		section,
		addBtn,
		emptyState,
		list,
		addForm,
	}) => {
		const formatter = new Intl.DateTimeFormat(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
		const happies = [];
		const addFormTextarea = addForm.querySelector("textarea");
		const confirmButton = addForm.querySelector("[data-action=confirm]");
		const cancelButton = addForm.querySelector("[data-action=cancel]");

		const render = () => {
			list.textContent = "";
			if (!happies.length) {
				emptyState.classList.remove("d-none");
				return;
			}
			emptyState.classList.add("d-none");
			happies.forEach((entry) => {
				const column = document.createElement("div");
				column.className = "col-md-6";
				const card = document.createElement("div");
				card.className = "card bg-dark border border-success h-100 shadow-sm";
				const cardBody = document.createElement("div");
				cardBody.className = "card-body d-flex flex-column";
				const badgeRow = document.createElement("div");
				badgeRow.className = "d-flex justify-content-between mb-2";
				const moodBadge = document.createElement("span");
				moodBadge.className = "badge bg-success";
				moodBadge.textContent = `${entry.score} happies`;
				const toneBadge = document.createElement("span");
				toneBadge.className = "badge bg-secondary text-uppercase";
				toneBadge.textContent = entry.mood;
				badgeRow.appendChild(moodBadge);
				badgeRow.appendChild(toneBadge);
				const message = document.createElement("p");
				message.className = "mb-2 fs-5";
				message.textContent = entry.text;
				const meta = document.createElement("small");
				meta.className = "text-muted";
				meta.textContent = `${entry.source} • ${formatter.format(entry.timestamp)}`;
				cardBody.appendChild(badgeRow);
				cardBody.appendChild(message);
				cardBody.appendChild(meta);
				card.appendChild(cardBody);
				column.appendChild(card);
				list.appendChild(column);
			});
		};

		const addHappy = (payload) => {
			if (!payload || !payload.text) return;
			happies.unshift({
				id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
				text: payload.text.trim(),
				mood: payload.mood || moods[Math.floor(Math.random() * moods.length)],
				score: payload.score || Math.floor(40 + Math.random() * 60),
				timestamp: payload.timestamp || new Date(),
				source: payload.source || "System",
			});
			if (happies.length > 8) {
				happies.pop();
			}
			render();
		};

		const revealSection = (event) => {
			event.preventDefault();
			document
				.querySelectorAll(".section")
				.forEach((node) => node.classList.add("d-none"));
			section.classList.remove("d-none");
			render();
			hideAddForm();
		};

		const showAddForm = () => {
			addForm.classList.remove("d-none");
			if (addFormTextarea) {
				addFormTextarea.value = "";
				addFormTextarea.focus();
			}
		};

		const hideAddForm = () => {
			addForm.classList.add("d-none");
			if (addFormTextarea) {
				addFormTextarea.value = "";
			}
		};

		const confirmAdd = () => {
			const text = addFormTextarea?.value.trim();
			if (!text) {
				addFormTextarea?.focus();
				return;
			}
			hideAddForm();
			addHappy({ text, source: "You" });
		};

		navLink.addEventListener("click", revealSection);
		addBtn.addEventListener("click", () => {
			showAddForm();
		});

		if (confirmButton) {
			confirmButton.addEventListener("click", confirmAdd);
		}
		if (cancelButton) {
			cancelButton.addEventListener("click", hideAddForm);
		}
		if (addFormTextarea) {
			addFormTextarea.addEventListener("keydown", (event) => {
				if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
					event.preventDefault();
					confirmAdd();
				}
			});
		}

		seeds.forEach((seed, index) => {
			addHappy({
				text: seed,
				source: index === 0 ? "Ops" : index === 1 ? "Safety" : "Creators",
				timestamp: new Date(Date.now() - (index + 1) * 3600 * 1000),
			});
		});
	};

	const boot = () => {
		const navHost = document.querySelector(".sidebar nav");
		const contentHost = document.querySelector(".col-lg-10 .p-4");
		if (!navHost || !contentHost) return false;
		if (document.getElementById("happies-section")) return true;
		const { section, addBtn, emptyState, list, addForm } =
			createHappiesSection();
		contentHost.appendChild(section);
		const navLink = createNavLink();
		navHost.appendChild(navLink);
		wireInteractions({ navLink, section, addBtn, emptyState, list, addForm });
		return true;
	};

	const init = () => {
		if (boot()) return;
		let retries = 0;
		const interval = setInterval(() => {
			retries += 1;
			if (boot() || retries > 40) {
				clearInterval(interval);
			}
		}, 250);
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init, { once: true });
	} else {
		init();
	}
})();
