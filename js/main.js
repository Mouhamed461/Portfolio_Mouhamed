document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");

  if (toggle && nav) {
    const closeMenu = () => {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  const revealElements = document.querySelectorAll(".reveal");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (revealElements.length > 0) {
    if (prefersReducedMotion) {
      revealElements.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      revealElements.forEach((el) => observer.observe(el));
    }
  }

  const categoryTabs = document.querySelectorAll(".category-tab");
  const realisationsGrid = document.querySelector(".realisations-grid");
  const realisationsCards = document.querySelectorAll(".realisations-grid .feature-card");
  const filterEmpty = document.querySelector(".filter-empty");

  if (categoryTabs.length > 0 && realisationsGrid && realisationsCards.length > 0) {
    const applyFilter = (filter) => {
      let visibleCount = 0;
      realisationsCards.forEach((card) => {
        const categories = (card.dataset.categories || "").split(" ");
        const matches = filter === "all" || categories.includes(filter);
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      if (filterEmpty) {
        filterEmpty.classList.toggle("is-visible", visibleCount === 0);
      }
    };

    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.classList.contains("is-active")) return;
        const filter = tab.dataset.filter;
        categoryTabs.forEach((t) => t.classList.toggle("is-active", t === tab));

        if (prefersReducedMotion) {
          applyFilter(filter);
        } else {
          realisationsGrid.classList.add("is-filtering");
          setTimeout(() => {
            applyFilter(filter);
            requestAnimationFrame(() => {
              realisationsGrid.classList.remove("is-filtering");
            });
          }, 300);
        }
      });
    });
  }

  const zoomableImages = document.querySelectorAll(
    ".browser-frame img, .ui-mosaic-screen img, .ui-screen img"
  );

  if (zoomableImages.length > 0) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Fermer">&times;</button><img src="" alt="">';
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector("img");
    const closeBtn = overlay.querySelector(".lightbox-close");

    const openLightbox = (src, alt) => {
      overlayImg.src = src;
      overlayImg.alt = alt || "";
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };

    const closeLightbox = () => {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    };

    zoomableImages.forEach((img) => {
      img.addEventListener("click", () => openLightbox(img.src, img.alt));
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });

    closeBtn.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }
});
