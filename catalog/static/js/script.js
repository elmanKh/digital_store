(function () {
    const lang = document.body.dataset.lang || "en";

    const grid = document.getElementById("productsGrid");
    const searchInput = document.getElementById("searchInput");
    const categoryTiles = document.querySelectorAll(".category-tile");
    const sortSelect = document.getElementById("sortSelect");
    const cards = Array.from(document.querySelectorAll("#productsGrid .card"));
    const resultsCountEl = document.getElementById("resultsCount");
    const resetFiltersBtn = document.getElementById("resetFiltersBtn");
    const emptyFilterBox = document.getElementById("emptyFilterState");

    function detectCategory(card) {
        if (card.dataset.category) {
            return card.dataset.category;
        }
        const combined = ((card.dataset.title || "") + " " + (card.dataset.desc || "")).toLowerCase();
        if (combined.includes("book") || combined.includes("guide") || combined.includes("kitab")) {
            return "ebook";
        }
        if (combined.includes("ui") || combined.includes("design") || combined.includes("figma") || combined.includes("dizayn")) {
            return "ui";
        }
        return "template";
    }

    cards.forEach(function (card, index) {
        card.dataset.originalIndex = String(index);
        const resolvedCat = detectCategory(card);
        card.dataset.category = resolvedCat;

        const banner = card.querySelector(".card-banner");
        const badge = card.querySelector(".banner-badge");
        const icon = card.querySelector(".banner-icon");
        const tag = card.querySelector(".product-category-tag");

        if (banner && badge && icon && tag) {
            banner.classList.remove("banner-ebook", "banner-template", "banner-ui");
            if (resolvedCat === "ebook") {
                banner.classList.add("banner-ebook");
                badge.textContent = (lang === "az") ? "E-KİTAB • PDF + KOD" : "E-BOOK • PDF + CODE";
                icon.textContent = "📘";
                tag.textContent = (lang === "az") ? "E-Kitablar" : "E-Books";
            } else if (resolvedCat === "ui") {
                banner.classList.add("banner-ui");
                badge.textContent = (lang === "az") ? "UI & DİZAYN RESURSU" : "UI & DESIGN ASSET";
                icon.textContent = "🎨";
                tag.textContent = (lang === "az") ? "UI & Dizayn" : "UI & Design";
            } else {
                banner.classList.add("banner-template");
                badge.textContent = (lang === "az") ? "KOD ŞABLONU" : "CODE TEMPLATE";
                icon.textContent = "🧩";
                tag.textContent = (lang === "az") ? "Kod Şablonları" : "Code Templates";
            }
        }
    });

    let activeCategory = "all";

    function updateResultsCount(visibleCount) {
        if (!resultsCountEl) {
            return;
        }
        resultsCountEl.textContent = (lang === "az")
            ? ("Göstərilən məhsullar: " + visibleCount)
            : ("Showing products: " + visibleCount);
    }

    function applyFiltersAndSort() {
        const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
        const sortMode = sortSelect ? sortSelect.value : "default";

        const orderedCards = cards.slice().sort(function (a, b) {
            const priceA = parseFloat(a.dataset.price || "0");
            const priceB = parseFloat(b.dataset.price || "0");
            const idxA = parseInt(a.dataset.originalIndex || "0", 10);
            const idxB = parseInt(b.dataset.originalIndex || "0", 10);

            if (sortMode === "price-asc") {
                return priceA - priceB;
            }
            if (sortMode === "price-desc") {
                return priceB - priceA;
            }
            return idxA - idxB;
        });

        if (grid) {
            orderedCards.forEach(function (card) {
                grid.appendChild(card);
            });
        }

        let visibleCount = 0;

        orderedCards.forEach(function (card) {
            const category = card.dataset.category || "all";
            const title = card.dataset.title || "";
            const desc = card.dataset.desc || "";

            const matchesCategory = (activeCategory === "all") || (category === activeCategory);
            const matchesQuery = !query || title.includes(query) || desc.includes(query);

            if (matchesCategory && matchesQuery) {
                card.style.display = "flex";
                visibleCount += 1;
            } else {
                card.style.display = "none";
            }
        });

        updateResultsCount(visibleCount);

        const hasActiveFilter = Boolean(query) || activeCategory !== "all" || sortMode !== "default";
        if (resetFiltersBtn) {
            resetFiltersBtn.style.display = hasActiveFilter ? "inline-block" : "none";
        }

        if (emptyFilterBox) {
            emptyFilterBox.style.display = (visibleCount === 0) ? "block" : "none";
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", applyFiltersAndSort);
    }

    categoryTiles.forEach(function (tile) {
        tile.addEventListener("click", function () {
            categoryTiles.forEach(function (t) {
                t.classList.remove("active");
            });
            tile.classList.add("active");
            activeCategory = tile.dataset.category || "all";
            applyFiltersAndSort();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", applyFiltersAndSort);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", function () {
            if (searchInput) {
                searchInput.value = "";
            }
            activeCategory = "all";
            categoryTiles.forEach(function (t) {
                t.classList.toggle("active", t.dataset.category === "all");
            });
            if (sortSelect) {
                sortSelect.value = "default";
            }
            applyFiltersAndSort();
        });
    }

    applyFiltersAndSort();

    // Buy It Now / İndi Al modal məntiqi
    const modal = document.getElementById("buyModal");
    const modalTitleEl = document.getElementById("modalProductName");
    const modalPriceEl = document.getElementById("modalProductPrice");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("orderForm");
    const emailInput = document.getElementById("buyerEmail");
    const successBox = document.getElementById("orderSuccessBox");

    if (!modal || !form) {
        return;
    }

    function openModal(title, price) {
        modalTitleEl.textContent = title;
        modalPriceEl.textContent = "$" + price;
        form.style.display = "block";
        form.reset();
        successBox.style.display = "none";
        successBox.textContent = "";
        modal.classList.add("active");
        if (emailInput) {
            emailInput.focus();
        }
    }

    function closeModal() {
        modal.classList.remove("active");
    }

    document.querySelectorAll(".buy-now-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            openModal(btn.dataset.title, btn.dataset.price);
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }

    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        form.style.display = "none";
        successBox.style.display = "block";
        successBox.textContent = (lang === "az")
            ? ("Sifariş qeydə alındı! Məhsul: " + modalTitleEl.textContent + " (" + modalPriceEl.textContent + ") — E-poçt: " + email)
            : ("Order confirmed! Item: " + modalTitleEl.textContent + " (" + modalPriceEl.textContent + ") — Email: " + email);
    });
})();