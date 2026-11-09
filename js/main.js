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

  // Générique du nom (accueil) : une fois par visite, jamais si la personne a demandé moins d'animations.
  const heroTitre = document.querySelector(".hero-title");
  const dejaVu = getStore("portfolio-generique");
  if (heroTitre && !prefersReducedMotion && !dejaVu && heroTitre.animate) {
    setStore("portfolio-generique", "1");
    // Le titre reste caché le temps que la police arrive, pour que le générique se mesure sur la bonne taille.
    heroTitre.style.clipPath = "inset(-20% 100% -20% 0)";
    const policePrete = document.fonts
      ? document.fonts.load('600 1em "Barlow Semi Condensed"').catch(() => {})
      : Promise.resolve();
    const auPlusTard = new Promise((r) => setTimeout(r, 700));
    Promise.race([policePrete, auPlusTard]).then(() => {
      heroTitre.style.clipPath = "";
      const tete = document.createElement("span");
      tete.className = "generique-tete";
      tete.setAttribute("aria-hidden", "true");
      const tc = document.createElement("span");
      tc.className = "generique-tc";
      tete.appendChild(tc);
      // La tête de lecture vit à côté du titre (pas dedans), sinon elle serait coupée avec lui.
      const parent = heroTitre.parentElement;
      if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
      tete.style.top = (heroTitre.offsetTop - heroTitre.offsetHeight * 0.12) + "px";
      tete.style.height = (heroTitre.offsetHeight * 1.2) + "px";
      tete.style.left = heroTitre.offsetLeft + "px";
      parent.appendChild(tete);

      const duree = 1400;
      // Largeur du texte lui-même (pas de la boîte du titre), pour que la tête s'arrête sur la dernière lettre.
      const plage = document.createRange();
      plage.selectNodeContents(heroTitre);
      const gauche = heroTitre.getBoundingClientRect().left;
      const largeur = Math.max(...Array.from(plage.getClientRects(), (r) => r.right)) - gauche;
      const ease = "cubic-bezier(0.65, 0, 0.35, 1)";
      heroTitre.animate(
        [{ clipPath: "inset(-20% 100% -20% 0)" }, { clipPath: "inset(-20% 0 -20% 0)" }],
        { duration: duree, easing: ease, fill: "backwards" }
      );
      tete.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(" + largeur + "px)" }],
        { duration: duree, easing: ease, fill: "forwards" }
      );

      const debut = performance.now();
      const image = (t) => {
        const ecoule = Math.min(t - debut, duree);
        const images = Math.round((ecoule / 1000) * 30);
        const ii = (n) => String(n).padStart(2, "0");
        tc.textContent = "00:00:" + ii(Math.floor(images / 30)) + ":" + ii(images % 30);
        if (ecoule < duree) requestAnimationFrame(image);
        else {
          tete.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 250, fill: "forwards" })
            .finished.then(() => tete.remove());
        }
      };
      requestAnimationFrame(image);
    });
  }

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
    ".browser-frame img, .ui-mosaic-screen img, .ui-screen img, .process-photo img"
  );

  if (zoomableImages.length > 0) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image agrandie");
    overlay.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Fermer">&times;</button><img src="" alt="">';
    document.body.appendChild(overlay);

    let dernierDeclencheur = null;
    const overlayImg = overlay.querySelector("img");
    const closeBtn = overlay.querySelector(".lightbox-close");

    const openLightbox = (src, alt) => {
      overlayImg.src = src;
      overlayImg.alt = alt || "";
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
        openLightbox(img.src, img.alt);
      });
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Agrandir : " + (img.alt || "image"));
      img.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dernierDeclencheur = img;
          openLightbox(img.src, img.alt);
        }
      });
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeLightbox();
    });

    closeBtn.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
      if (!overlay.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeBtn.focus();
      }
    });
  }
});
