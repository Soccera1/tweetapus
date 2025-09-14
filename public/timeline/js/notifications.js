import { authToken } from "./auth.js";

class NotificationManager {
	constructor() {
		this.isDropdownOpen = false;
		this.notifications = [];
		this.pollInterval = null;
		this.init();
	}

	init() {
		this.bindEvents();
		this.startPolling();
		this.loadNotifications();
	}

	bindEvents() {
		const notificationsBtn = document.getElementById("notificationsBtn");
		const notificationsDropdown = document.getElementById(
			"notificationsDropdown",
		);
		const markAllReadBtn = document.getElementById("markAllReadBtn");

		notificationsBtn?.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggleDropdown();
		});

		document.addEventListener("click", (e) => {
			if (
				!notificationsDropdown?.contains(e.target) &&
				!notificationsBtn?.contains(e.target)
			) {
				this.closeDropdown();
			}
		});

		markAllReadBtn?.addEventListener("click", () => {
			this.markAllAsRead();
		});
	}

	toggleDropdown() {
		if (this.isDropdownOpen) {
			this.closeDropdown();
		} else {
			this.openDropdown();
		}
	}

	openDropdown() {
		const dropdown = document.getElementById("notificationsDropdown");
		if (dropdown) {
			dropdown.classList.add("open");
			this.isDropdownOpen = true;
			this.loadNotifications();
		}
	}

	closeDropdown() {
		const dropdown = document.getElementById("notificationsDropdown");
		if (dropdown) {
			dropdown.classList.remove("open");
			this.isDropdownOpen = false;
		}
	}

	async loadNotifications() {
		if (!authToken) return;

		const listElement = document.getElementById("notificationsList");
		if (listElement && this.isDropdownOpen) {
			listElement.innerHTML =
				'<div class="notification-loading">Loading notifications...</div>';
		}

		try {
			const response = await fetch("/api/notifications/", {
				headers: { Authorization: `Bearer ${authToken}` },
			});

			if (response.ok) {
				const data = await response.json();
				this.notifications = data.notifications || [];
				this.renderNotifications();
				this.updateUnreadCount();
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

	async updateUnreadCount() {
		if (!authToken) return;

		try {
			const response = await fetch("/api/notifications/unread-count", {
				headers: { Authorization: `Bearer ${authToken}` },
			});

			if (response.ok) {
				const data = await response.json();
				this.displayUnreadCount(data.count || 0);
			}
		} catch (error) {
			console.error("Failed to load unread count:", error);
		}
	}

	displayUnreadCount(count) {
		const countElement = document.getElementById("notificationCount");
		if (countElement) {
			if (count > 0) {
				countElement.textContent = count > 99 ? "99+" : count.toString();
				countElement.style.display = "block";
			} else {
				countElement.style.display = "none";
			}
		}
	}

	renderNotifications() {
		const listElement = document.getElementById("notificationsList");
		if (!listElement) return;

		if (this.notifications.length === 0) {
			listElement.innerHTML =
				'<div class="no-notifications">No notifications for now!</div>';
			return;
		}

		listElement.innerHTML = this.notifications
			.map((notification) => this.createNotificationHTML(notification))
			.join("");

		listElement.querySelectorAll(".notification-item").forEach((item) => {
			item.addEventListener("click", (e) => {
				const notificationId = e.currentTarget.dataset.id;
				const notificationType = e.currentTarget.dataset.type;
				const relatedId = e.currentTarget.dataset.relatedId;

				this.handleNotificationClick(
					notificationId,
					notificationType,
					relatedId,
				);
			});
		});
	}

	handleNotificationClick(notificationId, type, relatedId) {
		this.markAsRead(notificationId);

		if (
			relatedId &&
			(type === "like" ||
				type === "retweet" ||
				type === "reply" ||
				type === "quote")
		) {
			const tweetUrl = `/tweet/${relatedId}`;
			if (window.location.pathname !== tweetUrl) {
				window.history.pushState(null, "", tweetUrl);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
			this.closeDropdown();
		} else if (relatedId && type === "follow") {
			const profileUrl = `/profile/${relatedId}`;
			if (window.location.pathname !== profileUrl) {
				window.history.pushState(null, "", profileUrl);
				window.dispatchEvent(new PopStateEvent("popstate"));
			}
			this.closeDropdown();
		}
	}

	createNotificationHTML(notification) {
		const timeAgo = this.getTimeAgo(new Date(notification.created_at));
		const isUnread = !notification.read;
		const icon = this.getNotificationIcon(notification.type);
		const iconClass = this.getNotificationIconClass(notification.type);

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

	getNotificationIconClass(type) {
		const classes = {
			like: "like-icon",
			retweet: "retweet-icon",
			reply: "reply-icon",
			follow: "follow-icon",
			quote: "quote-icon",
		};
		return classes[type] || "follow-icon";
	}

	getNotificationIcon(type) {
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

	getTimeAgo(date) {
		const now = new Date();
		const diffInSeconds = Math.floor((now - date) / 1000);

		if (diffInSeconds < 60) return "just now";
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
		if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
		return date.toLocaleDateString();
	}

	async markAsRead(notificationId) {
		if (!authToken) return;

		try {
			const response = await fetch(
				`/api/notifications/${notificationId}/read`,
				{
					method: "PATCH",
					headers: { Authorization: `Bearer ${authToken}` },
				},
			);

			if (response.ok) {
				const notification = this.notifications.find(
					(n) => n.id === notificationId,
				);
				if (notification) {
					notification.read = true;
					this.renderNotifications();
					this.updateUnreadCount();
				}
			}
		} catch (error) {
			console.error("Failed to mark notification as read:", error);
		}
	}

	async markAllAsRead() {
		if (!authToken) return;

		try {
			const response = await fetch("/api/notifications/mark-all-read", {
				method: "PATCH",
				headers: { Authorization: `Bearer ${authToken}` },
			});

			if (response.ok) {
				this.notifications.forEach((notification) => {
					notification.read = true;
				});
				this.renderNotifications();
				this.updateUnreadCount();
			}
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
		}
	}

	startPolling() {
		this.pollInterval = setInterval(() => {
			this.updateUnreadCount();
			if (this.isDropdownOpen) {
				this.loadNotifications();
			}
		}, 30000);
	}

	stopPolling() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = null;
		}
	}
}

const notificationManager = new NotificationManager();
export default notificationManager;
