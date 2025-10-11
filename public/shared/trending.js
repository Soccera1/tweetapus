import query from "../timeline/js/api.js";

export const createTrendingHashtagsWidget = async () => {
  const widget = document.createElement("div");
  widget.className = "trending-widget";
  widget.style.cssText = `
    background: var(--bg-secondary);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
  `;

  const title = document.createElement("h3");
  title.textContent = "🔥 Trending Hashtags";
  title.style.cssText = `
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  `;
  widget.appendChild(title);

  const list = document.createElement("div");
  list.className = "trending-list";
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  try {
    const result = await query("/hashtags/trending?limit=5");
    
    if (result.hashtags && result.hashtags.length > 0) {
      result.hashtags.forEach((hashtag, index) => {
        const item = document.createElement("a");
        item.href = "javascript:";
        item.className = "trending-item";
        item.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-primary);
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s;
          cursor: pointer;
        `;

        const hashtagInfo = document.createElement("div");
        hashtagInfo.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
        `;

        const rank = document.createElement("span");
        rank.textContent = `${index + 1}`;
        rank.style.cssText = `
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 20px;
        `;

        const hashtagName = document.createElement("span");
        hashtagName.textContent = `#${hashtag.name}`;
        hashtagName.style.cssText = `
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        `;

        const count = document.createElement("span");
        count.textContent = `${hashtag.tweet_count} tweet${hashtag.tweet_count !== 1 ? 's' : ''}`;
        count.style.cssText = `
          font-size: 13px;
          color: var(--text-secondary);
        `;

        hashtagInfo.appendChild(rank);
        hashtagInfo.appendChild(hashtagName);
        item.appendChild(hashtagInfo);
        item.appendChild(count);

        item.addEventListener("mouseenter", () => {
          item.style.background = "var(--bg-overlay-light)";
        });

        item.addEventListener("mouseleave", () => {
          item.style.background = "var(--bg-primary)";
        });

        item.addEventListener("click", async () => {
          const { openHashtagView } = await import("../timeline/js/search.js");
          openHashtagView(hashtag.name);
        });

        list.appendChild(item);
      });
    } else {
      const emptyMsg = document.createElement("p");
      emptyMsg.textContent = "No trending hashtags yet";
      emptyMsg.style.cssText = `
        color: var(--text-secondary);
        font-size: 14px;
        text-align: center;
        padding: 20px 0;
      `;
      list.appendChild(emptyMsg);
    }
  } catch (error) {
    console.error("Failed to load trending hashtags:", error);
    const errorMsg = document.createElement("p");
    errorMsg.textContent = "Failed to load trends";
    errorMsg.style.cssText = `
      color: var(--text-secondary);
      font-size: 14px;
      text-align: center;
      padding: 20px 0;
    `;
    list.appendChild(errorMsg);
  }

  widget.appendChild(list);
  return widget;
};

export const initTrendingWidget = async () => {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const widget = await createTrendingHashtagsWidget();
  sidebar.appendChild(widget);

  setInterval(async () => {
    const newWidget = await createTrendingHashtagsWidget();
    const oldWidget = sidebar.querySelector(".trending-widget");
    if (oldWidget && newWidget) {
      oldWidget.replaceWith(newWidget);
    }
  }, 300000);
};
