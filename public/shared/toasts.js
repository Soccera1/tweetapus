// Toasts manager (cleaned	 from mi	ni		fied vers		ion)
// Clean, readable toast manager

class DragToDismiss {
	constructor({ direction = "inline-start", removeCallback } = {}) {
		this.direction = direction;
		this.removeCallback = removeCallback || ((el) => el.remove());

		this.target = null;
		this.targetBCR = null;
		this.startX = this.startY = 0;
		this.currentX = this.currentY = 0;
		this.screenX = this.screenY = 0;
		this.targetX = this.targetY = 0;
		this.isDragging = false;

		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.update = this.update.bind(this);

		this.addEventListeners();
		requestAnimationFrame(this.update);
	}

	addEventListeners() {
		document.addEventListener("pointerdown", this.onPointerDown);
		document.addEventListener("pointermove", this.onPointerMove);
		document.addEventListener("pointerup", this.onPointerUp);
	}

	onPointerDown(evt) {
		if (this.target) return;
		const el = evt.target.closest("[data-toast-id]");
		if (!el) return;
		evt.preventDefault();
		this.target = el;
		this.targetBCR = el.getBoundingClientRect();
		this.startX = evt.pageX;
		this.startY = evt.pageY;
		this.currentX = this.startX;
		this.currentY = this.startY;
		this.isDragging = true;
		el.style.willChange = "transform";
		el.style.zIndex = "9999";
	}

	onPointerMove(evt) {
		if (!this.target) return;
		const dir = this.direction;
		if (dir.includes("inline")) {
			if (dir === "inline-start" && evt.pageX < this.startX) return;
			if (dir === "inline-end" && evt.pageX > this.startX) return;
			this.currentX = evt.pageX;
		} else if (dir.includes("block")) {
			if (dir === "block-start" && evt.pageY < this.startY) return;
			if (dir === "block-end" && evt.pageY > this.startY) return;
			this.currentY = evt.pageY;
		}
		this.target.dataset.swiping = "";
	}

	onPointerUp() {
		if (!this.target) return;
		const dx = this.currentX - this.startX;
		const dy = this.currentY - this.startY;
		const isInline = this.direction.includes("inline");
		const threshold = isInline
			? this.targetBCR.width * 0.3
			: this.targetBCR.height * 0.6;
		this.targetX = 0;
		this.targetY = 0;
		if (isInline && Math.abs(dx) > threshold) {
			this.targetX = dx > 0 ? this.targetBCR.width : -this.targetBCR.width;
		}
		if (!isInline && Math.abs(dy) > threshold) {
			this.targetY = dy > 0 ? this.targetBCR.height : -this.targetBCR.height;
		}
		this.isDragging = false;
	}

	update() {
		requestAnimationFrame(this.update);
		if (!this.target) return;
		const isInline = this.direction.includes("inline");
		if (this.isDragging) {
			if (isInline) this.screenX = this.currentX - this.startX;
			else this.screenY = this.currentY - this.startY;
		} else {
			if (isInline) this.screenX += (this.targetX - this.screenX) / 4;
			else this.screenY += (this.targetY - this.screenY) / 4;
		}

		const progress =
			1 -
			(isInline
				? Math.abs(this.screenX) / this.targetBCR.width
				: Math.abs(this.screenY) / this.targetBCR.height) **
				3;
		if (isInline) this.target.style.transform = `translateX(${this.screenX}px)`;
		else this.target.style.transform = `translateY(${this.screenY}px)`;
		this.target.style.opacity = String(progress);

		if (this.isDragging) return;

		const almostZero = Math.abs(isInline ? this.screenX : this.screenY) < 0.1;
		if (progress < 0.01) {
			if (this.target?.parentNode) {
				this.removeCallback(this.target);
			}
			this.target = null;
			return;
		}
		if (almostZero) this.resetTarget();
	}

	resetTarget() {
		if (!this.target) return;
		delete this.target.dataset.swiping;
		this.target.style.removeProperty("will-change");
		this.target.style.removeProperty("z-index");
		this.target.style.removeProperty("transform");
		this.target.style.removeProperty("opacity");
		this.target = null;
	}
}
class PauseableTimer {
	constructor(callback, timeout) {
		this.callback = callback;
		this.remaining = timeout;
		this.timerId = null;
		this.startedAt = null;
		if (this.remaining) this.resume();
	}

