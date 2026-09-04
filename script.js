// --- VARIABLES GLOBALES ---
let allProductsData = [];
let carouselImagesData = []; // Liste des images pour le carrousel
let slideIndex = 0;
let totalSlides = 0;
let carouselInterval;
let selectedProductForModal = null;
let panier = [];
const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis pour la livraison et le montage)";
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com";
const BUSINESS_PHONE = "06 52 98 23 48";
const CATEGORIES = {
    'all': 'Tous les produits',
    'evenementiel': 'Événementiel',
    'outillage': 'Outillage'
};

// --- FONCTION UTILITAIRE DE PRIX ---
/**
 * Extrait le montant numérique des chaînes de prix ou de caution (ex: "6 € / jour" ou "40€").
 * Gère le format décimal européen (virgule).
 */
function parsePrice(priceString) {
    if (!priceString) return 0;
    // Capture les nombres avec virgule ou point optionnel pour les décimales
    const match = priceString.replace(/\s/g, '').match(/(\d+([,\.]\d+)?)/);
    if (match) {
        // Remplace la virgule par un point pour la fonction parseFloat standard
        return parseFloat(match[0].replace(',', '.'));
    }
    return 0;
}

// --- INITIALISATION ET MODE SOMBRE ---
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
         // Fonction de bascule du mode sombre
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });
    }
    initApp(); 
});
function initApp() {
    loadProductsFromCSVFile();

    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', handleSubmitReservation);
    }
     // Assurer que le premier lien est actif au démarrage
    document.querySelector('.main-nav ul li a').classList.add('active');
    showSection('accueil'); // Afficher la section d'accueil par défaut
}


// --- NAVIGATION ---
function showSection(sectionId) {
    // Gestion du carrousel
    if (sectionId !== 'accueil') {
        clearInterval(carouselInterval);
    } else {
        if (totalSlides > 0) {
             startCarousel();
        }
    }
    if (sectionId === 'panier') {
        renderCart();
    }

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId + '-section');
    if (target) target.classList.add('active');

    // Mettre à jour la navigation principale
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.onclick && link.onclick.toString().includes(`showSection('${sectionId}')`)) {
            link.classList.add('active');
        }
    });
    // Afficher/Masquer la navigation par catégorie
    const catNav = document.getElementById('catalogue-nav');
    if (sectionId === 'catalogue') {
        catNav.style.display = 'flex';
        if (!document.querySelector('.cat-nav button.active')) {
            filterProducts('all');
        }
    } else {
        catNav.style.display = 'none';
    }
}

// --- NOTIFICATION TOAST ---
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    toast.textContent = message;
    toast.classList.add("show");
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// --- MODALE PRODUIT ---
function openModal(productId) { 
    const modal = document.getElementById('product-modal');
    const product = allProductsData.find(p => p.id == productId);
    if (product) {
        selectedProductForModal = product;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-image').src = product.image_url; 
        document.getElementById('modal-description').innerHTML = product.description; 
        
        // AFFICHAGE DU PRIX (TTC)
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <span style="font-size: 0.8em; color: var(--text-muted);">TTC</span>`;
        
        // AFFICHAGE DE LA CAUTION (TTC)
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <span style="font-size: 0.8em; color: var(--text-muted);">TTC</span>`;

        document.getElementById('modal-quantity').value = 1;
        document.getElementById('modal-quantity').max = product.max_quantity;
        document.getElementById('modal-start-date').value = '';
        document.getElementById('modal-end-date').value = '';

        document.getElementById('modal-max-quantity-info').textContent = `Max disponible : ${product.max_quantity}`;
        modal.style.display = "flex"; // Affiche la modale
    }
}

function closeModal() {
    document.getElementById('product-modal').style.display = "none";
    selectedProductForModal = null;
}

// Fermer la modale en cliquant en dehors
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        closeModal();
    }
};

// --- LOGIQUE PANIER ET CALCUL ---

