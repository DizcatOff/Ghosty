const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

const closeMenu = () => {
  if (!menuToggle || !siteNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  siteNav.classList.remove("is-open");
};

const openMenu = () => {
  if (!menuToggle || !siteNav) return;
  menuToggle.setAttribute("aria-expanded", "true");
  siteNav.classList.add("is-open");
};

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!siteNav.contains(target) && !menuToggle.contains(target)) {
      closeMenu();
    }
  });

  siteNav.querySelectorAll("a, button").forEach((node) => {
    node.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960) {
      closeMenu();
    }
  });
}

const setModalState = (modal, isOpen) => {
  if (!modal) return;
  modal.classList.toggle("is-active", isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.documentElement.style.overflow = isOpen ? "hidden" : "";
};

document.querySelectorAll("[data-modal-open]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const id = trigger.getAttribute("data-modal-open");
    const modal = id ? document.getElementById(id) : null;
    setModalState(modal, true);
  });
});

document.querySelectorAll("[data-modal-close]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const modal = trigger.closest(".modal");
    setModalState(modal, false);
  });
});

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      setModalState(modal, false);
    }
  });
});

document.querySelectorAll("[data-accordion]").forEach((group) => {
  const items = group.querySelectorAll(".accordion-item");

  items.forEach((item, index) => {
    const trigger = item.querySelector(".accordion-trigger");
    const content = item.querySelector(".accordion-content");
    if (!trigger || !content) return;

    const sync = (isOpen) => {
      item.classList.toggle("is-open", isOpen);
      trigger.setAttribute("aria-expanded", String(isOpen));
      content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "0px";
    };

    sync(index === 0);

    trigger.addEventListener("click", () => {
      const nextState = !item.classList.contains("is-open");
      items.forEach((otherItem) => {
        const otherTrigger = otherItem.querySelector(".accordion-trigger");
        const otherContent = otherItem.querySelector(".accordion-content");
        if (!otherTrigger || !otherContent) return;
        otherItem.classList.remove("is-open");
        otherTrigger.setAttribute("aria-expanded", "false");
        otherContent.style.maxHeight = "0px";
      });
      sync(nextState);
    });
  });
});

const revealNodes = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && revealNodes.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.12,
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

document.querySelectorAll("[data-current-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

const featureBrowser = document.querySelector("[data-feature-browser]");
const featureList = document.querySelector("[data-feature-list]");

if (featureBrowser && featureList) {
  const normalizeFeatureTag = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const searchInput = featureBrowser.querySelector("[data-feature-search]");
  const resultNode = featureBrowser.querySelector("[data-feature-results]");
  const resetButton = featureBrowser.querySelector("[data-feature-reset]");
  const filterButtons = featureBrowser.querySelectorAll("[data-feature-filter]");
  const emptyState = document.querySelector("[data-feature-empty]");
  const groupedItems = Array.from(featureList.querySelectorAll("[data-feature-group] .trace-item"));
  let activeFilter = "all";

  if (groupedItems.length) {
    const itemsMarkup = groupedItems
      .map((item) => {
        const name =
          item.querySelector(".trace-name span")?.textContent.trim() ||
          item.querySelector(".trace-name")?.textContent.trim() ||
          "";
        const copy = item.querySelector(".trace-copy")?.textContent.trim() || "";
        const tags = Array.from(item.querySelectorAll(".trace-tag")).map((tag) => tag.textContent.trim());
        const normalizedTags = tags.map(normalizeFeatureTag).join(" ");
        const tagsMarkup =
          item.querySelector(".tag-row")?.innerHTML ||
          tags.map((tag) => `<span class="trace-tag">${escapeHtml(tag)}</span>`).join("");

        return `
          <article class="feature-catalog-item" data-feature-item data-feature-tags="${escapeHtml(normalizedTags)}">
            <div class="feature-catalog-main">
              <h4>${escapeHtml(name)}</h4>
              <p>${escapeHtml(copy)}</p>
            </div>
            <div class="feature-catalog-tags">${tagsMarkup}</div>
          </article>
        `;
      })
      .join("");

    featureList.classList.remove("atlas-grid", "feature-atlas");
    featureList.classList.add("feature-catalog");
    featureList.innerHTML = `
      <div class="feature-catalog-head">
        <div>
          <p class="card-eyebrow">All features</p>
          <h3 class="card-title">Full feature list</h3>
          <p class="card-copy">Search by name or description, then check the tags to see where each feature belongs.</p>
        </div>
      </div>
      <div class="feature-catalog-list">
        ${itemsMarkup}
      </div>
    `;
  }

  const items = Array.from(featureList.querySelectorAll("[data-feature-item]"));

  const updateFeatureBrowser = () => {
    const query = (searchInput?.value || "").trim().toLowerCase();
    let visibleCount = 0;

    items.forEach((item) => {
      const haystack = item.textContent.toLowerCase();
      const tags = (item.getAttribute("data-feature-tags") || "").split(" ").filter(Boolean);
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = activeFilter === "all" || tags.includes(activeFilter);
      const isVisible = matchesQuery && matchesFilter;
      item.hidden = !isVisible;

      if (isVisible) {
        visibleCount += 1;
      }
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
      updateFeatureBrowser();
    });
  });

  searchInput?.addEventListener("input", updateFeatureBrowser);

  resetButton?.addEventListener("click", () => {
    activeFilter = "all";
    if (searchInput) {
      searchInput.value = "";
    }
    filterButtons.forEach((chip) => {
      const isActive = chip.getAttribute("data-feature-filter") === "all";
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", String(isActive));
    });
    updateFeatureBrowser();
  });

  updateFeatureBrowser();
}

const populateStarfield = (container, starClass, totalStars) => {
  if (!container) return;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < totalStars; i += 1) {
    const star = document.createElement("span");
    const size = Math.random() < 0.1 ? 2 : Math.random() < 0.4 ? 1.4 : 0.9;
    star.className = starClass;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--star-size", `${size}px`);
    star.style.setProperty("--star-opacity", `${0.16 + Math.random() * 0.42}`);
    star.style.setProperty("--star-delay", `${Math.random() * -12}s`);
    star.style.setProperty("--star-duration", `${8 + Math.random() * 12}s`);
    star.style.setProperty("--star-drift-x", `${-7 + Math.random() * 14}px`);
    star.style.setProperty("--star-drift-y", `${-9 + Math.random() * 18}px`);
    fragment.appendChild(star);
  }

  container.appendChild(fragment);
};

const homeStarfield = document.querySelector("[data-home-starfield]");

if (homeStarfield) {
  populateStarfield(homeStarfield, "home-star", window.innerWidth < 768 ? 55 : 95);
}

if (document.body.matches(".page-features, .page-guard, .page-redirect")) {
  const siteStarfield = document.createElement("div");
  siteStarfield.className = "site-starfield";
  siteStarfield.setAttribute("aria-hidden", "true");
  document.body.prepend(siteStarfield);
  populateStarfield(siteStarfield, "site-star", window.innerWidth < 768 ? 40 : 72);
}

document.querySelectorAll("[data-drift]").forEach((stage) => {
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
    stage.style.setProperty("--drift-x", `${x}px`);
    stage.style.setProperty("--drift-y", `${y}px`);
  });

  stage.addEventListener("pointerleave", () => {
    stage.style.setProperty("--drift-x", "0px");
    stage.style.setProperty("--drift-y", "0px");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    document.querySelectorAll(".modal.is-active").forEach((modal) => {
      setModalState(modal, false);
    });
  }
});
