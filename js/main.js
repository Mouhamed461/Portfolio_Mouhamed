document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("a[href]").forEach((link) => {
    if (link.protocol.startsWith("http") && link.hostname !== window.location.hostname) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    if (link.target === "_blank" && !link.querySelector(".sr-only")) {
      const note = document.createElement("span");
      note.className = "sr-only";
      note.textContent = " (nouvel onglet)";
      link.appendChild(note);
    }
  });

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
      const annonce = document.getElementById("filtre-annonce");
      if (annonce) {
        annonce.textContent = visibleCount + (visibleCount > 1 ? " projets affichés" : " projet affiché");
      }
    };

    categoryTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        if (tab.classList.contains("is-active")) return;
        const filter = tab.dataset.filter;
        categoryTabs.forEach((t) => {
          t.classList.toggle("is-active", t === tab);
          t.setAttribute("aria-pressed", String(t === tab));
        });

        try {
          sessionStorage.setItem("portfolio-filtre", filter);
          history.replaceState(null, "", filter === "all" ? window.location.pathname : "#" + filter);
        } catch (e) {}

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

  if (categoryTabs.length > 0 && window.location.hash) {
    const wanted = document.querySelector('.category-tab[data-filter="' + window.location.hash.slice(1) + '"]');
    if (wanted) wanted.click();
  }

  const getStore = (key) => { try { return sessionStorage.getItem(key); } catch (e) { return null; } };
  const setStore = (key, value) => { try { sessionStorage.setItem(key, value); } catch (e) {} };

  if (document.querySelector(".hero-band")) setStore("portfolio-origine", "accueil");
  if (document.querySelector(".realisations-grid")) setStore("portfolio-origine", "realisations");

  const backLinks = document.querySelectorAll('.back-link[href$="realisations.html"]');
  if (backLinks.length > 0) {
    const origin = getStore("portfolio-origine");
    const saved = getStore("portfolio-filtre");
    backLinks.forEach((link) => {
      if (origin === "accueil") {
        link.href = "./index.html#projets";
        const label = link.querySelector("span:last-child");
        if (label) label.textContent = "Retour à l'accueil";
      } else if (saved && saved !== "all") {
        // On ne revient au filtre que si ce projet en fait partie ; sinon, on revient à « Tous ».
        const categories = (link.dataset.categories || "").split(" ");
        if (categories.includes(saved)) link.href = "./realisations.html#" + saved;
      }
    });
  }

  document.querySelectorAll(".copy-btn").forEach((btn) => {
    const statut = btn.parentElement.querySelector(".copy-statut");
    btn.addEventListener("click", async () => {
      const texte = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(texte);
        if (statut) statut.textContent = "Adresse copiée";
      } catch (e) {
        const lien = btn.parentElement.querySelector("a");
        if (lien) {
          const range = document.createRange();
          range.selectNodeContents(lien);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        if (statut) statut.textContent = "Adresse sélectionnée : Ctrl+C pour la copier";
      }
      setTimeout(() => { if (statut) statut.textContent = ""; }, 4000);
    });
  });

  const heroVideo = document.getElementById("hero-video");
  const heroPause = document.getElementById("hero-pause");

  if (heroVideo && heroPause) {
    const majPause = () => {
      const enPause = heroVideo.paused;
      heroPause.textContent = enPause ? "Lecture" : "Pause";
      heroPause.setAttribute("aria-label", enPause ? "Lancer la vidéo" : "Mettre la vidéo en pause");
      heroPause.setAttribute("aria-pressed", String(enPause));
    };

    heroVideo.addEventListener("play", majPause);
    heroVideo.addEventListener("pause", majPause);
    heroPause.addEventListener("click", () => {
      if (heroVideo.paused) {
        heroVideo.play().catch(majPause);
      } else {
        heroVideo.pause();
      }
    });

    if (prefersReducedMotion) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    }
    majPause();

    const heroPleinEcran = document.getElementById("hero-plein-ecran");
    if (heroPleinEcran) {
      heroPleinEcran.addEventListener("click", () => {
        if (heroVideo.requestFullscreen) {
          heroVideo.requestFullscreen().catch(() => {});
        } else if (heroVideo.webkitEnterFullscreen) {
          heroVideo.webkitEnterFullscreen();
        }
      });
      document.addEventListener("fullscreenchange", () => {
        heroVideo.controls = document.fullscreenElement === heroVideo;
      });
    }
  }

  const zoomableImages = document.querySelectorAll(
    ".browser-frame img, .ui-mosaic-screen img, .ui-screen img, .process-photo img, .coulisses-photo img"
  );

  if (zoomableImages.length > 0) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image agrandie");
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Fermer">&times;</button>' +
      '<button type="button" class="lightbox-nav lightbox-nav--prev" aria-label="Image précédente" hidden>&#8592;</button>' +
      '<img src="" alt="">' +
      '<button type="button" class="lightbox-nav lightbox-nav--next" aria-label="Image suivante" hidden>&#8594;</button>' +
      '<p class="lightbox-compte" aria-live="polite" hidden></p>';
    document.body.appendChild(overlay);

    let dernierDeclencheur = null;
    const overlayImg = overlay.querySelector("img");
    const closeBtn = overlay.querySelector(".lightbox-close");
    const prevBtn = overlay.querySelector(".lightbox-nav--prev");
    const nextBtn = overlay.querySelector(".lightbox-nav--next");
    const compte = overlay.querySelector(".lightbox-compte");
    let groupe = [];
    let position = 0;

    // Les images d'une même grille forment un groupe qu'on peut parcourir.
    const groupeDe = (img) => {
      const parent = img.closest(".coulisses-grille, .process-grille");
      if (!parent) return [img];
      return Array.from(zoomableImages).filter((autre) => parent.contains(autre));
    };

    const afficher = (index) => {
      position = (index + groupe.length) % groupe.length;
      const img = groupe[position];
      overlayImg.src = img.currentSrc || img.src;
      overlayImg.alt = img.alt || "";
      const plusieurs = groupe.length > 1;
      prevBtn.hidden = !plusieurs;
      nextBtn.hidden = !plusieurs;
      compte.hidden = !plusieurs;
      compte.textContent = plusieurs ? (position + 1) + " / " + groupe.length : "";
    };

    const openLightbox = (img) => {
      groupe = groupeDe(img);
      afficher(groupe.indexOf(img));
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };

    const closeLightbox = () => {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      if (dernierDeclencheur) dernierDeclencheur.focus();
    };

    zoomableImages.forEach((img) => {
      img.addEventListener("click", () => {
        dernierDeclencheur = img;
        openLightbox(img);
      });
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Agrandir : " + (img.alt || "image"));
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dernierDeclencheur = img;
          openLightbox(img);
        }
      });
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", () => afficher(position - 1));
    nextBtn.addEventListener("click", () => afficher(position + 1));

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft" && groupe.length > 1) {
        afficher(position - 1);
      } else if (event.key === "ArrowRight" && groupe.length > 1) {
        afficher(position + 1);
      } else if (event.key === "Tab") {
        // Le clavier reste dans la visionneuse : Fermer, Précédent, Suivant.
        event.preventDefault();
        const boutons = [closeBtn, prevBtn, nextBtn].filter((b) => !b.hidden);
        const i = boutons.indexOf(document.activeElement);
        const suivant = event.shiftKey ? i - 1 : i + 1;
        boutons[(suivant + boutons.length) % boutons.length].focus();
      }
    });
  }
});