function extractPriceDetails(priceString) {
    const priceValue = parsePrice(priceString); 

    const unitMatch = priceString.toLowerCase().includes('jour') ? 'per_day' : 
                              priceString.toLowerCase().includes('personne') ?
                              'per_person' :
                              'flat_rate';
    return { value: priceValue, unit: unitMatch, unitString: priceString.match(/€\s*(\/.+)?/)?.[1]?.trim() || '' };
}

function calculateItemPrice(item) {
    const { product, quantity, startDate, endDate } = item;
    const { value, unit } = extractPriceDetails(product.price);
    
    let basePrice = value;
    let multiplier = 1;
    let warning = null;
    let isDaily = unit === 'per_day';

    if (isDaily) {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            multiplier = diffDays;
        } else {
            warning = " (Est. 1 jour. Veuillez spécifier les dates pour le calcul réel)";
            multiplier = 1; 
        }
    } else if (unit === 'per_person') {
         multiplier = 1;
    } else {
         multiplier = 1;
    }
    
    const totalPrice = basePrice * multiplier * quantity;
    return {
        total: totalPrice,
        unit: unit,
        multiplier: multiplier,
        warning: warning,
        isDaily: isDaily
    };
}

function addToCartFromModal() {
    if (selectedProductForModal) {
        const qtyInput = document.getElementById('modal-quantity');
        const startDate = document.getElementById('modal-start-date').value;
        const endDate = document.getElementById('modal-end-date').value;
        const quantity = parseInt(qtyInput.value) || 1;
        if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
            showToast("Erreur: La date de début ne peut pas être postérieure à la date de fin.");
            return;
        }

        const item = {
            id: Date.now(), 
            product: selectedProductForModal,
            startDate: startDate, 
            endDate: endDate, 
            quantity: quantity
        };
        panier.push(item);
        closeModal();
        updateCartCount();
        showToast(`✅ ${item.product.name} (x${quantity}) ajouté à la demande de réservation.`);
    }
}

function updateCartCount() {
    document.getElementById('cart-count').textContent = panier.length;
    const validateBtn = document.querySelector('#reservation-form .validate-btn');
    const userEmailInput = document.getElementById('user-email');
    
    // Vérification basique pour activer/désactiver le bouton
    const isValid = panier.length > 0 && userEmailInput.value.trim().includes('@');
    validateBtn.disabled = !isValid;
    renderCartSummary(); 
}

// Lier l'événement 'input' de l'email à la mise à jour du bouton
document.addEventListener('input', (event) => {
    if (event.target.id === 'user-email') {
        updateCartCount();
    }
});

function handleDeliveryChange() {
    const isChecked = document.getElementById('delivery-checkbox').checked;
    const addressGroup = document.getElementById('delivery-address-group');
    const infoSpan = document.getElementById('delivery-info');
    
    infoSpan.textContent = isChecked ? DELIVERY_INFO_MESSAGE : '';
    addressGroup.style.display = isChecked ? 'block' : 'none';
    renderCartSummary();
}

function renderCartSummary() {
    let totalRentalEstimate = 0; 
    let totalCautionAmount = 0; 
    let totalItems = 0;

    panier.forEach(item => {
        const itemPriceCalc = calculateItemPrice(item);
        totalRentalEstimate += itemPriceCalc.total;
        totalItems += item.quantity;
        
        // Calcul du total de la caution : caution unitaire * quantité
        const unitCaution = parsePrice(item.product.caution); 
        totalCautionAmount += unitCaution * item.quantity;
    });

    document.getElementById('cart-total-price').textContent = `${totalItems} article(s)`;
    
    // Affichage Coût Total de Location (TTC)
    const totalRentalElement = document.getElementById('cart-total-estimate');
    totalRentalEstimate > 0 ? totalRentalElement.style.color = 'var(--primary-color)' : totalRentalElement.style.color = 'var(--text-dark)';
    totalRentalElement.textContent = `${totalRentalEstimate.toFixed(2).replace('.', ',')} € TTC`; 
    
    // Affichage Montant Total des Cautions (TTC)
    const totalCautionElement = document.getElementById('cart-total-caution');
    totalCautionElement.textContent = `${totalCautionAmount.toFixed(2).replace('.', ',')} € TTC`;
    totalCautionAmount > 0 ? totalCautionElement.style.color = 'var(--secondary-color)' : totalCautionElement.style.color = 'var(--text-dark)';

}


