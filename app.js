// Main Application Logic for Zimnaco Auto Forge

document.addEventListener('DOMContentLoaded', () => {
    // ── STATE ──
    let state = {
        category: 'tires',
        cart: JSON.parse(localStorage.getItem('zimnaco_cart')) || [],
        searchQuery: '',
        filters: {
            season: [],
            vehicleType: [],
            year: []
        },
        sizeFilter: {
            width: '',
            ratio: '',
            rim: ''
        },
        maxPrice: 2000,
        sortOrder: 'newest'
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
                <button class="btn btn--primary" style="width: 100%;" onclick="processDemoCheckout()">Checkout Now</button>
            </div>
        </div>

        <!-- Product Detail Modal -->
        <div class="modal-overlay" id="productModalOverlay"></div>
        <div class="product-modal" id="productModal">
            <button class="close-modal" id="closeProductModal">&times;</button>
            <div class="product-modal-content" id="productModalContent"></div>
        </div>
    `);

    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const productModal = document.getElementById('productModal');
    const productModalOverlay = document.getElementById('productModalOverlay');
    const productModalContent = document.getElementById('productModalContent');

    // ── INITIALIZATION ──
    initNav();
    initFilters();
    initSort();
    initSearch();
    initCartUI();
    renderProducts();

    // ── DATA FORMATTING ──
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

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

            // Price Match
            if (p.price > state.maxPrice) return false;

            // Size Matcher
            if (state.sizeFilter.width && !p.size.includes(state.sizeFilter.width)) return false;
            if (state.sizeFilter.ratio && !p.size.includes(state.sizeFilter.ratio)) return false;
            if (state.sizeFilter.rim && !p.size.includes(state.sizeFilter.rim)) return false;

            // Checkbox Filter Matches
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
            // 'newest' uses ID desc
            return b.id - a.id; 
        });

        // Update counts
        if(resultsTitle) {
            resultsTitle.innerHTML = `results (${filtered.length})`;
            resultsTitle.style.opacity = '1';
        }
        
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
                <div class="card-brand">${capitalize(p.brand)}</div>
                <div class="card-title" onclick="openProductModal(${p.id})">${p.title}</div>
                <div class="card-price-row">
                    <span class="price-main">$${p.price.toFixed(2)}</span>
                    <span class="price-unit">per each</span>
                </div>
                <div class="card-rating">
                    <span class="stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
                    <span class="opinions">${p.reviews} reviews</span>
                </div>
                <button class="btn btn--accent add-to-cart-btn" data-id="${p.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>
                    <span>Buy now</span>
                </button>
            </div>
        `).join('');

        // Re-attach add to cart listeners
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnEl = e.currentTarget;
                const id = parseInt(btnEl.getAttribute('data-id'));
                
                // Button Animation
                const span = btnEl.querySelector('span');
                const originalText = span.textContent;
                btnEl.classList.add('added');
                span.textContent = 'Added ✓';
                
                setTimeout(() => {
                    addToCart(id);
                    btnEl.classList.remove('added');
                    span.textContent = originalText;
                }, 800);
                
                e.stopPropagation();
            });
        });
    }

    // ── NAV LOGIC ──
    function initNav() {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-category');
                if (category) {
                    state.category = category;
                    document.querySelectorAll('.nav-links a').forEach(a => a.style.color = 'var(--silver-400)');
                    e.target.style.color = 'var(--white)';
                    renderProducts();
                    
                    // Smooth scroll to store
                    const storeSection = document.getElementById('store');
                    if(storeSection) {
                        storeSection.scrollIntoView({behavior: 'smooth', block: 'start'});
                    }
                }
            });
        });

        const firstLink = document.querySelector('.nav-links a[data-category="tires"]');
        if (firstLink) firstLink.style.color = 'var(--white)';
        
        // Prevent default hash jumps on footer links
        document.querySelectorAll('.footer-col a').forEach(a => {
            a.addEventListener('click', (e) => { e.preventDefault(); });
        });
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

        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchBar = document.getElementById('mobileSearchBar');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        if(mobileSearchBtn && mobileSearchBar) {
            mobileSearchBtn.addEventListener('click', () => {
                mobileSearchBar.classList.toggle('active');
                if (mobileSearchBar.classList.contains('active')) mobileSearchInput.focus();
            });
            mobileSearchInput.addEventListener('input', (e) => {
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

    // ── FILTER LOGIC ──
    function initFilters() {
        // Collapsible headers
        document.querySelectorAll('.filter-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const group = e.currentTarget.closest('.filter-group');
                group.classList.toggle('collapsed');
            });
        });

        // Checkboxes
        const filterCheckboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
        filterCheckboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const group = e.target.closest('.filter-group').getAttribute('data-filter-group');
                const val = e.target.value;
                if (e.target.checked) state.filters[group].push(val);
                else state.filters[group] = state.filters[group].filter(v => v !== val);
                updateActiveFilterTags();
                renderProducts();
            });
            if (cb.checked) {
                const group = cb.closest('.filter-group').getAttribute('data-filter-group');
                state.filters[group].push(cb.value);
            }
        });

        // Size Matcher
        ['sizeWidth', 'sizeRatio', 'sizeRim'].forEach(id => {
            const select = document.getElementById(id);
            if(select) {
                select.addEventListener('change', (e) => {
                    const type = id.replace('size', '').toLowerCase();
                    state.sizeFilter[type] = e.target.value === '' ? '' : e.target.value;
                    renderProducts();
                });
            }
        });

        // Price Filter
        const priceRange = document.getElementById('priceRange');
        const priceLabel = document.getElementById('priceLabel');
        if(priceRange && priceLabel) {
            priceRange.addEventListener('input', (e) => {
                state.maxPrice = parseInt(e.target.value);
                priceLabel.textContent = '$' + state.maxPrice;
                renderProducts();
            });
        }

        updateActiveFilterTags();
    }

    function updateActiveFilterTags() {
        const activeFiltersRow = document.querySelector('.active-filters-row');
        if (!activeFiltersRow) return;
        
        let html = '';
        Object.keys(state.filters).forEach(groupKey => {
            if (state.filters[groupKey].length > 0) {
                const groupName = groupKey === 'vehicleType' ? 'Vehicle Type' : capitalize(groupKey);
                html += `<div class="filter-category">
                    <span class="cat-name">${groupName} (${state.filters[groupKey].length}):</span>
                    ${state.filters[groupKey].map(val => `
                        <span class="active-tag" data-group="${groupKey}" data-val="${val}">
                            ${capitalize(val)} <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </span>
                    `).join('')}
                </div>`;
            }
        });
        
        activeFiltersRow.innerHTML = html;
        activeFiltersRow.style.display = html === '' ? 'none' : 'flex';

        activeFiltersRow.querySelectorAll('.active-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const group = e.currentTarget.getAttribute('data-group');
                const val = e.currentTarget.getAttribute('data-val');
                const cb = document.querySelector(`.sidebar .filter-group[data-filter-group="${group}"] input[value="${val}"]`);
                if(cb) cb.checked = false;
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
        
        // Cart Icon Bounce Animation
        document.querySelectorAll('.nav-cart, .mobile-cart').forEach(cart => {
            cart.classList.add('bounce');
            setTimeout(() => cart.classList.remove('bounce'), 300);
        });

        openCart();
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
            if(span.closest('.mobile-cart')) span.textContent = count; 
            else span.textContent = `Your cart (${count})`;
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
                    <div class="modal-brand">${capitalize(product.brand)}</div>
                    <h2 class="modal-title">${product.title}</h2>
                    <div class="card-rating" style="margin-bottom: 20px;">
                        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
                        <span class="opinions">${product.reviews} reviews</span>
                    </div>
                    <div class="modal-price">$${product.price.toFixed(2)}</div>
                    
                    <p class="modal-desc">${product.description}</p>
                    
                    <div class="specs-table">
                        <div class="spec-row"><span>Category:</span><span>${capitalize(product.category)}</span></div>
                        <div class="spec-row"><span>Season:</span><span>${capitalize(product.season)}</span></div>
                        <div class="spec-row"><span>Vehicle Type:</span><span>${capitalize(product.vehicleType)}</span></div>
                        <div class="spec-row"><span>Size:</span><span>${product.size}</span></div>
                        <div class="spec-row"><span>Production Year:</span><span>${product.year}</span></div>
                    </div>

                    ${product.category === 'tires' ? `
                    <div class="tire-diagram">
                        <svg viewBox="0 0 100 100" width="40" height="40" stroke="currentColor" fill="none" stroke-width="2">
                           <circle cx="50" cy="50" r="40"/>
                           <circle cx="50" cy="50" r="20"/>
                           <path d="M 10 50 L 30 50 M 70 50 L 90 50"/>
                        </svg>
                        <span>Size Decode: ${product.size} indicates Width/Ratio and Rim Diameter (R).</span>
                    </div>` : ''}

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

    // ── DEMO CHECKOUT ──
    window.processDemoCheckout = function() {
        if(state.cart.length === 0) return;
        const btn = document.querySelector('.cart-footer .btn--primary');
        const originalText = btn.textContent;
        btn.textContent = 'Processing Securely...';
        btn.style.opacity = '0.7';
        
        setTimeout(() => {
            state.cart = [];
            saveCart();
            updateCartCount();
            renderCartItems();
            btn.textContent = 'Order Confirmed - Thank You!';
            btn.style.backgroundColor = 'var(--accent-green)';
            btn.style.color = 'white';
            
            setTimeout(() => {
                closeCart();
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.backgroundColor = '';
                    btn.style.opacity = '1';
                }, 500);
            }, 2000);
        }, 1500);
    };

}); // End DOMContentLoaded
