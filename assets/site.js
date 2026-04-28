document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const tosModal = document.querySelector("[data-tos-modal]");

if (tosModal) {
  const openTos = () => {
    tosModal.hidden = false;
    requestAnimationFrame(() => {
      tosModal.classList.add("is-open");
    });
    document.documentElement.style.overflow = "hidden";
  };

  const closeTos = () => {
    tosModal.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    window.setTimeout(() => {
      if (!tosModal.classList.contains("is-open")) {
        tosModal.hidden = true;
      }
    }, 220);
  };

  document.querySelectorAll("[data-tos-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openTos();
    });
  });

  tosModal.querySelectorAll("[data-tos-close]").forEach((trigger) => {
    trigger.addEventListener("click", closeTos);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tosModal.classList.contains("is-open")) {
      closeTos();
    }
  });
}

const featureBrowser = document.querySelector("[data-feature-browser]");

if (featureBrowser) {
  const searchInput = featureBrowser.querySelector("[data-feature-search]");
  const resultNode = featureBrowser.querySelector("[data-feature-results]");
  const emptyState = document.querySelector("[data-feature-empty]");
  const filterButtons = Array.from(featureBrowser.querySelectorAll("[data-feature-filter]"));
  const groups = Array.from(document.querySelectorAll("[data-feature-group]"));
  const items = Array.from(document.querySelectorAll("[data-feature-item]"));

  let activeFilter = "all";

  const updateResults = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    items.forEach((item) => {
      const tags = (item.getAttribute("data-tags") || "").toLowerCase();
      const content = item.textContent?.toLowerCase() || "";
      const searchHaystack = `${content} ${tags}`;
      const matchesQuery = !query || searchHaystack.includes(query);
      const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
      const isVisible = matchesQuery && matchesFilter;

      item.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
    });

    groups.forEach((group) => {
      const groupItems = Array.from(group.querySelectorAll("[data-feature-item]"));
      const hasVisibleItems = groupItems.some((item) => !item.hidden);
      group.hidden = !hasVisibleItems;
    });

    if (resultNode) {
      resultNode.textContent = `${visibleCount} feature${visibleCount === 1 ? "" : "s"} shown`;
    }

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.getAttribute("data-feature-filter") || "all";

      filterButtons.forEach((chip) => {
        const isActive = chip === button;
        chip.classList.toggle("is-active", isActive);
        chip.setAttribute("aria-pressed", String(isActive));
      });

      updateResults();
    });
  });

  searchInput?.addEventListener("input", updateResults);
  updateResults();
}
