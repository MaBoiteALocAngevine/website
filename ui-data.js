// Dépend des fonctions de _config.js, _utils.js et _cart-logic.js
// =================================================================
// 5. RENDU DE L'INTERFACE 
// =================================================================

/**
 * Charge les données depuis le CSV et initialise l'application.
 */
function loadProductsFromCSVFile() {
    allProductsData = parseCSV(PRODUCTS_DATA_CSV);
    carouselProducts = allProductsData.filter(p => p.carrousel && p.carrousel.toLowerCase() === 'oui' && p.publication.toLowerCase() === 'oui');

    loadCartFromStorage();

    // 1. Initialiser l'UI
    renderCatalogue();
    renderCategoryButtons();
    initCarousel();

    // 2. Afficher la section appropriée après le chargement des données
    const currentSectionId = document.querySelector('.content-section.active')?.id.replace('-section', '');
    showSection(currentSectionId || 'accueil');

    // 3. Masquer le message de chargement
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) loadingMessage.style.display = 'none';

    // 4. Mettre à jour le panier après le chargement des produits
    updateCartCount();
    renderCart();
}

// --- Navigation et Sections ---

/**
 * Affiche la section demandée et met à jour la navigation.
 */
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        if (section.id === 'catalogue-section') {
            const nav = document.getElementById('catalogue-nav');
            if (nav) nav.style.display = 'none';
        }
    });

    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        if (sectionId === 'catalogue') {
            const nav = document.getElementById('catalogue-nav');
            if (nav) nav.style.display = 'flex';
            filterProducts('all'); 
        }
        if (sectionId === 'panier') {
            renderCart(); 
        }
    }

    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.onclick.toString().includes(`showSection('${sectionId}')`)) {
            link.classList.add('active');
        }
    });
}


// --- Catalogue ---

/**
 * Génère et affiche les boutons de filtrage des catégories.
 */
function renderCategoryButtons() {
    const categoryNav = document.getElementById('catalogue-nav');
    if (!categoryNav) return;
    categoryNav.innerHTML = ''; 

    const categories = [...new Set(allProductsData.map(p => p.category))];
    
    const allBtn = document.createElement('button');
    allBtn.textContent = 'Tout';
    allBtn.className = 'button active';
    allBtn.onclick = () => filterProducts('all');
    categoryNav.appendChild(allBtn);

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        btn.className = 'button';
        btn.onclick = () => filterProducts(category);
        categoryNav.appendChild(btn);
    });
}

/**
 * Filtre et affiche les produits du catalogue.
 */
