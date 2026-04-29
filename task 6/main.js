const brandPool = ["Nova", "Stride", "PureFarm", "MobiTech", "Denwer", "Leafy", "GameX", "UrbanCot", "BoomBox"];
const fallbackImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=80";

// 1. Global State Variables
let products = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let currentPage = 1;
let selectedCategoryChip = "all";
let isLoading = false;
const itemsPerPage = 8;

// 2. DOM Elements
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const ratingChecks = document.querySelectorAll('input[name="rating"]');
const brandChecks = document.querySelectorAll('input[name="brand"]');
const clearFiltersBtn = document.getElementById('clearFilters');
const quickChips = document.querySelectorAll('.quick-chip');
const apiStatus = document.getElementById('apiStatus');
const loadingState = document.getElementById('loadingState');
const productForm = document.getElementById('productForm');
const productFormSubmit = document.getElementById('productFormSubmit');
const productTitleInput = document.getElementById('productTitle');
const productPriceInput = document.getElementById('productPrice');
const productCategoryInput = document.getElementById('productCategory');
const productBrandInput = document.getElementById('productBrand');
const productImageInput = document.getElementById('productImage');
const productDescriptionInput = document.getElementById('productDescription');

function normalizeProduct(product, index = 0) {
    const sourceCategory = String(product.category || "").toLowerCase();
    let category = "Fashion";

    if (sourceCategory.includes("electronics")) {
        category = "Electronics";
    } else if (sourceCategory.includes("jewel") || sourceCategory.includes("clothing")) {
        category = index % 2 === 0 ? "Fashion" : "Grocery";
    } else if (index % 3 === 0) {
        category = "Grocery";
    }

    const price = Number(product.price) || 0;
    const rating = Number((product.rating && product.rating.rate) ? product.rating.rate : product.rating || 4);
    const mrp = Math.max(price + Math.round(price * 0.4), price + 50);

    return {
        id: Number(product.id),
        title: product.title || "Untitled Product",
        price,
        category,
        brand: product.brand || brandPool[index % brandPool.length],
        rating: Number(rating.toFixed(1)),
        mrp,
        assured: product.assured ?? rating >= 4,
        image: product.image || fallbackImage,
        description: product.description || "Available from the API"
    };
}

function showStatus(message, type = "error") {
    apiStatus.textContent = message;
    apiStatus.className = `api-status visible ${type}`;
}

function clearStatus() {
    apiStatus.textContent = "";
    apiStatus.className = "api-status";
}

function setLoading(loading) {
    isLoading = loading;
    loadingState.style.display = loading ? "flex" : "none";
    productGrid.style.display = loading ? "none" : "grid";
}

async function loadProducts() {
    setLoading(true);
    clearStatus();

    try {
        const apiProducts = await apiService.fetchProducts();
        products = apiProducts.map((product, index) => normalizeProduct(product, index));
        filteredProducts = [...products];
        currentPage = 1;
        setLoading(false);
        renderProducts();
    } catch (error) {
        products = [];
        filteredProducts = [];
        productGrid.innerHTML = "";
        updatePaginationState();
        showStatus("Unable to load products right now. Please refresh and try again.", "error");
    } finally {
        setLoading(false);
    }
}

// 3. Core Logic: Filtering & Sorting
function applyFilters() {
    let results = [...products];
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const sortBy = sortSelect.value;
    const maxPrice = Number(priceRange.value);
    const checkedRatings = Array.from(ratingChecks).filter(c => c.checked).map(c => Number(c.value));
    const checkedBrands = Array.from(brandChecks).filter(c => c.checked).map(c => c.value);

    // Search Filter
    if (searchTerm) {
        results = results.filter(p => p.title.toLowerCase().includes(searchTerm));
    }

    // Category Filter
    if (category !== "all") {
        results = results.filter(p => p.category === category);
    }
    if (selectedCategoryChip !== "all" && selectedCategoryChip !== "Top Offers") {
        results = results.filter(p => p.category === selectedCategoryChip);
    }
    if (selectedCategoryChip === "Top Offers") {
        results = results.filter(p => getDiscountPercent(p) >= 35);
    }

    // Price Filter
    results = results.filter(p => p.price <= maxPrice);

    // Rating Filter
    if (checkedRatings.length > 0) {
        const minRating = Math.max(...checkedRatings);
        results = results.filter(p => p.rating >= minRating);
    }

    // Brand Filter
    if (checkedBrands.length > 0) {
        results = results.filter(p => checkedBrands.includes(p.brand));
    }

    // Sorting Logic
    if (sortBy === "price-asc") {
        results.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
        results.sort((a, b) => b.price - a.price);
    } else if (sortBy === "alpha") {
        results.sort((a, b) => a.title.localeCompare(b.title));
    }

    filteredProducts = results;
    currentPage = 1; // Reset to first page after filtering
    renderProducts();
}

