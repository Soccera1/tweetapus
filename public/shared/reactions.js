// Removed emoji reactions, Easter eggs, and achievement celebrations

export const randomReaction = () => {
  const reactions = [
    "❤️",
    "😂",
    "😍",
    "🔥",
    "👍",
    "🎉",
    "💯",
    "⭐",
    "🚀",
    "🎊",
    "✨",
    "💪",
    "👏",
    "🎈",
    "🌟",
    "💖",
    "🦄",
    "🌈",
    "⚡",
    "💝",
  ];
  return reactions[Math.floor(Math.random() * reactions.length)];
};

export const triggerReactionBurst = (element, emoji = null, count = 8) => {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const angle = (Math.PI * 2 * i) / count;
      const distance = 50 + Math.random() * 50;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      createReaction(emoji || randomReaction(), x, y);
    }, i * 50);
  }
};

export const enableReactionOnDoubleClick = () => {
  let lastClickTime = 0;
  let lastClickTarget = null;

  document.addEventListener("click", (e) => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;

    if (timeDiff < 300 && lastClickTarget === e.target) {
      const x = e.clientX;
      const y = e.clientY;

      createReaction(randomReaction(), x, y);

      lastClickTime = 0;
      lastClickTarget = null;
    } else {
      lastClickTime = now;
      lastClickTarget = e.target;
    }
  });
};

export const createEmojiRain = (emoji = "🎉", duration = 3000) => {
  const interval = setInterval(() => {
    const x = Math.random() * window.innerWidth;
    createReaction(emoji, x, 0);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
  }, duration);
};

export const celebrateAchievement = (achievementText) => {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
    animation: fade-in 0.3s ease-out;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    background: var(--bg-primary);
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    max-width: 400px;
    animation: scale-in 0.5s ease-out;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  card.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
    <h2 style="margin: 0 0 10px 0; color: var(--text-primary);">Achievement Unlocked!</h2>
    <p style="margin: 0; color: var(--text-secondary); font-size: 18px;">${achievementText}</p>
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scale-in {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  createEmojiRain("🎊", 2000);

  setTimeout(() => {
    overlay.style.animation = "fade-in 0.3s ease-out reverse";
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }, 3000);

  overlay.addEventListener("click", () => {
    overlay.remove();
  });
};

export const createReaction = (emoji, x, y) => {
  const el = document.createElement("div");
  el.className = "floating-reaction";
  el.textContent = emoji;
  el.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      transform: translate(-50%, -50%) scale(1);
      pointer-events: none;
      z-index: 99999;
      font-size: 20px;
      opacity: 1;
      transition: transform 700ms cubic-bezier(.2,.9,.2,1), opacity 700ms ease-out;
    `;

  document.body.appendChild(el);

  requestAnimationFrame(() => {
    const dx = -10 + Math.random() * 20;
    const dy = -70 - Math.random() * 40;
    const scale = 0.9 + Math.random() * 0.6;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    el.style.opacity = "0";
  });

  setTimeout(() => {
    try {
      el.remove();
    } catch (_) {}
  }, 800);
};