	resume() {
		if (this.timerId) return; // already running
		this.startedAt = Date.now();
		this.timerId = setTimeout(this.callback, this.remaining);
	}

	pause() {
		if (!this.timerId) return;
		clearTimeout(this.timerId);
		this.timerId = null;
		this.remaining -= Date.now() - this.startedAt;
	}

	clear() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = null;
		}
	}
}

const POPOVER_TEMPLATE = `<section data-toast="popover" popover="manual" data-minimized>
  <div data-toast="menubar">
    <button data-toast-button="minimize">Show less</button>
    <button data-toast-button="clear-all">Clear all</button>
  </div>
  <ul data-toast="container"></ul>
</section>`;

const TOAST_TEMPLATE = `<li data-toast="root" role="alertdialog" aria-modal="false">
  <div data-toast="notification">
    <div data-toast="content" role="alert" aria-atomic="true"></div>
    <div data-toast="actions"></div>
    <button data-toast-button="clear">&times;</button>
  </div>
</li>`;

function viewTransitionClass(position) {
	// map "top start" -> "block-start inline-start" etc.
	switch (position) {
		case "top start":
			return "block-start inline-start";
		case "top center":
			return "block-start";
		case "top end":
			return "block-start inline-end";
		case "bottom start":
			return "block-end inline-start";
		case "bottom center":
			return "block-end";
		case "bottom end":
			return "block-end inline-end";
		default:
			return "";
	}
}

function directionForPosition(position) {
	// pick a drag direction for swipe-to-dismiss
	switch (position) {
		case "top start":
			return "inline-start";
		case "top center":
			return "block-start";
		case "top end":
			return "inline-end";
		case "bottom start":
			return "inline-start";
		case "bottom center":
			return "block-end";
		case "bottom end":
			return "inline-end";
		default:
			return "inline-start";
	}
}

class ToastQueue {
	constructor(options = {}) {
		// normalize legacy keys
		const opts = Object.assign({}, options);
		if (opts.isMinimized !== undefined) opts.minimized = opts.isMinimized;
		if (opts.maxVisibleToasts !== undefined)
			opts.maxToasts = opts.maxVisibleToasts;
		if (typeof opts.position === "string")
			opts.position = opts.position.replace(/-/g, " ");

		this.toasts = new Set();
		this.timeout = opts.timeout ?? 3700;
		// set internal position first to avoid running the setter (which calls update)
		// before DOM elements (popover) are created
		this._position = opts.position || "top end";
		this.minimized = opts.minimized ?? true;
		this.maxToasts = opts.maxToasts ?? 6;
		this.root = opts.root || document.body;

		// build DOM
		const tpl = document.createElement("template");
		tpl.innerHTML = POPOVER_TEMPLATE;
		this.popover = tpl.content.querySelector('[data-toast="popover"]');
		this.container = tpl.content.querySelector('[data-toast="container"]');
		this.popover.dataset.toastPosition = this.position;
		this.root.appendChild(tpl.content.cloneNode(true));

		// re-query because cloned
		this.popover = this.root.querySelector('[data-toast="popover"]');
		this.container = this.popover.querySelector('[data-toast="container"]');

		this.dragManager = new DragToDismiss({
			direction: directionForPosition(this.position),
			removeCallback: (el) => {
				const id = el.dataset.toastId;
				if (id) this.delete(id);
				else el.remove();
			},
		});

		this.container.addEventListener("pointerover", (e) => {
			if (e.target.closest('[data-toast="container"]')) this.pauseAll();
		});
		this.container.addEventListener("pointerout", () => this.resumeAll());
		document.addEventListener("visibilitychange", () => {
			document.visibilityState === "hidden"
				? this.pauseAll()
				: this.resumeAll();
		});

		// wire menubar buttons
		const pop = this.popover;
		pop
			.querySelector('[data-toast-button="clear-all"]')
			.addEventListener("click", () => this.clearAll());
		pop
			.querySelector('[data-toast-button="minimize"]')
			.addEventListener("click", () => {
				this.minimized = !this.minimized;
				this.update();
			});

		this.update();
	}

