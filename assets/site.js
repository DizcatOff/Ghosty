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

const initGhostCursor = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const supportsFinePointer = window.matchMedia("(pointer: fine)").matches;

  if (prefersReducedMotion || !supportsFinePointer) {
    return;
  }

  const layer = document.createElement("div");
  layer.className = "ghost-cursor-layer";
  layer.setAttribute("aria-hidden", "true");

  const cursor = document.createElement("div");
  cursor.className = "ghost-cursor";
  layer.appendChild(cursor);

  const particles = Array.from({ length: 7 }, (_, index) => {
    const particle = document.createElement("span");
    particle.className = "ghost-cursor-particle";
    particle.style.setProperty("--particle-size", `${4 + Math.random() * 6}px`);
    layer.appendChild(particle);

    return {
      element: particle,
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      phase: Math.random() * Math.PI * 2,
      easing: 0.16 + index * 0.024,
      drift: 0.35 + Math.random() * 1.1,
      scale: 0.34 + (7 - index) * 0.04,
    };
  });

  document.body.appendChild(layer);

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.5,
    velocityX: 0,
    velocityY: 0,
    active: false,
    visible: 0,
    ready: false,
    lastMoveTime: 0,
  };

  const hideTrail = () => {
    pointer.active = false;
  };

  const onPointerMove = (event) => {
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.lastMoveTime = performance.now();

    if (!pointer.ready) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      particles.forEach((particle) => {
        particle.x = event.clientX;
        particle.y = event.clientY;
      });
      pointer.ready = true;
    }

    pointer.active = true;
  };

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointercancel", hideTrail);
  document.documentElement.addEventListener("mouseleave", hideTrail);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hideTrail();
    }
  });
  window.addEventListener("blur", hideTrail);

  let lastFrameTime = performance.now();

  const animate = (time) => {
    const delta = Math.min(32, time - lastFrameTime || 16.67);
    const frameScale = delta / 16.67;
    lastFrameTime = time;

    const follow = 1 - Math.pow(0.76, frameScale);
    const drag = Math.pow(0.74, frameScale);
    const idleTime = time - pointer.lastMoveTime;
    const shouldShow = pointer.active && idleTime < 900;
    const visibilityTarget = shouldShow ? 1 : 0;

    pointer.visible += (visibilityTarget - pointer.visible) * (1 - Math.pow(0.82, frameScale));
    pointer.velocityX += (pointer.targetX - pointer.x) * follow;
    pointer.velocityY += (pointer.targetY - pointer.y) * follow;
    pointer.velocityX *= drag;
    pointer.velocityY *= drag;
    pointer.x += pointer.velocityX;
    pointer.y += pointer.velocityY;

    if (!pointer.active && pointer.visible < 0.01) {
      cursor.style.opacity = "0";
      particles.forEach((particle) => {
        particle.element.style.opacity = "0";
      });
      requestAnimationFrame(animate);
      return;
    }

    const speed = Math.min(1, Math.hypot(pointer.velocityX, pointer.velocityY) / 18);
    const cursorScale = 0.94 + speed * 0.08;
    const cursorOpacity = (0.18 + (1 - Math.min(idleTime / 900, 1)) * 0.72) * pointer.visible;

    cursor.style.opacity = cursorOpacity.toFixed(3);
    cursor.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) scale(${cursorScale.toFixed(3)})`;

    let leadX = pointer.x;
    let leadY = pointer.y;

    particles.forEach((particle, index) => {
      const particleFollow = 1 - Math.pow(1 - particle.easing, frameScale);
      particle.x += (leadX - particle.x) * particleFollow;
      particle.y += (leadY - particle.y) * particleFollow;

      const driftX = Math.cos(time * 0.0008 + particle.phase + index * 0.11) * particle.drift;
      const driftY = Math.sin(time * 0.001 + particle.phase + index * 0.14) * particle.drift * 0.24;
      const distance = 1 - index / particles.length;
      const scale = particle.scale + speed * 0.08 * distance;
      const opacity = (0.035 + distance * 0.11 + speed * 0.03) * pointer.visible;

      particle.element.style.opacity = opacity.toFixed(3);
      particle.element.style.transform =
        `translate3d(${particle.x + driftX}px, ${particle.y + driftY}px, 0) scale(${scale.toFixed(3)})`;

      leadX = particle.x;
      leadY = particle.y;
    });

    if (idleTime > 900 && pointer.visible < 0.02) {
      pointer.active = false;
    }

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};

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

initGhostCursor();

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
