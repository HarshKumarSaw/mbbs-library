/**
 * MBBS Resource Library - Core Application Script
 * Vanilla JavaScript - Zero Dependencies, Lightweight & Fast
 */

(function () {
  "use strict";

  // Application State
  const state = {
    selectedSubject: "all",
    selectedCategory: "all",
    searchQuery: "",
    favorites: new Set(),
    activeModalResource: null
  };

  // DOM Elements
  const DOM = {
    searchInput: document.getElementById("search-input"),
    searchClear: document.getElementById("search-clear"),
    searchForm: document.getElementById("search-form"),
    subjectFilters: document.getElementById("subject-filters"),
    categoryFilters: document.getElementById("category-filters"),
    resourcesGrid: document.getElementById("resources-grid"),
    resultsCount: document.getElementById("results-count"),
    activeFiltersContainer: document.getElementById("active-filters"),
    mobileToggle: document.getElementById("mobile-toggle"),
    navLinks: document.getElementById("nav-links"),
    pdfModal: document.getElementById("pdf-modal"),
    pdfFrame: document.getElementById("pdf-frame"),
    modalTitle: document.getElementById("modal-title"),
    modalSubject: document.getElementById("modal-subject"),
    modalDownloadBtn: document.getElementById("modal-download-btn"),
    modalNewTabBtn: document.getElementById("modal-newtab-btn"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    statTotal: document.getElementById("stat-total"),
    statAnatomy: document.getElementById("stat-anatomy"),
    statPhysiology: document.getElementById("stat-physiology"),
    statBiochem: document.getElementById("stat-biochem")
  };

  // SVG Icons helper
  const ICONS = {
    notes: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    assignments: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg>`,
    sdls: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`,
    practicals: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a6 6 0 0 0 12 0V2"></path><line x1="6" y1="6" x2="18" y2="6"></line><line x1="6" y1="10" x2="18" y2="10"></line></svg>`,
    other: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    view: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
    calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    share: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`
  };

  // Initialize
  function init() {
    loadFavorites();
    parseUrlParameters();
    renderSubjectPills();
    renderCategoryPills();
    updateStatsCounters();
    applyFilterAndRender();
    setupEventListeners();
  }

  // Load Saved Favorites from localStorage
  function loadFavorites() {
    try {
      const saved = localStorage.getItem("mbbs_library_starred");
      if (saved) {
        state.favorites = new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("LocalStorage access restricted:", e);
    }
  }

  // Save Favorites
  function saveFavorites() {
    try {
      localStorage.setItem("mbbs_library_starred", JSON.stringify(Array.from(state.favorites)));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }
  }

  // Capitalize & clean name helper
  function formatName(str) {
    if (!str) return "";
    return str.replace(/[_\-]+/g, " ")
              .replace(/\b\w/g, char => char.toUpperCase());
  }

  // Parse Initial URL State (Hash or Query string)
  function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.replace("#", "").toLowerCase();

    const subjectParam = params.get("subject") || hash;
    if (subjectParam) {
      state.selectedSubject = subjectParam;
    }

    const categoryParam = params.get("category");
    if (categoryParam) {
      state.selectedCategory = categoryParam.toLowerCase();
    }

    const searchParam = params.get("q");
    if (searchParam) {
      state.searchQuery = searchParam;
      if (DOM.searchInput) DOM.searchInput.value = searchParam;
      if (DOM.searchClear) DOM.searchClear.style.display = "block";
    }
  }

  // Render Subject Filter Buttons (Dynamically discovers any subjects in MBBS_RESOURCES)
  function renderSubjectPills() {
    if (!DOM.subjectFilters) return;

    const foundSubjects = new Set();
    MBBS_RESOURCES.forEach(r => {
      if (r.subject) foundSubjects.add(r.subject.toLowerCase());
    });

    const ordered = ["all"];
    ["anatomy", "physiology", "biochemistry"].forEach(s => {
      if (foundSubjects.has(s)) ordered.push(s);
    });
    foundSubjects.forEach(s => {
      if (!ordered.includes(s)) ordered.push(s);
    });

    DOM.subjectFilters.innerHTML = ordered.map(subId => {
      const label = subId === "all" ? "All Subjects" : (SUBJECT_INFO[subId]?.name || formatName(subId));
      const count = subId === "all" ? MBBS_RESOURCES.length : MBBS_RESOURCES.filter(r => r.subject === subId).length;
      const isActive = state.selectedSubject === subId ? "active" : "";

      return `
        <button type="button" class="filter-pill ${isActive}" data-subject="${subId}">
          ${label}
          <span class="pill-count">${count}</span>
        </button>
      `;
    }).join("");

    DOM.subjectFilters.querySelectorAll(".filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        state.selectedSubject = btn.dataset.subject;
        DOM.subjectFilters.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderCategoryPills(); // Keep categories in sync with the subject!
        applyFilterAndRender();
        updateHash();
      });
    });
  }

  // Render Category Filter Buttons (Dynamically discovers any new categories/folders!)
  function renderCategoryPills() {
    if (!DOM.categoryFilters) return;

    const scopeResources = state.selectedSubject === "all"
      ? MBBS_RESOURCES
      : MBBS_RESOURCES.filter(r => r.subject === state.selectedSubject);

    const foundCategories = new Set();
    scopeResources.forEach(r => {
      if (r.category) foundCategories.add(r.category.toLowerCase());
    });

    const baseCategories = ["notes", "assignments", "sdls", "practicals", "other"];
    const ordered = ["all"];
    baseCategories.forEach(c => {
      if (foundCategories.has(c)) ordered.push(c);
    });
    // Dynamically append any new categories (e.g. 'project', 'seminar', etc.)
    foundCategories.forEach(c => {
      if (!ordered.includes(c)) ordered.push(c);
    });

    // If current selected category doesn't exist in current scope, revert to 'all'
    if (state.selectedCategory !== "all" && !foundCategories.has(state.selectedCategory)) {
      state.selectedCategory = "all";
    }

    DOM.categoryFilters.innerHTML = ordered.map(catId => {
      const meta = CATEGORY_INFO[catId] || {
        label: formatName(catId),
        icon: ICONS[catId] || ICONS.notes
      };
      const label = catId === "all" ? "All Categories" : meta.label;
      const icon = catId === "all" ? "" : (meta.icon || ICONS.notes);
      const count = catId === "all"
        ? scopeResources.length
        : scopeResources.filter(r => r.category === catId).length;
      const isActive = state.selectedCategory === catId ? "active" : "";

      return `
        <button type="button" class="filter-pill ${isActive}" data-category="${catId}">
          ${icon}
          ${label}
          <span class="pill-count">${count}</span>
        </button>
      `;
    }).join("");

    DOM.categoryFilters.querySelectorAll(".filter-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        state.selectedCategory = btn.dataset.category;
        DOM.categoryFilters.querySelectorAll(".filter-pill").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilterAndRender();
      });
    });
  }

  // Update Hero Statistics
  function updateStatsCounters() {
    const total = MBBS_RESOURCES.length;
    const anatCount = MBBS_RESOURCES.filter(r => r.subject === "anatomy").length;
    const physCount = MBBS_RESOURCES.filter(r => r.subject === "physiology").length;
    const biocCount = MBBS_RESOURCES.filter(r => r.subject === "biochemistry").length;

    if (DOM.statTotal) DOM.statTotal.textContent = total;
    if (DOM.statAnatomy) DOM.statAnatomy.textContent = anatCount;
    if (DOM.statPhysiology) DOM.statPhysiology.textContent = physCount;
    if (DOM.statBiochem) DOM.statBiochem.textContent = biocCount;
  }

  // Filter Logic and Rendering
  function applyFilterAndRender() {
    const query = state.searchQuery.trim().toLowerCase();

    const filtered = MBBS_RESOURCES.filter(item => {
      // Subject match
      if (state.selectedSubject !== "all" && item.subject !== state.selectedSubject) {
        return false;
      }

      // Category match
      if (state.selectedCategory !== "all" && item.category !== state.selectedCategory) {
        return false;
      }

      // Search query match
      if (query) {
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const codeMatch = item.code.toLowerCase().includes(query);
        const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(query));
        const authorMatch = item.author.toLowerCase().includes(query);

        if (!titleMatch && !descMatch && !codeMatch && !tagsMatch && !authorMatch) {
          return false;
        }
      }

      return true;
    });

    renderCards(filtered);
    renderActiveFilterTags(filtered.length);
  }

  // Render Resource Cards Grid
  function renderCards(list) {
    if (!DOM.resourcesGrid) return;

    if (list.length === 0) {
      DOM.resourcesGrid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>No matching resources found</h3>
          <p>We couldn't find any documents matching your current search or category filter. Try refining your keywords or reset all filters.</p>
          <button type="button" class="btn-download" id="reset-filters-btn">
            Reset All Filters
          </button>
        </div>
      `;

      const resetBtn = document.getElementById("reset-filters-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", resetAllFilters);
      }
      return;
    }

    DOM.resourcesGrid.innerHTML = list.map(item => {
      const catMeta = CATEGORY_INFO[item.category] || { label: item.category, badgeClass: "badge-other", icon: "other" };
      const subMeta = SUBJECT_INFO[item.subject] || { name: item.subject };
      const categoryIcon = ICONS[item.category] || ICONS.notes;

      return `
        <article class="resource-card" data-id="${item.id}">
          <div class="card-top">
            <span class="subject-badge ${item.subject}">
              ● ${subMeta.name}
            </span>
            <span class="category-badge ${catMeta.badgeClass}">
              ${categoryIcon}
              ${catMeta.label}
            </span>
          </div>

          <span class="card-code">${escapeHtml(item.code)}</span>
          <h3 class="card-title">${highlightQuery(item.title, state.searchQuery)}</h3>
          <p class="card-desc">${highlightQuery(item.description, state.searchQuery)}</p>

          <div class="card-tags">
            ${item.tags.map(tag => `<span class="card-tag">#${escapeHtml(tag)}</span>`).join("")}
          </div>

          <div class="card-meta">
            <div class="meta-group">
              <span class="meta-item" title="File Size">
                ${ICONS.file}
                ${item.fileSize}
              </span>
              <span class="meta-item" title="Page Count">
                ${item.pages}
              </span>
            </div>
            <div class="meta-group">
              <span class="meta-item" title="Academic Year">
                ${ICONS.calendar}
                ${item.date}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button type="button" class="btn-view" data-action="view" data-id="${item.id}" aria-label="View ${escapeHtml(item.title)}">
              ${ICONS.view}
              <span>View PDF</span>
            </button>
            <a href="${item.fileUrl}" download class="btn-download" aria-label="Download ${escapeHtml(item.title)}">
              ${ICONS.download}
              <span>Download</span>
            </a>
          </div>
        </article>
      `;
    }).join("");

    // Attach click handlers to View buttons
    DOM.resourcesGrid.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        openPdfModal(id);
      });
    });
  }

  // Render Active Filter Tags & Count
  function renderActiveFilterTags(count) {
    if (DOM.resultsCount) {
      DOM.resultsCount.innerHTML = `Showing <strong>${count}</strong> of <strong>${MBBS_RESOURCES.length}</strong> resources`;
    }

    if (!DOM.activeFiltersContainer) return;

    const tags = [];

    if (state.selectedSubject !== "all") {
      const subName = SUBJECT_INFO[state.selectedSubject]?.name || formatName(state.selectedSubject);
      tags.push(`
        <span class="filter-tag">
          Subject: ${subName}
          <button type="button" class="filter-tag-remove" data-clear="subject" aria-label="Clear subject filter">×</button>
        </span>
      `);
    }

    if (state.selectedCategory !== "all") {
      const catName = CATEGORY_INFO[state.selectedCategory]?.label || formatName(state.selectedCategory);
      tags.push(`
        <span class="filter-tag">
          Type: ${catName}
          <button type="button" class="filter-tag-remove" data-clear="category" aria-label="Clear category filter">×</button>
        </span>
      `);
    }

    if (state.searchQuery.trim()) {
      tags.push(`
        <span class="filter-tag">
          Keyword: "${escapeHtml(state.searchQuery)}"
          <button type="button" class="filter-tag-remove" data-clear="search" aria-label="Clear search filter">×</button>
        </span>
      `);
    }

    if (tags.length > 0) {
      tags.push(`<button type="button" class="clear-all-btn" id="clear-all-tags-btn">Clear All</button>`);
      DOM.activeFiltersContainer.innerHTML = tags.join("");

      DOM.activeFiltersContainer.querySelectorAll(".filter-tag-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.clear;
          if (type === "subject") {
            state.selectedSubject = "all";
            renderSubjectPills();
          } else if (type === "category") {
            state.selectedCategory = "all";
            renderCategoryPills();
          } else if (type === "search") {
            state.searchQuery = "";
            if (DOM.searchInput) DOM.searchInput.value = "";
            if (DOM.searchClear) DOM.searchClear.style.display = "none";
          }
          applyFilterAndRender();
        });
      });

      const clearAll = document.getElementById("clear-all-tags-btn");
      if (clearAll) {
        clearAll.addEventListener("click", resetAllFilters);
      }
    } else {
      DOM.activeFiltersContainer.innerHTML = "";
    }
  }

  // Reset All Filters
  function resetAllFilters() {
    state.selectedSubject = "all";
    state.selectedCategory = "all";
    state.searchQuery = "";
    if (DOM.searchInput) DOM.searchInput.value = "";
    if (DOM.searchClear) DOM.searchClear.style.display = "none";
    renderSubjectPills();
    renderCategoryPills();
    applyFilterAndRender();
    updateHash();
  }

  // Update URL hash cleanly
  function updateHash() {
    if (state.selectedSubject !== "all") {
      window.history.replaceState(null, null, `#${state.selectedSubject}`);
    } else {
      window.history.replaceState(null, null, window.location.pathname);
    }
  }

  // Open PDF Modal Viewer
  function openPdfModal(id) {
    const item = MBBS_RESOURCES.find(r => r.id === id);
    if (!item || !DOM.pdfModal) return;

    state.activeModalResource = item;

    if (DOM.modalTitle) DOM.modalTitle.textContent = item.title;
    if (DOM.modalSubject) {
      const subName = SUBJECT_INFO[item.subject]?.name || item.subject;
      const catLabel = CATEGORY_INFO[item.category]?.label || item.category;
      DOM.modalSubject.textContent = `${subName} • ${catLabel} • ${item.code}`;
    }

    if (DOM.modalDownloadBtn) {
      DOM.modalDownloadBtn.setAttribute("href", item.fileUrl);
      DOM.modalDownloadBtn.setAttribute("download", "");
    }

    if (DOM.modalNewTabBtn) {
      DOM.modalNewTabBtn.setAttribute("href", item.fileUrl);
    }

    if (DOM.pdfFrame) {
      DOM.pdfFrame.setAttribute("src", item.fileUrl);
    }

    DOM.pdfModal.classList.add("active");
    DOM.pdfModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  // Close PDF Modal
  function closePdfModal() {
    if (!DOM.pdfModal) return;
    DOM.pdfModal.classList.remove("active");
    DOM.pdfModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (DOM.pdfFrame) {
      DOM.pdfFrame.setAttribute("src", "about:blank");
    }
    state.activeModalResource = null;
  }

  // Setup Global Event Listeners
  function setupEventListeners() {
    // Search input live filtering
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        if (DOM.searchClear) {
          DOM.searchClear.style.display = state.searchQuery ? "block" : "none";
        }
        applyFilterAndRender();
      });
    }

    // Clear search button
    if (DOM.searchClear) {
      DOM.searchClear.addEventListener("click", () => {
        state.searchQuery = "";
        DOM.searchInput.value = "";
        DOM.searchClear.style.display = "none";
        DOM.searchInput.focus();
        applyFilterAndRender();
      });
    }

    // Search form submission prevention
    if (DOM.searchForm) {
      DOM.searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        applyFilterAndRender();
      });
    }

    // Mobile nav hamburger toggle
    if (DOM.mobileToggle && DOM.navLinks) {
      DOM.mobileToggle.addEventListener("click", () => {
        DOM.navLinks.classList.toggle("show");
      });

      // Close mobile menu when clicking nav item
      DOM.navLinks.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
          DOM.navLinks.classList.remove("show");
        });
      });
    }

    // Subject quick cards click (in Hero / Showcase section)
    document.querySelectorAll("[data-navigate-subject]").forEach(elem => {
      elem.addEventListener("click", (e) => {
        e.preventDefault();
        const subject = elem.dataset.navigateSubject;
        state.selectedSubject = subject;
        renderSubjectPills();
        renderCategoryPills();
        applyFilterAndRender();
        updateHash();

        // Scroll down to resources section smoothly
        const catalog = document.getElementById("catalog-section");
        if (catalog) {
          catalog.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    // Modal Close button
    if (DOM.modalCloseBtn) {
      DOM.modalCloseBtn.addEventListener("click", closePdfModal);
    }

    // Close modal on click outside content
    if (DOM.pdfModal) {
      DOM.pdfModal.addEventListener("click", (e) => {
        if (e.target === DOM.pdfModal) {
          closePdfModal();
        }
      });
    }

    // Keyboard navigation (ESC closes modal)
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && DOM.pdfModal && DOM.pdfModal.classList.contains("active")) {
        closePdfModal();
      }
    });

    // Hash change listener
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (["anatomy", "physiology", "biochemistry"].includes(hash)) {
        state.selectedSubject = hash;
        renderSubjectPills();
        renderCategoryPills();
        applyFilterAndRender();
      }
    });
  }

  // Utilities
  function highlightQuery(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query.trim())})`, "gi");
    return escapedText.replace(regex, `<mark style="background-color: #fef08a; padding: 0.1em 0.25em; border-radius: 2px;">$1</mark>`);
  }

  function escapeHtml(string) {
    return String(string)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Auto-boot on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
