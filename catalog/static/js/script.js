(function () {
    const lang = document.body.dataset.lang || "en";
    const CART_STORAGE_KEY = "digital_store_cart_v1";

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
            emptyFilterBox.style.display = (cards.length > 0 && visibleCount === 0) ? "block" : "none";
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

    // Səbət (Cart) məntiqi — gələcək Django Cart modelinə uyğun strukturla
    function loadCart() {
        try {
            const raw = localStorage.getItem(CART_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            return [];
        }
    }

    function saveCart(items) {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (err) {
            // Storage məhdudlaşdırıldıqda səssiz keç
        }
    }

    let cartItems = loadCart();

    const cartCountBadge = document.getElementById("cartCountBadge");
    const openCartBtn = document.getElementById("openCartBtn");
    const cartModal = document.getElementById("cartModal");
    const closeCartModalBtn = document.getElementById("closeCartModalBtn");
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const cartTotalPriceEl = document.getElementById("cartTotalPrice");
    const clearCartBtn = document.getElementById("clearCartBtn");
    const proceedCartCheckoutBtn = document.getElementById("proceedCartCheckoutBtn");

    function getCartTotal() {
        return cartItems.reduce(function (sum, item) {
            return sum + (parseFloat(item.price || "0") * (item.qty || 1));
        }, 0);
    }

    function updateCartUI() {
        const totalQty = cartItems.reduce(function (sum, item) {
            return sum + (item.qty || 1);
        }, 0);

        if (cartCountBadge) {
            cartCountBadge.textContent = String(totalQty);
        }

        if (!cartItemsContainer || !cartTotalPriceEl) {
            return;
        }

        if (cartItems.length === 0) {
            cartItemsContainer.innerHTML = (lang === "az")
                ? '<div class="empty-filter-box">Səbətiniz hazırda boşdur.</div>'
                : '<div class="empty-filter-box">Your cart is currently empty.</div>';
            cartTotalPriceEl.textContent = "$0.00";
            return;
        }

        cartItemsContainer.innerHTML = cartItems.map(function (item, idx) {
            const lineTotal = (parseFloat(item.price || "0") * (item.qty || 1)).toFixed(2);
            const qtyLabel = (lang === "az") ? "Say" : "Qty";
            const removeLabel = (lang === "az") ? "Sil" : "Remove";
            return (
                '<div class="cart-item-row">' +
                    '<div>' +
                        '<div class="cart-item-title">' + item.title + '</div>' +
                        '<div class="cart-item-meta">' + qtyLabel + ': ' + (item.qty || 1) + ' &bull; $' + lineTotal + '</div>' +
                    '</div>' +
                    '<button type="button" class="cart-remove-btn" data-cart-index="' + idx + '">' + removeLabel + '</button>' +
                '</div>'
            );
        }).join("");

        cartTotalPriceEl.textContent = "$" + getCartTotal().toFixed(2);

        cartItemsContainer.querySelectorAll(".cart-remove-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                const idx = parseInt(btn.dataset.cartIndex || "-1", 10);
                if (idx >= 0 && idx < cartItems.length) {
                    cartItems.splice(idx, 1);
                    saveCart(cartItems);
                    updateCartUI();
                }
            });
        });
    }

    function addToCart(productId, title, price) {
        const numericPrice = parseFloat(price || "0").toFixed(2);
        const existing = cartItems.find(function (item) {
            return String(item.productId) === String(productId) && item.title === title;
        });
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            cartItems.push({
                productId: productId || "",
                title: title,
                price: numericPrice,
                qty: 1
            });
        }
        saveCart(cartItems);
        updateCartUI();
    }

    document.querySelectorAll(".add-to-cart-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            addToCart(btn.dataset.productId, btn.dataset.title, btn.dataset.price);
            btn.textContent = (lang === "az") ? "Səbətdə ✓" : "Added ✓";
            setTimeout(function () {
                btn.textContent = (lang === "az") ? "Səbətə at" : "Add to Cart";
            }, 900);
        });
    });

    function openCartModal() {
        if (!cartModal) {
            return;
        }
        updateCartUI();
        cartModal.classList.add("active");
    }

    function closeCartModal() {
        if (!cartModal) {
            return;
        }
        cartModal.classList.remove("active");
    }

    if (openCartBtn) {
        openCartBtn.addEventListener("click", openCartModal);
    }

    if (closeCartModalBtn) {
        closeCartModalBtn.addEventListener("click", closeCartModal);
    }

    if (cartModal) {
        cartModal.addEventListener("click", function (e) {
            if (e.target === cartModal) {
                closeCartModal();
            }
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", function () {
            cartItems = [];
            saveCart(cartItems);
            updateCartUI();
        });
    }

    updateCartUI();

    // Sifariş / Checkout modal məntiqi
    const modal = document.getElementById("buyModal");
    const modalTitleEl = document.getElementById("modalProductName");
    const modalPriceEl = document.getElementById("modalProductPrice");
    const orderProductIdEl = document.getElementById("orderProductId");
    const orderSourceModeEl = document.getElementById("orderSourceMode");
    const closeBtn = document.getElementById("closeModalBtn");
    const cancelBtn = document.getElementById("cancelModalBtn");
    const form = document.getElementById("orderForm");
    const emailInput = document.getElementById("buyerEmail");
    const successBox = document.getElementById("orderSuccessBox");

    function openOrderModal(options) {
        if (!modal || !form) {
            return;
        }
        modalTitleEl.textContent = options.title;
        modalPriceEl.textContent = "$" + parseFloat(options.price || "0").toFixed(2);
        if (orderProductIdEl) {
            orderProductIdEl.value = options.productId || "";
        }
        if (orderSourceModeEl) {
            orderSourceModeEl.value = options.sourceMode || "single";
        }
        form.style.display = "block";
        form.reset();
        if (successBox) {
            successBox.style.display = "none";
            successBox.textContent = "";
        }
        modal.classList.add("active");
        if (emailInput) {
            emailInput.focus();
        }
    }

    function closeOrderModal() {
        if (!modal) {
            return;
        }
        modal.classList.remove("active");
    }

    document.querySelectorAll(".buy-now-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            openOrderModal({
                productId: btn.dataset.productId || "",
                title: btn.dataset.title || "",
                price: btn.dataset.price || "0.00",
                sourceMode: "single"
            });
        });
    });

    if (proceedCartCheckoutBtn) {
        proceedCartCheckoutBtn.addEventListener("click", function () {
            if (cartItems.length === 0) {
                return;
            }
            const summaryTitle = cartItems.map(function (item) {
                return item.title + " x" + (item.qty || 1);
            }).join(", ");
            closeCartModal();
            openOrderModal({
                productId: "",
                title: summaryTitle,
                price: getCartTotal().toFixed(2),
                sourceMode: "cart"
            });
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeOrderModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeOrderModal);
    }

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === modal) {
                closeOrderModal();
            }
        });
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            // Backend endpoint hələ tam qoşulmadığından ön tərəf xülasəsi göstərir;
            // Mərhələ 3-də /orders/create/ ilə real bazaya bağlanacaq.
            e.preventDefault();
            const email = emailInput ? emailInput.value.trim() : "";
            form.style.display = "none";
            if (successBox) {
                successBox.style.display = "block";
                successBox.textContent = (lang === "az")
                    ? ("Sifariş sorğusu hazırlandı! Məhsul: " + modalTitleEl.textContent + " (" + modalPriceEl.textContent + ") — E-poçt: " + email)
                    : ("Order request prepared! Item: " + modalTitleEl.textContent + " (" + modalPriceEl.textContent + ") — Email: " + email);
            }
            if (orderSourceModeEl && orderSourceModeEl.value === "cart") {
                cartItems = [];
                saveCart(cartItems);
                updateCartUI();
            }
        });
    }

    // Login / Register modal məntiqi
    const authModal = document.getElementById("authModal");
    const openLoginBtn = document.getElementById("openLoginBtn");
    const openRegisterBtn = document.getElementById("openRegisterBtn");
    const closeAuthModalBtn = document.getElementById("closeAuthModalBtn");
    const cancelAuthModalBtn = document.getElementById("cancelAuthModalBtn");
    const tabLoginBtn = document.getElementById("tabLoginBtn");
    const tabRegisterBtn = document.getElementById("tabRegisterBtn");
    const authModeInput = document.getElementById("authModeInput");
    const registerEmailGroup = document.getElementById("registerEmailGroup");
    const authEmailInput = document.getElementById("authEmail");
    const submitAuthBtn = document.getElementById("submitAuthBtn");
    const authForm = document.getElementById("authForm");

    function setAuthMode(mode) {
        const isRegister = mode === "register";
        if (authModeInput) {
            authModeInput.value = isRegister ? "register" : "login";
        }
        if (tabLoginBtn) {
            tabLoginBtn.classList.toggle("active", !isRegister);
        }
        if (tabRegisterBtn) {
            tabRegisterBtn.classList.toggle("active", isRegister);
        }
        if (registerEmailGroup) {
            registerEmailGroup.style.display = isRegister ? "block" : "none";
        }
        if (authEmailInput) {
            authEmailInput.required = isRegister;
        }
        if (authForm) {
            authForm.action = isRegister ? "/accounts/register/" : "/accounts/login/";
        }
        if (submitAuthBtn) {
            if (isRegister) {
                submitAuthBtn.textContent = (lang === "az") ? "Qeydiyyatdan keç" : "Register";
            } else {
                submitAuthBtn.textContent = (lang === "az") ? "Daxil ol" : "Login";
            }
        }
    }

    function openAuthModal(mode) {
        if (!authModal) {
            return;
        }
        setAuthMode(mode || "login");
        authModal.classList.add("active");
    }

    function closeAuthModal() {
        if (!authModal) {
            return;
        }
        authModal.classList.remove("active");
    }

    if (openLoginBtn) {
        openLoginBtn.addEventListener("click", function () {
            openAuthModal("login");
        });
    }

    if (openRegisterBtn) {
        openRegisterBtn.addEventListener("click", function () {
            openAuthModal("register");
        });
    }

    if (tabLoginBtn) {
        tabLoginBtn.addEventListener("click", function () {
            setAuthMode("login");
        });
    }

    if (tabRegisterBtn) {
        tabRegisterBtn.addEventListener("click", function () {
            setAuthMode("register");
        });
    }

    if (closeAuthModalBtn) {
        closeAuthModalBtn.addEventListener("click", closeAuthModal);
    }

    if (cancelAuthModalBtn) {
        cancelAuthModalBtn.addEventListener("click", closeAuthModal);
    }

    if (authModal) {
        authModal.addEventListener("click", function (e) {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
})();
