// Main Application Logic for Zimnaco Auto Forge

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE ──
    let state = {
        category: 'tires', // 'tires', 'rims', 'accessories'
        cart: JSON.parse(localStorage.getItem('zimnaco_cart')) || [],
        searchQuery: '',
        filters: {
            season: [],
            vehicleType: [],
            year: []
        },
        sortOrder: 'newest' // 'price-asc', 'price-desc', 'rating', 'newest'
    };

    // ── DOM ELEMENTS ──
    const productGrid = document.querySelector('.product-grid');
    const resultsTitle = document.querySelector('.results-title');
    const cartCountSpans = document.querySelectorAll('.nav-cart span, .mobile-cart span');
    
    // Add Modals to DOM
    document.body.insertAdjacentHTML('beforeend', `
        <!-- Cart Drawer -->
        <div class="cart-drawer-overlay" id="cartOverlay"></div>
        <div class="cart-drawer" id="cartDrawer">
            <div class="cart-header">
                <h2>Your Cart</h2>
                <button class="close-cart" id="closeCart">&times;</button>
            </div>
            <div class="cart-items" id="cartItems"></div>
            <div class="cart-footer">
                <div class="cart-subtotal">
                    <span>Subtotal</span>
                    <span id="cartTotal">$0.00</span>
                </div>
                <button class="btn btn--primary" style="width: 100%;" onclick="alert('Proceeding to secure checkout!')">Checkout Now</button>
            </div>
        </div>

        <!-- Product Detail Modal -->
        <div class="modal-overlay" id="productModalOverlay"></div>
        <div class="product-modal" id="productModal">
            <button class="close-modal" id="closeProductModal">&times;</button>
            <div class="product-modal-content" id="productModalContent"></div>
        </div>

        <!-- Mobile Nav Menu -->
        <div class="mobile-nav-overlay" id="mobileNavOverlay"></div>
        <div class="mobile-nav-drawer" id="mobileNavDrawer">
            <button class="close-mobile-nav" id="closeMobileNav">&times;</button>
            <div class="mobile-nav-links">
                <a href="#store" data-category="tires">Tires</a>
                <a href="#store" data-category="rims">Rims</a>
                <a href="#store" data-category="accessories">Accessories</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </div>
        </div>
    `);

    // ── RE-QUERY NEW DOM ELEMENTS ──
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');
    const productModalContent = document.getElementById('productModalContent');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');

    // ── INITIALIZATION ──
    initNav();
    initFilters();
    initSort();
    initSearch();
    initCartUI();
    renderProducts();

    // ── RENDER PRODUCTS ──
    function renderProducts() {
        if (!productGrid) return;
        
        let filtered = products.filter(p => {
            // Category Match
            if (p.category !== state.category) return false;
            
            // Search Match
            if (state.searchQuery) {
                const searchLower = state.searchQuery.toLowerCase();
                if (!p.title.toLowerCase().includes(searchLower) && !p.brand.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Filter Matches
            if (state.filters.season.length > 0 && !state.filters.season.includes(p.season)) return false;
            if (state.filters.vehicleType.length > 0 && !state.filters.vehicleType.includes(p.vehicleType)) return false;
            if (state.filters.year.length > 0 && !state.filters.year.includes(p.year.toString())) return false;

            return true;
        });

        // Sorting
        filtered.sort((a, b) => {
            if (state.sortOrder === 'price-asc') return a.price - b.price;
            if (state.sortOrder === 'price-desc') return b.price - a.price;
            if (state.sortOrder === 'rating') return b.rating - a.rating;
            // 'newest' defaults to ID desc
            return b.id - a.id; 
        });

        // Update counts
        if(resultsTitle) resultsTitle.innerHTML = `results <strong>(${filtered.length})</strong>`;
        
        // Build HTML
        if (filtered.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters.</p>
                    <button class="btn btn--secondary" onclick="document.querySelector('.nav-search input').value=''; document.querySelector('.nav-search input').dispatchEvent(new Event('input'))">Clear Search</button>
                </div>
            `;
            productGrid.style.display = 'block';
            return;
        }

        productGrid.style.display = 'grid';
        productGrid.innerHTML = filtered.map(p => `
            <div class="product-card reveal visible" data-id="${p.id}">
                <div class="card-image-wrap" onclick="openProductModal(${p.id})">
                    <div class="card-badge ${p.season === 'Summer' ? 'summer' : p.season === 'Winter' ? 'winter' : 'all'}">
                        ${p.season === 'Summer' ? '☀️' : p.season === 'Winter' ? '❄️' : '⛅'} ${p.season}
                    </div>
                    <img src="${p.image}" alt="${p.brand} ${p.title}" loading="lazy">
                </div>
                <div class="card-brand">${p.brand}</div>
                <div class="card-title" onclick="openProductModal(${p.id})">${p.title}</div>
                <div class="card-price-row">
                    <span class="price-main">$${Math.floor(p.price)}</span>
                    <span class="price-sub">.${(p.price % 1).toFixed(2).substring(2)}</span>
                    <span class="price-unit">per each</span>
                </div>
                <div class="card-rating">
                    <span class="stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
                    <span class="opinions">${p.reviews} reviews</span>
                </div>
                <button class="btn btn--accent add-to-cart-btn" data-id="${p.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>
                    Buy now
                </button>
            </div>
        `).join('');

        // Re-attach add to cart listeners
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                addToCart(id);
                e.stopPropagation();
            });
        });
    }

    // ── NAV LOGIC ──
    function initNav() {
        document.querySelectorAll('.nav-links a, .mobile-nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                if (category) {
                    state.category = category;
                    document.querySelectorAll('.nav-links a').forEach(a => a.style.color = 'var(--silver-400)');
                    e.target.style.color = 'var(--white)';
                    renderProducts();
                    closeMobileNavUI();
                }
            });
        });

        // Initialize proper first nav link
        const firstLink = document.querySelector('.nav-links a[data-category="tires"]');
        if (firstLink) firstLink.style.color = 'var(--white)';
        
        // Hamburger toggle
        const hamburger = document.querySelector('.hamburger-menu');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                mobileNavDrawer.classList.add('active');
                mobileNavOverlay.classList.add('active');
            });
        }

        document.getElementById('closeMobileNav').addEventListener('click', closeMobileNavUI);
        mobileNavOverlay.addEventListener('click', closeMobileNavUI);
    }

    function closeMobileNavUI() {
        mobileNavDrawer.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
    }

    // ── SEARCH LOGIC ──
    function initSearch() {
        const searchInput = document.querySelector('.nav-search input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                renderProducts();
            });
        }
    }

    // ── SORT LOGIC ──
    function initSort() {
        const sortSelect = document.getElementById('sortSelect');
        if(sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                state.sortOrder = e.target.value;
                renderProducts();
            });
        }
    }

    // ── FILTER LOGIC (Data driven instead of static) ──
    function initFilters() {
        const filterCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
        filterCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const group = e.target.closest('.filter-group').getAttribute('data-filter-group');
                const val = e.target.value;
                
                if (e.target.checked) {
                    state.filters[group].push(val);
                } else {
                    state.filters[group] = state.filters[group].filter(v => v !== val);
                }
                updateActiveFilterTags();
                renderProducts();
            });
            // Initial read
            if (cb.checked) {
                const group = cb.closest('.filter-group').getAttribute('data-filter-group');
                state.filters[group].push(cb.value);
            }
        });
        updateActiveFilterTags();
    }

    function updateActiveFilterTags() {
        const activeFiltersRow = document.querySelector('.active-filters-row');
        if (!activeFiltersRow) return;
        
        let html = '';
        Object.keys(state.filters).forEach(groupKey => {
            if (state.filters[groupKey].length > 0) {
                const groupName = groupKey === 'vehicleType' ? 'Vehicle Type' : groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
                html += `<div class="filter-category">
                    <span class="cat-name">${groupName} (${state.filters[groupKey].length}):</span>
                    ${state.filters[groupKey].map(val => `
                        <span class="active-tag" data-group="${groupKey}" data-val="${val}">
                            ${val} <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                    `).join('')}
                </div>`;
            }
        });
        
        activeFiltersRow.innerHTML = html;
        if(html === '') {
            activeFiltersRow.style.display = 'none';
        } else {
            activeFiltersRow.style.display = 'flex';
        }

        // Attach removal listeners
        activeFiltersRow.querySelectorAll('.active-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const group = e.currentTarget.getAttribute('data-group');
                const val = e.currentTarget.getAttribute('data-val');
                // Uncheck checkbox
                const cb = document.querySelector(`.sidebar .filter-group[data-filter-group="${group}"] input[value="${val}"]`);
                if(cb) cb.checked = false;
                // Update state
                state.filters[group] = state.filters[group].filter(v => v !== val);
                updateActiveFilterTags();
                renderProducts();
            });
        });
    }

    // ── CART LOGIC ──
    function initCartUI() {
        document.querySelectorAll('.nav-cart, .mobile-cart').forEach(btn => {
            btn.addEventListener('click', openCart);
        });
        document.getElementById('closeCart').addEventListener('click', closeCart);
        cartOverlay.addEventListener('click', closeCart);
        updateCartCount();
    }

    function addToCart(productId, quantity = 1) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            state.cart.push({ ...product, quantity });
        }
        
        saveCart();
        updateCartCount();
        openCart(); // Show cart when item added
    }

    function removeFromCart(productId) {
        state.cart = state.cart.filter(item => item.id !== productId);
        saveCart();
        updateCartCount();
        renderCartItems();
    }

    function updateQuantity(productId, delta) {
        const item = state.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart();
                updateCartCount();
                renderCartItems();
            }
        }
    }

    function saveCart() {
        localStorage.setItem('zimnaco_cart', JSON.stringify(state.cart));
    }

    function updateCartCount() {
        const count = state.cart.reduce((acc, item) => acc + item.quantity, 0);
        cartCountSpans.forEach(span => {
            span.textContent = `Your cart (${count})`;
            if(span.closest('.mobile-cart')) span.textContent = count; 
        });
    }

    window.openCart = function() {
        renderCartItems();
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
    };

    function closeCart() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
    }

    function renderCartItems() {
        if (state.cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is currently empty.</div>';
            cartTotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        cartItemsContainer.innerHTML = state.cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="cart-item-info">
                        <h4>${item.brand} ${item.title}</h4>
                        <div class="cart-item-details">${item.size}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-quantity">
                            <button onclick="updateCartQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    // Expose for inline HTML handlers in strings
    window.updateCartQuantity = updateQuantity;

    // ── PRODUCT DETAIL MODAL ──
    window.openProductModal = function(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        productModalContent.innerHTML = `
            <div class="modal-product-layout">
                <div class="modal-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="modal-info">
                    <div class="modal-brand">${product.brand}</div>
                    <h2 class="modal-title">${product.title}</h2>
                    <div class="card-rating" style="margin-bottom: 20px;">
                        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                        <span class="opinions">${product.reviews} reviews</span>
                    </div>
                    <div class="modal-price">$${product.price.toFixed(2)}</div>
                    
                    <p class="modal-desc">${product.description}</p>
                    
                    <div class="specs-table">
                        <div class="spec-row"><span>Category:</span><span>${product.category}</span></div>
                        <div class="spec-row"><span>Season:</span><span>${product.season}</span></div>
                        <div class="spec-row"><span>Vehicle Type:</span><span>${product.vehicleType}</span></div>
                        <div class="spec-row"><span>Size:</span><span>${product.size}</span></div>
                        <div class="spec-row"><span>Production Year:</span><span>${product.year}</span></div>
                    </div>

                    <div class="modal-actions">
                        <div class="qty-selector">
                            <select id="modalQty">
                                ${[1,2,3,4,5,6,8,12].map(n => `<option value="${n}">${n}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn--primary" style="flex: 1;" onclick="addToCartFromModal(${product.id})">Add to Cart</button>
                    </div>
                    
                    <div class="trust-signals-mini">
                        <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Secure Checkout</span>
                        <span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg> 30-Day Guarantee</span>
                    </div>
                </div>
            </div>
        `;

        productModal.classList.add('active');
        productModalOverlay.classList.add('active');
    };

    window.addToCartFromModal = function(id) {
        const qty = parseInt(document.getElementById('modalQty').value);
        addToCart(id, qty);
        closeProductDetailsModal();
    };

    function closeProductDetailsModal() {
        productModal.classList.remove('active');
        productModalOverlay.classList.remove('active');
    }

    document.getElementById('closeProductModal').addEventListener('click', closeProductDetailsModal);
    productModalOverlay.addEventListener('click', closeProductDetailsModal);

}); // End DOMContentLoaded
