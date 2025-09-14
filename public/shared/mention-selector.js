import { authToken } from "../timeline/js/auth.js";

export function createMentionSelector(textarea) {
	let currentSuggestions = [];
	let selectedIndex = -1;
	let mentionStart = -1;
	let mentionEnd = -1;
	let suggestionContainer = null;

	const showSuggestions = async (query) => {
		if (query.length === 0) {
			hideSuggestions();
			return;
		}

		try {
			const { users, error } = await (
				await fetch(`/api/profile/search?q=${encodeURIComponent(query)}`, {
					headers: { Authorization: `Bearer ${authToken}` },
				})
			).json();

			if (error) {
				console.error("Error searching users:", error);
				hideSuggestions();
				return;
			}

			currentSuggestions = users || [];
			selectedIndex = -1;

			if (currentSuggestions.length === 0) {
				hideSuggestions();
				return;
			}

			if (!suggestionContainer) {
				suggestionContainer = document.createElement("div");
				suggestionContainer.className = "mention-suggestions";
				document.body.appendChild(suggestionContainer);
			}

			suggestionContainer.innerHTML = users
				.map(
					(user, index) => `
					<div class="mention-suggestion ${index === selectedIndex ? "selected" : ""}" data-index="${index}">
						<img src="${user.avatar || "/api/avatars/default.png"}" alt="${user.name}" class="mention-avatar">
						<div class="mention-info">
							<div class="mention-name">${escapeHtml(user.name)}</div>
							<div class="mention-username">@${escapeHtml(user.username)}</div>
						</div>
					</div>
				`,
				)
				.join("");

			// Position suggestions below textarea
			positionSuggestions();

			// Add click handlers
			suggestionContainer.addEventListener("click", handleSuggestionClick);
		} catch (error) {
			console.error("Error fetching user suggestions:", error);
		}
	};

	const positionSuggestions = () => {
		if (!suggestionContainer) return;

		const textareaRect = textarea.getBoundingClientRect();
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		suggestionContainer.style.position = "absolute";
		suggestionContainer.style.top = `${textareaRect.bottom + scrollTop + 4}px`;
		suggestionContainer.style.left = `${textareaRect.left}px`;
		suggestionContainer.style.minWidth = `${Math.min(textareaRect.width, 300)}px`;
		suggestionContainer.style.maxWidth = "400px";
	};

	const hideSuggestions = () => {
		if (suggestionContainer) {
			suggestionContainer.remove();
			suggestionContainer = null;
		}
		currentSuggestions = [];
		selectedIndex = -1;
		mentionStart = -1;
		mentionEnd = -1;
	};

	const selectSuggestion = (index) => {
		if (index < 0 || index >= currentSuggestions.length) return;

		const user = currentSuggestions[index];
		const beforeMention = textarea.value.substring(0, mentionStart);
		const afterMention = textarea.value.substring(mentionEnd);
		const newValue = `${beforeMention}@${user.username} ${afterMention}`;

		textarea.value = newValue;

		// Position cursor after the mention
		const newCursorPos = mentionStart + user.username.length + 2;
		textarea.setSelectionRange(newCursorPos, newCursorPos);

		// Trigger input event to update character count
		textarea.dispatchEvent(new Event("input", { bubbles: true }));

		hideSuggestions();
		textarea.focus();
	};

	const handleSuggestionClick = (e) => {
		const suggestionEl = e.target.closest(".mention-suggestion");
		if (suggestionEl) {
			const index = parseInt(suggestionEl.dataset.index);
			selectSuggestion(index);
		}
	};

	const updateSelection = (newIndex) => {
		if (newIndex < -1 || newIndex >= currentSuggestions.length) return;

		selectedIndex = newIndex;

		if (suggestionContainer) {
			const suggestions = suggestionContainer.querySelectorAll(
				".mention-suggestion",
			);
			suggestions.forEach((el, index) => {
				el.classList.toggle("selected", index === selectedIndex);
			});
		}
	};

	const handleKeyDown = (e) => {
		if (!suggestionContainer || currentSuggestions.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				updateSelection(selectedIndex + 1);
				break;
			case "ArrowUp":
				e.preventDefault();
				updateSelection(selectedIndex - 1);
				break;
			case "Enter":
			case "Tab":
				e.preventDefault();
				if (selectedIndex >= 0) {
					selectSuggestion(selectedIndex);
				} else if (currentSuggestions.length > 0) {
					selectSuggestion(0);
				}
				break;
			case "Escape":
				hideSuggestions();
				break;
		}
	};

	const handleInput = () => {
		const cursorPos = textarea.selectionStart;
		const text = textarea.value;

		// Find @ symbol before cursor
		let atPos = -1;
		for (let i = cursorPos - 1; i >= 0; i--) {
			if (text[i] === "@") {
				// Check if @ is at start or preceded by whitespace
				if (i === 0 || /\s/.test(text[i - 1])) {
					atPos = i;
					break;
				}
			} else if (/\s/.test(text[i])) {
				break;
			}
		}

		if (atPos >= 0) {
			// Find end of mention (space or end of text)
			let endPos = cursorPos;
			for (let i = cursorPos; i < text.length; i++) {
				if (/\s/.test(text[i])) {
					endPos = i;
					break;
				}
			}

			const mention = text.substring(atPos + 1, endPos);

			// Only show suggestions if cursor is within the mention
			if (cursorPos >= atPos + 1 && cursorPos <= endPos) {
				mentionStart = atPos;
				mentionEnd = endPos;
				showSuggestions(mention);
				return;
			}
		}

		hideSuggestions();
	};

	// Attach event listeners
	textarea.addEventListener("input", handleInput);
	textarea.addEventListener("keydown", handleKeyDown);

	// Hide suggestions when clicking outside
	document.addEventListener("click", (e) => {
		if (!suggestionContainer?.contains(e.target) && e.target !== textarea) {
			hideSuggestions();
		}
	});

	// Cleanup function
	return {
		destroy: () => {
			textarea.removeEventListener("input", handleInput);
			textarea.removeEventListener("keydown", handleKeyDown);
			hideSuggestions();
		},
	};
}

function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

export default createMentionSelector;