function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';
    
    if (panier.length === 0) {
        container.innerHTML = '<p class="empty-cart-message">Votre panier de réservation est vide.</p>';
        renderCartSummary();
        updateCartCount();
        return;
    }

    panier.forEach(item => {
        const itemPriceCalc = calculateItemPrice(item);
        const itemTotalPrice = itemPriceCalc.total.toFixed(2);
        const itemWarning = itemPriceCalc.warning ? `<br><small style="color: var(--secondary-color); font-weight: 600;">${itemPriceCalc.warning}</small>` : '';
        
        // Affichage de la caution par article
        const unitCaution = parsePrice(item.product.caution); 
        const cautionDisplay = unitCaution > 0 ? `<p>Caution unitaire (TTC) : <strong>${unitCaution.toFixed(2).replace('.', ',')} € TTC</strong></p>` : '';
       
        const datesDisplay = (item.startDate && item.endDate) ? 
            `Du: <strong>${item.startDate}</strong> au: <strong>${item.endDate}</strong> (${itemPriceCalc.multiplier}j)` : 
            `Période: Non spécifiée`;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';

        itemElement.innerHTML = `
            <img src="${item.product.image_url}" alt="${item.product.name}">
            <div class="item-details">
                <h4>${item.product.name}</h4>
                <p>${datesDisplay}</p>
                <p>Prix unitaire (TTC): ${item.product.price}</p>
                ${cautionDisplay}
                <p><strong>Est. Coût Location (TTC) : ${itemTotalPrice.replace('.', ',')} €</strong> ${itemWarning}</p>
            </div>
            <div class="item-controls">
                <label>Qté: 
                    <input type="number" 
                        value="${item.quantity}" min="1" max="${item.product.max_quantity}" 
                        onchange="updateCartQuantity(${item.id}, this.value)">
                </label>
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Supprimer</button>
            </div>
        `;
        container.appendChild(itemElement);
    });

    renderCartSummary();
    updateCartCount();
}

function updateCartQuantity(itemId, newQuantity) {
    const item = panier.find(i => i.id === itemId);
    if (item) {
        const qty = parseInt(newQuantity);
        const max = parseInt(item.product.max_quantity);
        
        if (qty > max) {
            showToast(`⚠️ Max disponible : ${max} unités pour ${item.product.name}.`);
            item.quantity = max;
        } else if (qty < 1 || isNaN(qty)) {
            item.quantity = 1;
        } else {
            item.quantity = qty;
        }
        
        renderCart();
    }
}

function removeFromCart(itemId) {
    panier = panier.filter(item => item.id !== itemId);
    renderCart();
    updateCartCount();
}