function getDiscountPercent(product) {
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

// 4. Core Logic: Pagination & Rendering
function renderProducts() {
    productGrid.innerHTML = "";

    if (isLoading) {
        updatePaginationState();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIndex, endIndex);

    if (paginatedItems.length === 0) {
        productGrid.innerHTML = "<p class='empty-state'>No products found.</p>";
    }

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }

    paginatedItems.forEach(product => {
        const discount = getDiscountPercent(product);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <div class="product-info">
                <h3>${product.title}</h3>
                <p>${product.category} | ${product.brand}</p>
                <p>${product.description}</p>
                <div class="meta-line">
                    <span class="rating-pill">${product.rating} <i class="fa-solid fa-star"></i></span>
                    ${product.assured ? '<span class="assured-pill">Assured</span>' : ''}
                </div>
                <div class="price-line">
                    <p class="price">Rs${product.price}</p>
                    <span class="mrp">Rs${product.mrp}</span>
                    <span class="discount">${discount}% off</span>
                </div>
                <div class="card-actions">
                    <button class="add-to-cart" type="button" data-action="add-to-cart" data-id="${product.id}">Add to Cart</button>
                    <button class="delete-btn" type="button" data-action="delete-product" data-id="${product.id}">Delete</button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });

    updatePaginationState();
}

function updatePaginationState() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    
    prevBtn.disabled = currentPage === 1 || totalPages === 0;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

async function handleProductFormSubmit(event) {
    event.preventDefault();
    clearStatus();

    const payload = {
        title: productTitleInput.value.trim(),
        price: Number(productPriceInput.value),
        category: productCategoryInput.value,
        brand: productBrandInput.value,
        image: productImageInput.value.trim() || fallbackImage,
        description: productDescriptionInput.value.trim()
    };

    productFormSubmit.disabled = true;
    productFormSubmit.textContent = "Adding...";

    try {
        const createdProduct = await apiService.createProduct(payload);
        const normalizedProduct = normalizeProduct({ ...payload, ...createdProduct }, 0);
        products = [normalizedProduct, ...products];
        productForm.reset();
        productCategoryInput.value = "Electronics";
        productBrandInput.value = "Nova";
        applyFilters();
        showStatus("Product added successfully.", "success");
    } catch (error) {
        showStatus("Unable to add product right now. Please try again.", "error");
    } finally {
        productFormSubmit.disabled = false;
        productFormSubmit.textContent = "Add Product";
    }
}

// 5. Cart Logic (LocalStorage)
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        return;
    }

    const idx = cart.findIndex(item => item.id === product.id);
    
    if (idx !== -1) {
        cart[idx].qty += 1;
    } else {
        cart.push({...product, qty: 1 });
    }
    
    saveAndRenderCart();
}

function updateQty(productId, amount) {
    const idx = cart.findIndex(item => item.id === productId);
    if (idx !== -1) {
        cart[idx].qty += amount;
        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1); // Remove item if qty is 0
        }
    }
    saveAndRenderCart();
}

async function deleteProduct(productId) {
    if (!window.confirm("Delete this product from the catalog?")) {
        return;
    }

    try {
        await apiService.deleteProduct(productId);
        products = products.filter(product => product.id !== productId);
        filteredProducts = filteredProducts.filter(product => product.id !== productId);
        cart = cart.filter(item => item.id !== productId);
        saveAndRenderCart();
        applyFilters();
        showStatus("Product deleted successfully.", "success");
    } catch (error) {
        showStatus("Unable to delete product right now. Please try again.", "error");
    }
}

function saveAndRenderCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    cartItemsContainer.innerHTML = "";
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        count += item.qty;
        
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="cart-item-details">
                <h4>${item.title}</h4>
                <p>₹${item.price} x ${item.qty}</p>
            </div>
            <div class="cart-item-actions">
                <button onclick="updateQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQty(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="updateQty(${item.id}, -${item.qty})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    cartCount.textContent = count;
    cartTotal.textContent = total;
}

// 6. Event Listeners
searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
sortSelect.addEventListener('change', applyFilters);
priceRange.addEventListener('input', () => {
    priceValue.textContent = priceRange.value;
    applyFilters();
});
ratingChecks.forEach(check => check.addEventListener('change', applyFilters));

productForm.addEventListener('submit', handleProductFormSubmit);

productGrid.addEventListener('click', event => {
    const actionButton = event.target.closest('button[data-action]');

    if (!actionButton) {
        return;
    }

    const productId = Number(actionButton.dataset.id);

    if (actionButton.dataset.action === 'add-to-cart') {
        addToCart(productId);
    }

    if (actionButton.dataset.action === 'delete-product') {
        deleteProduct(productId);
    }
});
brandChecks.forEach(check => check.addEventListener('change', applyFilters));
clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = 'all';
    sortSelect.value = 'default';
    priceRange.value = '15000';
    priceValue.textContent = '15000';
    selectedCategoryChip = 'all';
    ratingChecks.forEach(check => {
        check.checked = false;
    });
    brandChecks.forEach(check => {
        check.checked = false;
    });
    quickChips.forEach(chip => {
        chip.classList.toggle('active', chip.dataset.category === 'all');
    });
    applyFilters();
});
quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
        selectedCategoryChip = chip.dataset.category;
        quickChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (selectedCategoryChip === 'all' || selectedCategoryChip === 'Top Offers') {
            categoryFilter.value = 'all';
        } else {
            categoryFilter.value = selectedCategoryChip;
        }
        applyFilters();
    });
});

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderProducts(); }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; renderProducts(); }
});

// Cart UI Toggles
document.getElementById('cartIcon').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
});

document.getElementById('closeCart').addEventListener('click', closeCartUI);
document.getElementById('cartOverlay').addEventListener('click', closeCartUI);

function closeCartUI() {
    document.getElementById('cartSidebar').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
}

// Initialize on page load
loadProducts();
saveAndRenderCart();