	set isMinimized(v) {
		this.minimized = v;
		this.update();
	}
	get isMinimized() {
		return this.minimized;
	}

	set position(v) {
		this._position = v;
		if (this.dragManager) this.dragManager.direction = directionForPosition(v);
		this.update();
	}
	get position() {
		return this._position;
	}

	update() {
		// show/hide popover based on toasts
		if (this.popover) {
			if (this.toasts.size === 1) this.popover.showPopover?.();
			if (this.toasts.size === 0) this.popover.hidePopover?.();
		}
		this.container.setAttribute(
			"aria-label",
			`${this.toasts.size} notifications`,
		);
		requestAnimationFrame(() => {
			this.popover.dataset.toastPosition = this.position;
			if (this.minimized) this.popover.dataset.minimized = "";
			else delete this.popover.dataset.minimized;
			this.render();
		});
	}

	render() {
		const sliceStart = Math.max(this.toasts.size - this.maxToasts, 0);
		const arr = Array.from(this.toasts).slice(sliceStart).reverse();
		const html = arr
			.map((t) => {
				const template = document.createElement("template");
				template.innerHTML = TOAST_TEMPLATE;
				const li = template.content.querySelector('[data-toast="root"]');
				const content = li.querySelector('[data-toast="content"]');
				const actions = li.querySelector('[data-toast="actions"]');
				const id = t.id;
				const ariaId = `aria-label-${id}`;
				li.dataset.toastId = id;
				li.tabIndex = 0;
				li.setAttribute("aria-labelledby", ariaId);
				li.style.setProperty("view-transition-name", `toast-${id}`);
				li.style.setProperty(
					"view-transition-class",
					`toast ${viewTransitionClass(this.position)}`,
				);
				li.style.touchAction = "none";
				if (t.action)
					actions.innerHTML = `<button data-toast-button="action">${t.action.label}</button>`;
				content.innerHTML = `${t.content}`;
				content.id = ariaId;
				return li.outerHTML;
			})
			.join("");
		this.container.innerHTML = html;
		// delegate clear/action buttons
		this.container
			.querySelectorAll('[data-toast-button="clear"]')
			.forEach((btn) => {
				btn.addEventListener("click", (e) => {
					const li = e.target.closest("[data-toast-id]");
					if (li) this.delete(li.dataset.toastId);
				});
			});
		this.container
			.querySelectorAll('[data-toast-button="action"]')
			.forEach((btn) => {
				btn.addEventListener("click", (e) => {
					const li = e.target.closest("[data-toast-id]");
					const toast = li && this.get(li.dataset.toastId);
					if (typeof toast?.action?.onClick === "function")
						toast.action.onClick(toast);
				});
			});
	}

	get(id) {
		for (const t of this.toasts) if (t.id === id) return t;
	}

	add(content, opts = {}) {
		const timeout = opts.timeout ?? this.timeout;
		const id = Math.random().toString(36).slice(2);
		const toast = {
			id,
			index: this.toasts.size + 1,
			timer: timeout
				? new PauseableTimer(() => this.delete(id), timeout)
				: undefined,
			content,
			action: opts.action,
		};
		this.toasts.add(toast);
		this.update();
		return toast;
	}

	delete(id) {
		for (const t of Array.from(this.toasts)) {
			if (t.id === id) {
				t.timer?.clear();
				this.toasts.delete(t);
			}
		}
		this.update();
	}

	clearAll() {
		for (const t of this.toasts) t.timer?.clear();
		this.toasts.clear();
		this.isMinimized = true;
		this.update();
	}

	pauseAll() {
		for (const t of this.toasts) t.timer?.pause();
	}

	resumeAll() {
		for (const t of this.toasts) t.timer?.resume();
	}
}

const defaultExport = new ToastQueue({
	position: "bottom center",
	minimized: true,
	maxToasts: 7,
	root: document.body,
	timeout: 3700,
});

export default defaultExport;
