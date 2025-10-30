const pages = {
  timeline: document.querySelector(".timeline"),
  tweet: document.querySelector(".tweetPage"),
  profile: document.querySelector(".profile"),
  notifications: document.querySelector(".notifications"),
  search: document.querySelector(".search-page"),
  bookmarks: document.querySelector(".bookmarks-page"),
  "direct-messages": document.querySelector(".direct-messages"),
  "dm-conversation": document.querySelector(".dm-conversation"),
  communities: document.querySelector(".communities-page"),
  "community-detail": document.querySelector(".community-detail-page"),
  settings: null,
};
const states = {};
const cleanups = {};
const lazyInitializers = {
  search: false,
  communities: false,
};

function showPage(page, options = {}) {
  const { recoverState = () => {}, cleanup = () => {} } = options;

  if (history.state?.stateId && cleanups[history.state.stateId]) {
    try {
      cleanups[history.state.stateId]();
      delete cleanups[history.state.stateId];
    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  }

  Object.values(pages).forEach((p) => {
    if (p) {
      p.style.display = "none";
      p.classList.remove("page-active");
    }
  });

  const settingsElement = document.querySelector(".settings");
  if (settingsElement) {
    settingsElement.style.display = "none";
    settingsElement.classList.remove("page-active");
  }

  if (pages[page]) {
    pages[page].style.display = "flex";
    pages[page].classList.add("page-active");

    requestAnimationFrame(() => {
      try {
        recoverState(pages[page]);
      } catch (error) {
        console.error(`Error in recoverState for page ${page}:`, error);
      }
    });

    if (page === "search" && !lazyInitializers.search) {
      lazyInitializers.search = true;
      import("./search.js")
        .then(({ initializeSearchPage }) => initializeSearchPage())
        .catch((error) =>
          console.error("Failed to initialize search page:", error)
        );
    }

    if (page === "communities" && !lazyInitializers.communities) {
      lazyInitializers.communities = true;
      import("./communities.js")
        .then(({ initializeCommunitiesPage }) => initializeCommunitiesPage())
        .catch((error) =>
          console.error("Failed to initialize communities page:", error)
        );
    }
  } else if (page === "settings") {
    requestAnimationFrame(() => {
      try {
        recoverState();
      } catch (error) {
        console.error(`Error in recoverState for settings:`, error);
      }
    });
    const updatedSettingsElement = document.querySelector(".settings");
    if (updatedSettingsElement) {
      pages.settings = updatedSettingsElement;
    }
  }

  return pages[page];
}

export default function switchPage(
  page,
  { recoverState = () => {}, path = "/", cleanup = () => {} } = {}
) {
  if (history.state) {
    history.replaceState(
      {
        ...history.state,
        scroll: window.scrollY,
      },
      "",
      window.location.pathname
    );
  }

  showPage(page, { recoverState, path, cleanup });

  const stateId = crypto.randomUUID();
  states[stateId] = recoverState;
  cleanups[stateId] = cleanup;

  history.pushState(
    {
      page,
      stateId,
      scroll: 0,
    },
    "",
    path
  );

  return pages[page];
}

export function addRoute(pathMatcher, onMatch) {
  const currentPath = window.location.pathname;

  if (pathMatcher(currentPath)) onMatch(currentPath);
}

window.addEventListener("popstate", (event) => {
  const { page, stateId, scroll } = event.state || {
    page: "timeline",
    stateId: null,
    scroll: 0,
  };

  if (history.state?.stateId && cleanups[history.state.stateId]) {
    try {
      cleanups[history.state.stateId]();
      delete cleanups[history.state.stateId];
    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  }

  const recoverState = (stateId && states[stateId]) || (() => {});

  showPage(page, { recoverState });

  setTimeout(() => {
    window.scrollTo(0, scroll || 0);
  }, 0);
});

export { showPage };