function handleSubmitReservation(event) {
    event.preventDefault();
    const form = event.target;
    const userEmailInput = document.getElementById('user-email');
    
    if (panier.length === 0 || !userEmailInput.value.trim().includes('@')) {
        showToast("⚠️ Veuillez ajouter des articles et fournir une adresse email valide.");
        return;
    }

    // Récupération des données
    const userEmail = userEmailInput.value.trim();
    const isDelivery = document.getElementById('delivery-checkbox').checked;
    const deliveryAddress = isDelivery ? document.getElementById('delivery-address').value.trim() : 'N/A';
    const reservationMessage = document.getElementById('reservation-message').value.trim() || 'Aucun message supplémentaire.';
    const isBillingRequested = document.getElementById('billing-request').checked;
    
    let priceDetails = '';
    let totalRentalEstimate = 0;
    let totalCautionAmount = 0; 
    let totalItems = 0;
    
    panier.forEach(item => {
        const itemPriceCalc = calculateItemPrice(item);
        totalRentalEstimate += itemPriceCalc.total;
        totalItems += item.quantity;
        
        // Calcul de la caution par article
        const unitCaution = parsePrice(item.product.caution);
        const itemCaution = unitCaution * item.quantity;
        totalCautionAmount += itemCaution;

        const dates = (item.startDate && item.endDate) ? `Du ${item.startDate} au ${item.endDate} (${itemPriceCalc.multiplier} jour(s))` : `Non spécifiée.`;
        const calculatedPriceLine = itemPriceCalc.isDaily ? `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR (Basé sur ${itemPriceCalc.multiplier}j)` : `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR`; 
        
        // Formatage simple texte
        priceDetails += ` 
 -------------------------------------------------------
 ARTICLE ${item.product.id} : ${item.product.name}
 -------------------------------------------------------
 Nom de l'article : ${item.product.name}
 Quantité : x${item.quantity}
 Prix unitaire (TTC) : ${item.product.price}
 Montant Caution Unitaire (TTC) : ${unitCaution.toFixed(2)} EUR
 Période souhaitée : ${dates}
 Estimation Coût Location : ${calculatedPriceLine}
 `;
    });
    
    const emailBody = `Bonjour, Nous vous remercions pour votre demande de réservation. Voici le récapitulatif des articles demandés.
=======================================================
RECAPITULATIF DE LA DEMANDE
=======================================================
${priceDetails.trim()}
=======================================================
INFORMATIONS COMPLEMENTAIRES
=======================================================
Email du client : ${userEmail}
Demande de livraison & Montage : ${isDelivery ? 'OUI' : 'NON'}
Adresse de livraison (si demandée) : ${deliveryAddress}
Demande de Facturation : ${isBillingRequested ? 'OUI' : 'NON'}
Message du client : ${reservationMessage}
=======================================================
ESTIMATION GLOBALE (HORS LIVRAISON)
=======================================================
Nombre total d'articles : ${totalItems}
Estimation du Total TTC (Location) : ${totalRentalEstimate.toFixed(2)} EUR
Montant Total des Cautions (TTC) : ${totalCautionAmount.toFixed(2)} EUR

(Ce montant est une estimation et sera confirmé par devis après vérification des disponibilités et ajout des frais de livraison éventuels. La caution est payable par espèces ou virement instantané.)
=======================================================
CONTACT RAPIDE
=======================================================
Si vous souhaitez apporter des modifications à cette demande ou obtenir des précisions rapides, vous pouvez nous envoyer un email en répondant directement à ce message ou nous contacter au ${BUSINESS_PHONE}.
    
Cordialement,
L'équipe Ma boîte à loc' Angevine
`;

    // Met à jour les champs cachés pour FormSubmit
    document.getElementById('hidden-replyto').value = userEmail;
    document.getElementById('hidden-cc').value = BUSINESS_EMAIL;
    document.getElementById('hidden-subject').value = `Nouvelle demande de réservation de ${userEmail} (${totalItems} articles)`;
    document.getElementById('email-body-content').value = emailBody;

    // Active l'envoi du formulaire (le formulaire se soumettra au endpoint FormSubmit)
    form.submit();
}

// --- LOGIQUE CATALOGUE ET CHARGEMENT CSV ---
async function loadProductsFromCSVFile() {
    const csvFilePath = 'data.csv';
    try {
        const response = await fetch(csvFilePath);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const csvData = await response.text();
        const lines = csvData.trim().split('\n');
        
        // La première ligne est l'en-tête
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const products = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing, gère les champs entourés de guillemets
            const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g).map(val => val.trim().replace(/"/g, ''));

            if (values.length === headers.length) {
                let product = {};
                headers.forEach((header, index) => {
                    product[header.toLowerCase()] = values[index];
                });
                // Conversion des IDs et quantités en nombres pour la logique
                product.id = parseInt(product.id);
                product.max_quantity = parseInt(product.max_quantity);
                products.push(product);
            } else {
                console.warn(`Ligne ignorée (format incorrect, ${values.length} col. vs ${headers.length} attendues): ${line}`);
            }
        } 

        allProductsData = products;
        
        // Filtrer les images pour le carrousel (colonne 'carrousel' ou 'is_carousel')
        carouselImagesData = allProductsData 
            .filter(p => p.carrousel && p.carrousel.toLowerCase().trim() === 'oui')
            .map(p => p.image_url);

        renderCategoryButtons();
        renderProductList(allProductsData); 
        
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
        initCarousel();

    } catch (error) {
        console.error("Impossible de charger le catalogue :", error);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = "Erreur: Impossible de charger le catalogue. Vérifiez data.csv et la console.";
            loadingMessage.style.color = '#A44C3A';
        }
    }
}

