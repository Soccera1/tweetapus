async function createEmojiPicker() {
  if (!customElements.get("emoji-picker")) {
    await import("https://unpkg.com/emoji-picker-element");
  }

  const picker = document.createElement("emoji-picker");
  return picker;
}

export async function showEmojiPickerPopup(onEmojiSelect, position = {}) {
  const picker = await createEmojiPicker(onEmojiSelect);
  picker.className = "emoji-picker emoji-picker-popup";

  document
    .querySelectorAll("emoji-picker")
    .forEach((pickerEl) => pickerEl.remove());
  document.body.appendChild(picker);

  const rect = picker.getBoundingClientRect();
  let x = position.x ?? window.innerWidth / 2 - rect.width / 2;
  let y = position.y ?? window.innerHeight / 2 - rect.height / 2;

  if (x + rect.width > window.innerWidth)
    x = window.innerWidth - rect.width - 10;
  if (y + rect.height > window.innerHeight)
    y = window.innerHeight - rect.height - 10;
  if (x < 10) x = 10;
  if (y < 10) y = 10;

  picker.style.position = "fixed";
  picker.style.left = `${x}px`;
  picker.style.top = `${y}px`;

  picker.addEventListener("emoji-click", (event) => {
    if (onEmojiSelect) {
      onEmojiSelect(event.detail.unicode);
    }
    picker.remove();
    document.removeEventListener("click", closeOnClickOutside);
  });

  const closeOnClickOutside = (e) => {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener("click", closeOnClickOutside);
    }
  };

  setTimeout(() => document.addEventListener("click", closeOnClickOutside), 10);

  return picker;
}
