import { authToken } from "./auth.js";
import switchPage, { addRoute } from "./pages.js";

let notifications = [];

export default async function openNotifications() {
	switchPage("notifications", {
		path: "/notifications",
		recoverState: async () => {
			await loadNotifications();
			renderNotifications();
		},
	});
}

async function loadNotifications() {
	if (!authToken) return;

	const listElement = document.getElementById("notificationsPageList");
	if (listElement) {
		listElement.innerHTML =
			'<div class="notification-loading">Loading notifications...</div>';
	}

	try {
		const response = await fetch("/api/notifications/", {
			headers: { Authorization: `Bearer ${authToken}` },
		});

		if (response.ok) {
			const data = await response.json();
			notifications = data.notifications || [];
		} else {
			console.error("Failed to load notifications:", response.status);
			if (listElement) {
				listElement.innerHTML =
					'<div class="no-notifications">Failed to load notifications</div>';
			}
		}
	} catch (error) {
		console.error("Failed to load notifications:", error);
		if (listElement) {
			listElement.innerHTML =
				'<div class="no-notifications">Failed to load notifications</div>';
		}
	}
}

function renderNotifications() {
	const listElement = document.getElementById("notificationsPageList");
	if (!listElement) return;

	if (notifications.length === 0) {
		listElement.innerHTML =
			'<div class="no-notifications">No notifications for now!</div>';
		return;
	}

	listElement.innerHTML = notifications
		.map((notification) => createNotificationHTML(notification))
		.join("");

	listElement.querySelectorAll(".notification-item").forEach((item) => {
		item.addEventListener("click", (e) => {
			const notificationId = e.currentTarget.dataset.id;
			const notificationType = e.currentTarget.dataset.type;
			const relatedId = e.currentTarget.dataset.relatedId;

			handleNotificationClick(notificationId, notificationType, relatedId);
		});
	});
}

function handleNotificationClick(notificationId, type, relatedId) {
	markAsRead(notificationId);

	if (
		relatedId &&
		(type === "like" ||
			type === "retweet" ||
			type === "reply" ||
			type === "quote")
	) {
		window.location.href = `/tweet/${relatedId}`;
	} else if (relatedId && type === "follow") {
		window.location.href = `/@${relatedId}`;
	}
}

function createNotificationHTML(notification) {
	const timeAgo = getTimeAgo(new Date(notification.created_at));
	const isUnread = !notification.read;
	const icon = getNotificationIcon(notification.type);
	const iconClass = getNotificationIconClass(notification.type);

	return `
      <div class="notification-item ${isUnread ? "unread" : ""}" data-id="${notification.id}" data-type="${notification.type}" data-related-id="${notification.related_id || ""}">
        <div class="notification-icon ${iconClass}">
          ${icon}
        </div>
        <div class="notification-content">
          <p>${notification.content}</p>
          <span class="notification-time">${timeAgo}</span>
        </div>
      </div>
    `;
}

function getNotificationIconClass(type) {
	const classes = {
		like: "like-icon",
		retweet: "retweet-icon",
		reply: "reply-icon",
		follow: "follow-icon",
		quote: "quote-icon",
	};
	return classes[type] || "follow-icon";
}

function getNotificationIcon(type) {
	const icons = {
		like: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>`,
		retweet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 1l4 4-4 4"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <path d="M7 23l-4-4 4-4"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>`,
		reply: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`,
		follow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
		quote: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
      </svg>`,
	};
	return icons[type] || icons.like;
}

function getTimeAgo(date) {
	const now = new Date();
	const diffInSeconds = Math.floor((now - date) / 1000);

	if (diffInSeconds < 60) return "just now";
	if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
	if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
	if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
	return date.toLocaleDateString();
}

async function markAsRead(notificationId) {
	if (!authToken) return;

	try {
		const response = await fetch(`/api/notifications/${notificationId}/read`, {
			method: "PATCH",
			headers: { Authorization: `Bearer ${authToken}` },
		});

		if (response.ok) {
			const notification = notifications.find((n) => n.id === notificationId);
			if (notification) {
				notification.read = true;
				renderNotifications();
			}
		}
	} catch (error) {
		console.error("Failed to mark notification as read:", error);
	}
}

async function markAllAsRead() {
	if (!authToken) return;

	try {
		const response = await fetch("/api/notifications/mark-all-read", {
			method: "PATCH",
			headers: { Authorization: `Bearer ${authToken}` },
		});

		if (response.ok) {
			notifications.forEach((notification) => {
				notification.read = true;
			});
			renderNotifications();
		}
	} catch (error) {
		console.error("Failed to mark all notifications as read:", error);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const markAllReadBtn = document.getElementById("markAllReadBtnPage");
	markAllReadBtn?.addEventListener("click", () => {
		markAllAsRead();
	});
});

addRoute(
	(pathname) => pathname === "/notifications",
	() => openNotifications(),
);