function renderCategoryButtons() {
    const nav = document.getElementById('catalogue-nav');
    nav.innerHTML = '';
    
    // Bouton "Tous"
    let buttonAll = document.createElement('button');
    buttonAll.textContent = CATEGORIES['all'];
    buttonAll.onclick = () => filterProducts('all');
    buttonAll.classList.add('active');
    nav.appendChild(buttonAll);

    // Autres catégories
    const uniqueCategories = [...new Set(allProductsData.map(p => p.category))];
    uniqueCategories.forEach(cat => {
        let button = document.createElement('button');
        button.textContent = CATEGORIES[cat] || cat;
        button.onclick = () => filterProducts(cat);
        nav.appendChild(button);
    });
}

function filterProducts(category) {
    document.querySelectorAll('#catalogue-nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category.toLowerCase().replace('all', 'tous'))) {
            btn.classList.add('active');
        }
    });

    let filteredProducts;
    if (category === 'all') {
        filteredProducts = allProductsData;
    } else {
        filteredProducts = allProductsData.filter(product => product.category === category);
    }
    renderProductList(filteredProducts);
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const activeCategory = document.querySelector('#catalogue-nav button.active').textContent.toLowerCase();
    
    let productsToSearch = allProductsData;
    if (activeCategory !== 'tous les produits') {
        productsToSearch = allProductsData.filter(p => p.category.toLowerCase() === activeCategory.replace('événementiel', 'evenementiel').replace('outillage', 'outillage'));
    }

    const filtered = productsToSearch.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );

    renderProductList(filtered);
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    container.innerHTML = ''; 
    
    if (products.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Aucun produit trouvé dans cette catégorie ou correspondant à la recherche.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        productCard.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-card-body">
                <h4>${product.name}</h4>
                <p class="description-snippet">${product.description.substring(0, 80)}...</p>
                <p class="product-price">${product.price} <span style="font-size: 0.8em; color: var(--secondary-color);">TTC</span></p>
                <button onclick="openModal(${product.id})">Détails et Location</button>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// --- LOGIQUE CARROUSEL ---
function initCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    const container = document.getElementById('carousel-container');

    if (!container || carouselImagesData.length === 0) {
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: var(--primary-color); padding: 50px;">Aucune image sélectionnée pour le carrousel.</p>';
        }
        totalSlides = 0;
        return;
    }
    track.innerHTML = '';
    indicators.innerHTML = '';
    
    carouselImagesData.forEach((imgSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${imgSrc}" alt="Slide Carrousel ${index + 1}">`;
        track.appendChild(slide);

        const indicator = document.createElement('span');
        indicator.onclick = () => showSlide(index);
        indicators.appendChild(indicator);
    });

    totalSlides = carouselImagesData.length;
    if (totalSlides > 0) {
        showSlide(0); 
        if (document.getElementById('accueil-section').classList.contains('active')) {
            startCarousel();
        }
    }
}

function showSlide(index) {
    slideIndex = index;
    if (slideIndex >= totalSlides) {
        slideIndex = 0;
    }
    if (slideIndex < 0) {
        slideIndex = totalSlides - 1;
    }
    const track = document.getElementById('carousel-track');
    const indicators = document.querySelectorAll('#carousel-indicators span');
    if (track) {
        track.style.transform = `translateX(-${slideIndex * 100}%)`;
    }
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === slideIndex);
    });
}

function moveCarousel(n) {
    showSlide(slideIndex + n);
}

function startCarousel() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        moveCarousel(1);
    }, 4000);
}