function filterProducts(category) {
    const productList = document.getElementById('product-list');
    if (!productList) return;
    productList.innerHTML = ''; 

    const filteredProducts = allProductsData.filter(p => 
        p.publication.toLowerCase() === 'oui' && (category === 'all' || p.category === category)
    );

    if (filteredProducts.length === 0) {
        productList.innerHTML = `<p style="text-align: center; grid-column: 1 / -1;">Aucun produit trouvé dans cette catégorie.</p>`;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openModal(product.id);
        
        const { priceValue, isDaily } = extractPriceDetails(product.price);
        const priceText = isDaily ? `${priceValue} € / jour` : `${priceValue} € (Forfait)`;
        
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-card-body">
                <h4>${product.name}</h4>
                <p>${product.description.replace(/<[^>]*>?/gm, '').substring(0, 70)}...</p>
                <div class="product-price">${priceText}</div>
                <div class="product-caution">Caution: ${product.caution}</div>
                <button class="primary-button" onclick="event.stopPropagation(); openModal(${product.id});">Réserver</button>
            </div>
        `;
        productList.appendChild(card);
    });

    document.querySelectorAll('.cat-nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === category.toLowerCase() || 
            (category === 'all' && btn.textContent.toLowerCase() === 'tout')) {
            btn.classList.add('active');
        }
    });
}

function renderCatalogue() {
    // Sera appelée par loadProductsFromCSVFile()
}

// --- Carrousel ---

/**
 * Initialise le carrousel.
 */
function initCarousel() {
    const container = document.getElementById('carousel-container');
    if (!container || carouselProducts.length === 0) {
        if (container) container.style.display = 'none'; 
        return;
    }

    container.style.display = 'block';

    let track = document.querySelector('.carousel-track');
    let dotsContainer = document.querySelector('.dots-container');

    if (!track) {
        track = document.createElement('div');
        track.className = 'carousel-track';
        const nextButton = container.querySelector('.next');
        if (nextButton) {
             container.insertBefore(track, nextButton);
        } else {
             container.appendChild(track);
        }
    }
    track.innerHTML = '';
    
    if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'dots-container';
        container.appendChild(dotsContainer);
    }
    dotsContainer.innerHTML = '';
    
    carouselProducts.forEach((product, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.onclick = () => openModal(product.id);
        slide.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="slide-caption">
                <h4>${product.name}</h4>
                <p>${product.description.replace(/<[^>]*>?/gm, '').substring(0, 100)}...</p>
            </div>
        `;
        track.appendChild(slide);

        const dot = document.createElement('span');
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    currentCarouselIndex = 0;
    updateCarousel();
    startCarousel();
}

/**
 * Déplace le carrousel au slide suivant/précédent.
 */
function moveCarousel(step) {
    let newIndex = currentCarouselIndex + step;

    if (newIndex < 0) {
        newIndex = carouselProducts.length - 1;
    } else if (newIndex >= carouselProducts.length) {
        newIndex = 0;
    }

    goToSlide(newIndex);
}

/**
 * Va directement à un slide spécifique.
 */
function goToSlide(index) {
    currentCarouselIndex = index;
    updateCarousel();
    clearInterval(carouselInterval);
    startCarousel();
}

/**
 * Met à jour la position du carrousel et l'indicateur.
 */
function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    const dots = document.querySelectorAll('.dots-container span');

    if (track) {
        const offset = currentCarouselIndex * -100;
        track.style.transform = `translateX(${offset}%)`;
    }

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCarouselIndex);
    });
}

/**
 * Démarre le défilement automatique du carrousel.
 */
function startCarousel() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        moveCarousel(1);
    }, 5000); 
}

// --- Modale de Produit ---

/**
 * Ouvre la modale pour un produit spécifique.
 */
function openModal(id) {
    const product = allProductsData.find(p => p.id === id);
    if (!product) return;

    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    const { priceValue, isDaily } = extractPriceDetails(product.price);
    const priceText = isDaily ? `${priceValue} € / jour` : `${priceValue} € (Forfait)`;
    const isRental = isDaily; 

    modalBody.innerHTML = `
        <div class="modal-header">
            <h3>${product.name}</h3>
        </div>
        <div class="modal-image">
            <img src="${product.image_url}" alt="${product.name}" style="width:100%; height: auto; border-radius: 8px;">
        </div>
        <div class="modal-details" style="margin-top: 20px;">
            <p>${product.description}</p>
            <p class="modal-price">Prix : <strong>${priceText}</strong></p>
            <p class="modal-caution">Caution : <strong>${product.caution}</strong></p>
            <p>Quantité disponible : ${product.max_quantity}</p>
        </div>
        <div class="modal-controls">
            ${isRental ? `
                <div class="date-group">
                    <label for="modal-start-date">Du</label>
                    <input type="date" id="modal-start-date" required>
                </div>
                <div class="date-group">
                    <label for="modal-end-date">Au</label>
                    <input type="date" id="modal-end-date" required>
                </div>
            ` : ''}
            <div class="quantity-group">
                <label for="modal-quantity">Quantité</label>
                <input type="number" id="modal-quantity" value="1" min="1" max="${product.max_quantity}" required>
            </div>
            <button class="primary-button add-to-cart-btn" 
                    onclick="addToCartFromModal(${product.id}, ${isRental});">
                Ajouter au panier
            </button>
        </div>
    `;

    if (isRental) {
        const startDateInput = document.getElementById('modal-start-date');
        const endDateInput = document.getElementById('modal-end-date');
        
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        endDateInput.min = today;

        startDateInput.addEventListener('change', () => {
            endDateInput.min = startDateInput.value || today;
            if (endDateInput.value && startDateInput.value > endDateInput.value) {
                endDateInput.value = startDateInput.value;
            }
        });
    }

    modal.style.display = 'flex';
}

/**
 * Ferme la modale.
 */
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

