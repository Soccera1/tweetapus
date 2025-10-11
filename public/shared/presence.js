import query from "../timeline/js/api.js";

let presenceUpdateInterval = null;
let ghostMode = false;

const detectDevice = () => {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
};

export const initializePresence = () => {
  const device = detectDevice();

  const updatePresence = async () => {
    try {
      await query("/presence/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          online: true,
          device,
        }),
      });
    } catch (error) {
      console.error("Failed to update presence:", error);
    }
  };

  updatePresence();

  presenceUpdateInterval = setInterval(updatePresence, 60000);

  window.addEventListener("beforeunload", async () => {
    if (presenceUpdateInterval) {
      clearInterval(presenceUpdateInterval);
    }

    try {
      await query("/presence/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          online: false,
          device,
        }),
      });
    } catch (error) {
      console.error("Failed to mark offline:", error);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(presenceUpdateInterval);
    } else {
      updatePresence();
      presenceUpdateInterval = setInterval(updatePresence, 60000);
    }
  });
};

export const toggleGhostMode = async (enabled) => {
  try {
    const result = await query("/presence/ghost-mode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    });

    if (result.success) {
      ghostMode = enabled;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to toggle ghost mode:", error);
    return false;
  }
};

export const getPresence = async (userId) => {
  try {
    const result = await query(`/presence/${userId}`);
    return result.presence;
  } catch (error) {
    console.error("Failed to get presence:", error);
    return null;
  }
};

export const getBatchPresence = async (userIds) => {
  try {
    const result = await query("/presence/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds }),
    });
    return result.presences || {};
  } catch (error) {
    console.error("Failed to get batch presence:", error);
    return {};
  }
};

export const createPresenceIndicator = (online, lastSeen, device) => {
  const indicator = document.createElement("span");
  indicator.className = "presence-indicator";
  indicator.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  `;

  const dot = document.createElement("span");
  dot.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${online ? "#10b981" : "#6b7280"};
    display: inline-block;
  `;

  indicator.appendChild(dot);

  if (online && device) {
    const deviceIcon = document.createElement("span");
    deviceIcon.textContent = device === "mobile" ? "📱" : device === "tablet" ? "📱" : "💻";
    deviceIcon.style.fontSize = "12px";
    indicator.appendChild(deviceIcon);
  } else if (!online && lastSeen) {
    const lastSeenText = document.createElement("span");
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diff = now - lastSeenDate;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    let timeText = "";
    if (minutes < 1) {
      timeText = "Just now";
    } else if (minutes < 60) {
      timeText = `${minutes}m ago`;
    } else if (hours < 24) {
      timeText = `${hours}h ago`;
    } else {
      timeText = `${days}d ago`;
    }

    lastSeenText.textContent = timeText;
    indicator.appendChild(lastSeenText);
  }

  return indicator;
};

export const isGhostModeEnabled = () => ghostMode;