/**
 * Ajoute un article au panier depuis la modale.
 */
function addToCartFromModal(id, isRental) {
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    let startDate = null;
    let endDate = null;

    if (isRental) {
        startDate = document.getElementById('modal-start-date').value;
        endDate = document.getElementById('modal-end-date').value;

        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            showToast("Veuillez choisir une période de location valide.");
            return;
        }
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        showToast("Veuillez entrer une quantité valide.");
        return;
    }

    addToCart(id, quantity, startDate, endDate);
    closeModal();
}

// --- Vue Panier ---

/**
 * Génère le rendu complet de la section panier.
 */
function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    if (!cartItemsContainer || !cartSummary) return;
    cartItemsContainer.innerHTML = '';

    if (panier.length === 0) {
        cartItemsContainer.innerHTML = `<p style="text-align: center;">Votre panier est vide. Ajoutez des articles depuis le <a href="javascript:void(0)" onclick="showSection('catalogue')">catalogue</a>.</p>`;
        cartSummary.style.display = 'none';
        return;
    }

    cartSummary.style.display = 'block';

    panier.forEach(item => {
        const product = allProductsData.find(p => p.id === item.id);
        if (!product) return;

        const { priceValue, isDaily } = extractPriceDetails(product.price);
        const itemTotalPrice = calculateItemPrice(item);
        const itemTotalCaution = calculateItemCaution(item);
        const priceText = isDaily ? `${priceValue} € / jour` : `${priceValue} € (Forfait)`;
        
        const dateDisplay = isDaily ? `
            <p>Du <strong>${formatDate(item.startDate)}</strong> au <strong>${formatDate(item.endDate)}</strong></p>
        ` : '';
        
        let dayCount = 1;
        if(isDaily && item.startDate && item.endDate) {
             dayCount = (new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24) + 1;
        }

        const durationDisplay = isDaily ? `
            <p>Durée : <strong>${dayCount} jour(s)</strong></p>
        ` : '';

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
                <img src="${product.image_url}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div style="flex-grow: 1;">
                    <h4>${product.name}</h4>
                    ${dateDisplay}
                    ${durationDisplay}
                    <p>Prix unitaire : ${priceText}</p>
                    <p>Caution unitaire : ${product.caution}</p>
                </div>
                <div style="text-align: right; min-width: 150px;">
                    <label for="qty-${item.id}">Quantité :</label>
                    <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1" max="${product.max_quantity}" 
                           onchange="updateCartItem(${item.id}, '${item.startDate}', '${item.endDate}', this.value)" 
                           style="width: 60px; text-align: center; padding: 5px; margin-right: 10px;">
                    <p style="margin-top: 10px; font-weight: bold;">Total Location : ${itemTotalPrice.toFixed(2)} €</p>
                    <p style="color: var(--warning-color); font-size: 0.9em;">Total Caution : ${itemTotalCaution.toFixed(2)} €</p>
                    <button class="button" style="background-color: var(--warning-color); color: white; margin-top: 10px; padding: 8px 15px; border-radius: 5px;" 
                            onclick="removeItem(${item.id}, '${item.startDate}', '${item.endDate}')">
                        Retirer
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    const { subtotal, totalCaution } = calculateTotals();

    cartSummary.innerHTML = `
        <h3>Résumé de la Réservation</h3>
        <p>Articles dans le panier : ${panier.length}</p>
        
        <div class="cart-totals">
            <div style="display: flex; justify-content: space-between;">
                <span>Total Location (HT) :</span>
                <span style="font-weight: bold;">${subtotal.toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span>TVA (20%) :</span>
                <span style="font-weight: bold;">${(subtotal * 0.20).toFixed(2)} €</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.1em; margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                <span>Total Location (TTC) :</span>
                <span style="font-weight: 800; color: var(--primary-color);">${(subtotal * 1.20).toFixed(2)} €</span>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 1.1em; margin-top: 15px;">
            <span class="caution-total">Caution Totale :</span>
            <span class="caution-total" style="font-weight: 800;">${totalCaution.toFixed(2)} €</span>
        </div>
        
        <button class="primary-button" onclick="showSection('contact')" style="width: 100%; margin-top: 25px;">
            Passer à la Demande de Réservation
        </button>
    `;
}