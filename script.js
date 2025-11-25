// --- VARIABLES GLOBALES ---
let allProductsData = [];
// MISE À JOUR 1 : Initialisation du tableau avec des chemins vers images/carrousel
let carouselImages = [
    'images/carrousel/location-tente.jpg',
    'images/carrousel/location-sono.jpg',
    'images/carrousel/location-echafaudage.jpg',
    'images/carrousel/materiel-evenementiel.jpg'
    // ⚠️ IMPORTANT : Remplacez ces noms par ceux de vos images réelles dans images/carrousel/
];
let slideIndex = 0;
let totalSlides = 0;
let carouselInterval;
let selectedProductForModal = null; // Stocke l'objet produit pour l'ajout au panier

// Le tableau qui stocke les articles du panier
let panier = [];

// Message informatif de livraison
const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis)";

const CATEGORIES = {
    'all': 'Tous les produits',
    'evenementiel': 'Événementiel',
    'outillage': 'Outillage'
};

// --- MODE SOMBRE ---
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
        });
    }

    // MISE À JOUR 3 : Initialisation du carrousel au chargement de la page
    initCarousel();
});

// --- NAVIGATION ---
function showSection(sectionId) {
    if (sectionId !== 'accueil') {
        clearInterval(carouselInterval);
    } else {
        startCarousel();
    }

    if (sectionId === 'panier') {
        renderCart();
    }

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    const target = document.getElementById(sectionId + '-section');
    if (target) target.classList.add('active');

    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.onclick && link.onclick.toString().includes(`showSection('${sectionId}')`)) {
            link.classList.add('active');
        }
    });

    const catNav = document.getElementById('catalogue-nav');
    if (sectionId === 'catalogue') {
        catNav.style.display = 'block';
        if (!document.querySelector('.cat-nav button.active')) {
            filterProducts('all');
        }
    } else {
        catNav.style.display = 'none';
    }
}

// --- MODALE PRODUIT ---
// MODIFICATION : Accepte l'ID du produit
function showProductDetails(productId) {
    const modal = document.getElementById('product-modal');

    // On trouve le produit dans notre tableau global de données
    selectedProductForModal = allProductsData.find(p => p.id === productId);

    if (!selectedProductForModal) {
        console.error("Produit introuvable avec l'ID:", productId);
        alert("Désolé, les détails de ce produit sont momentanément indisponibles.");
        return;
    }

    const maxQty = parseInt(selectedProductForModal.max_quantity) || 1;

    document.getElementById('modal-title').textContent = selectedProductForModal.name;
    document.getElementById('modal-image').src = selectedProductForModal.image_url;
    document.getElementById('modal-description').textContent = selectedProductForModal.description;
    document.getElementById('modal-price').textContent = 'Prix : ' + selectedProductForModal.price;

    // Mettre à jour la quantité max dans la modale
    document.getElementById('modal-max-qty').textContent = maxQty;
    const qtyInput = document.getElementById('modal-quantity');
    qtyInput.setAttribute('max', maxQty);
    qtyInput.value = 1; // Remet la quantité à 1 par défaut

    // Réinitialiser les champs de date
    document.getElementById('modal-start-date').value = '';
    document.getElementById('modal-end-date').value = '';

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    selectedProductForModal = null;
}

window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        modal.style.display = "none";
        selectedProductForModal = null;
    }
};

// --- LOGIQUE PANIER ---

function getPriceValue(priceString) {
    // Extrait le premier nombre valide (avec décimales . ou ,) de la chaîne de prix
    const match = priceString.match(/([\d\.,]+)/);
    if (match) {
        // Remplace la virgule par un point pour le parseFloat si elle est utilisée comme séparateur décimal
        return parseFloat(match[1].replace(',', '.'));
    }
    return 0;
}

// MODIFICATION : Les dates sont désormais optionnelles
function addToCartFromModal() {
    if (selectedProductForModal) {
        const qtyInput = document.getElementById('modal-quantity');
        const startDate = document.getElementById('modal-start-date').value;
        const endDate = document.getElementById('modal-end-date').value;
        const quantity = parseInt(qtyInput.value) || 1;

        // Validation UNIQUEMENT si les deux dates sont renseignées, on vérifie l'ordre.
        if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
            alert("La date de début ne peut pas être postérieure à la date de fin.");
            return;
        }

        const item = {
            id: Date.now(), // ID unique pour cet item du panier
            product: selectedProductForModal,
            startDate: startDate, // Date de début (peut être vide)
            endDate: endDate,     // Date de fin (peut être vide)
            quantity: quantity
        };

        panier.push(item);
        closeModal();
        updateCartUI();

        // Amélioration du message d'alerte pour tenir compte des dates manquantes
        const dateMessage = (startDate && endDate)
            ? ` pour la période du ${startDate} au ${endDate}`
            : ` sans date de réservation spécifiée (vous pouvez les ajouter dans le Panier).`;

        alert(`${quantity} x ${selectedProductForModal.name} a été ajouté à votre panier de réservation${dateMessage}`);
    }
}

// Gère l'affichage du champ d'adresse et met à jour le message de livraison
function handleDeliveryChange() {
    const isDeliveryChecked = document.getElementById('delivery-checkbox').checked;
    const addressGroup = document.getElementById('delivery-address-group');
    const deliveryInfoElement = document.getElementById('delivery-info');

    if (isDeliveryChecked) {
        addressGroup.style.display = 'block';
        deliveryInfoElement.textContent = DELIVERY_INFO_MESSAGE;
    } else {
        addressGroup.style.display = 'none';
        deliveryInfoElement.textContent = 'Non demandée';
    }
    updateCartUI();
}

function updateCartUI() {
    // 1. Mise à jour du compteur
    document.getElementById('cart-count').textContent = panier.length;

    // 2. Calcul du sous-total produits
    let productSubtotal = 0;
    panier.forEach(item => {
        // Multiplie le prix par la quantité
        productSubtotal += getPriceValue(item.product.price) * item.quantity;
    });

    // Affiche le sous-total produits
    document.getElementById('cart-total-price').textContent = productSubtotal.toFixed(2) + ' €';
    document.getElementById('total-final-price').textContent = productSubtotal.toFixed(2) + ' €';

    // 3. Affichage des items dans le panier
    renderCart();

    // 4. Affichage du message Panier vide si nécessaire
    const container = document.getElementById('cart-items-container');
    const validateBtn = document.querySelector('.validate-btn');
    const summary = document.querySelector('.cart-summary');

    if (panier.length === 0) {
        container.innerHTML = '<div class="empty-cart-message">Votre panier de réservation est vide. Ajoutez des articles depuis le catalogue !</div>';
        summary.style.display = 'none';
        validateBtn.disabled = true;
    } else {
        summary.style.display = 'block';
        validateBtn.disabled = false;
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    container.innerHTML = '';

    if (panier.length === 0) {
        // Sera géré par updateCartUI
        return;
    }

    panier.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="item-details">
                <h4>${item.quantity} x ${item.product.name} (${item.product.price})</h4>
            </div>
            <div class="item-controls">
                <label for="start-date-${item.id}">Début :</label>
                <input type="date" id="start-date-${item.id}" value="${item.startDate}" onchange="updateCartItemDate(${item.id}, 'start', this.value)">
                
                <label for="end-date-${item.id}">Fin :</label>
                <input type="date" id="end-date-${item.id}" value="${item.endDate}" onchange="updateCartItemDate(${item.id}, 'end', this.value)">
                
                <label for="qty-${item.id}">Qté :</label>
                <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1" max="${item.product.max_quantity}" onchange="updateCartItemQuantity(${item.id}, this.value)">
                
                <button class="remove-btn" onclick="removeFromCart(${item.id})">Supprimer</button>
            </div>
        `;
        container.appendChild(itemDiv);
    });
}

function updateCartItemDate(itemId, type, dateValue) {
    const itemIndex = panier.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        if (type === 'start') {
            panier[itemIndex].startDate = dateValue;
        } else {
            panier[itemIndex].endDate = dateValue;
        }
        // Validation de la date après la mise à jour
        const item = panier[itemIndex];
        if (item.startDate && item.endDate && (new Date(item.startDate) > new Date(item.endDate))) {
            alert("La date de début ne peut pas être postérieure à la date de fin. Veuillez corriger.");
            // Optionnel : Réinitialiser la date invalide
        }
        updateCartUI();
    }
}

function updateCartItemQuantity(itemId, newQuantity) {
    const itemIndex = panier.findIndex(item => item.id === itemId);
    const quantity = parseInt(newQuantity) || 1;
    
    if (itemIndex > -1) {
        const maxQty = parseInt(panier[itemIndex].product.max_quantity) || 1;
        if (quantity > maxQty) {
            alert(`La quantité maximale pour ${panier[itemIndex].product.name} est de ${maxQty}.`);
            // Réinitialiser la valeur de l'input à max_quantity
            document.getElementById(`qty-${itemId}`).value = maxQty;
            panier[itemIndex].quantity = maxQty;
        } else if (quantity < 1) {
            alert("La quantité doit être au moins de 1.");
            document.getElementById(`qty-${itemId}`).value = 1;
            panier[itemIndex].quantity = 1;
        } else {
            panier[itemIndex].quantity = quantity;
        }
        updateCartUI();
    }
}

function removeFromCart(itemId) {
    panier = panier.filter(item => item.id !== itemId);
    updateCartUI();
}

function sendReservationEmail() {
    if (panier.length === 0) {
        alert("Votre panier est vide.");
        return;
    }

    const userEmail = document.getElementById('user-email').value;
    const reservationMessage = document.getElementById('reservation-message').value;
    const isDeliveryChecked = document.getElementById('delivery-checkbox').checked;
    const deliveryAddress = document.getElementById('delivery-address').value;

    if (!userEmail || !userEmail.includes('@')) {
        alert("Veuillez saisir une adresse email valide.");
        return;
    }
    if (isDeliveryChecked && !deliveryAddress.trim()) {
        alert("Vous avez coché la livraison. Veuillez saisir une adresse complète.");
        return;
    }

    let bodyContent = `Demande de Réservation de Matériel\n\n`;
    bodyContent += `Email de contact : ${userEmail}\n`;
    bodyContent += `Livraison demandée : ${isDeliveryChecked ? 'OUI' : 'NON'}\n`;
    if (isDeliveryChecked) {
        bodyContent += `Adresse de livraison : ${deliveryAddress}\n`;
    }
    bodyContent += `\n--- Détails de la Commande ---\n`;

    panier.forEach(item => {
        const priceValue = getPriceValue(item.product.price);
        const subtotal = (priceValue * item.quantity).toFixed(2);
        const dates = (item.startDate && item.endDate) 
            ? ` du ${item.startDate} au ${item.endDate}` 
            : ` (Dates non spécifiées)`;

        bodyContent += `\nID: ${item.product.id} - ${item.product.name}\n`;
        bodyContent += `Prix Unitaire: ${item.product.price}\n`;
        bodyContent += `Quantité: ${item.quantity}\n`;
        bodyContent += `Période: ${dates}\n`;
        bodyContent += `Sous-total estimé: ${subtotal} €\n`;
    });

    const subtotalPrice = panier.reduce((acc, item) => acc + getPriceValue(item.product.price) * item.quantity, 0).toFixed(2);
    bodyContent += `\n----------------------------\n`;
    bodyContent += `TOTAL PRODUITS ESTIMÉ: ${subtotalPrice} €\n`;
    bodyContent += `Coût Livraison: ${isDeliveryChecked ? DELIVERY_INFO_MESSAGE : 'Non demandée'}\n`;
    bodyContent += `\n--- Message Client ---\n`;
    bodyContent += reservationMessage || "Pas de message supplémentaire.";

    const mailtoLink = `mailto:maboitealocangevine@gmail.com?subject=DEMANDE DE RÉSERVATION - ${userEmail}&body=${encodeURIComponent(bodyContent)}`;
    
    // Ouvre le client de messagerie
    window.location.href = mailtoLink;

    alert("Votre demande de réservation est en cours de création dans votre application de messagerie. Veuillez vérifier et envoyer l'email généré.");
    
    // Optionnel : Réinitialiser le panier après la soumission réussie
    // panier = [];
    // updateCartUI();
}

// --- CATALOGUE ---

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        let product = {};
        headers.forEach((header, index) => {
            product[header.trim()] = values[index].trim();
        });
        // Convertir l'ID en nombre pour faciliter la recherche
        product.id = parseInt(product.id); 
        products.push(product);
    }
    return products;
}

function loadProducts() {
    // Le chemin d'accès à votre fichier CSV
    const csvFilePath = 'data.csv'; 

    fetch(csvFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de chargement du fichier CSV : ' + response.statusText);
            }
            return response.text();
        })
        .then(csvText => {
            allProductsData = parseCSV(csvText);
            
            // Création de la navigation par catégories
            createCategoryNav(); 
            
            // Affichage initial
            if (document.querySelector('#catalogue-section').classList.contains('active')) {
                filterProducts('all'); 
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            document.getElementById('product-list-container').innerHTML = `<p style="text-align: center; color: red;">Erreur de chargement du catalogue : ${error.message}</p>`;
        });
}

function createCategoryNav() {
    const navContainer = document.getElementById('catalogue-nav');
    navContainer.innerHTML = '';

    // Bouton "Tous les produits"
    const allBtn = document.createElement('button');
    allBtn.textContent = CATEGORIES['all'];
    allBtn.onclick = () => filterProducts('all');
    allBtn.className = 'active'; // Actif par défaut
    navContainer.appendChild(allBtn);

    // Boutons par catégories
    Object.keys(CATEGORIES).filter(key => key !== 'all').forEach(categoryKey => {
        const btn = document.createElement('button');
        btn.textContent = CATEGORIES[categoryKey];
        btn.onclick = () => filterProducts(categoryKey);
        navContainer.appendChild(btn);
    });
}

function filterProducts(category) {
    // Gestion de la classe active des boutons de catégorie
    document.querySelectorAll('.cat-nav button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === CATEGORIES[category] || (category === 'all' && btn.textContent === CATEGORIES['all'])) {
            btn.classList.add('active');
        }
    });

    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    
    // Filtrage des produits
    const filteredProducts = allProductsData.filter(product => {
        const matchesCategory = (category === 'all' || product.category === category);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                              product.description.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });

    renderProductList(filteredProducts);
}

function searchProducts() {
    // Récupère la catégorie active pour que la recherche s'applique au filtre actuel
    const activeCategoryBtn = document.querySelector('.cat-nav button.active');
    let activeCategory = 'all'; 

    if (activeCategoryBtn) {
        // Recherche la clé de catégorie à partir du texte du bouton
        activeCategory = Object.keys(CATEGORIES).find(key => CATEGORIES[key] === activeCategoryBtn.textContent) || 'all';
    }

    filterProducts(activeCategory);
}

function renderProductList(products) {
    const listContainer = document.getElementById('product-list-container');
    listContainer.innerHTML = ''; // Vide le conteneur

    if (products.length === 0) {
        listContainer.innerHTML = '<p style="width: 100%; text-align: center; padding: 50px;">Aucun produit ne correspond à votre sélection ou recherche.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-card-body">
                <h4>${product.name}</h4>
                <p>${product.price}</p>
                <button onclick="showProductDetails(${product.id})">Détails et Réservation</button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// --- CARROUSEL ---
// MISE À JOUR 2 : Implémentation des fonctions de gestion du carrousel

function initCarousel() {
    const track = document.getElementById('carousel-track');
    const indicatorsContainer = document.getElementById('carousel-indicators');

    if (!track || !indicatorsContainer || carouselImages.length === 0) {
        // Le carrousel ne s'initialise pas s'il n'y a pas d'images
        return;
    }

    // Réinitialisation
    track.innerHTML = '';
    indicatorsContainer.innerHTML = '';
    slideIndex = 0;
    totalSlides = carouselImages.length;

    // Création des slides et des indicateurs
    carouselImages.forEach((imageUrl, index) => {
        // Crée la slide (div avec l'image)
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = `Photo de matériel de location ${index + 1}`;
        slide.appendChild(img);
        track.appendChild(slide);

        // Crée l'indicateur (point)
        const indicator = document.createElement('span');
        indicator.onclick = () => showSlide(index);
        indicatorsContainer.appendChild(indicator);
    });

    // Affiche la première slide et active le premier indicateur
    showSlide(slideIndex);
    startCarousel(); // Démarre l'intervalle après l'initialisation
}

function showSlide(index) {
    const track = document.getElementById('carousel-track');
    const indicators = document.querySelectorAll('#carousel-indicators span');
    
    if (index >= totalSlides) {
        slideIndex = 0;
    } else if (index < 0) {
        slideIndex = totalSlides - 1;
    } else {
        slideIndex = index;
    }

    if (track) {
        const offset = -slideIndex * 100;
        track.style.transform = `translateX(${offset}%)`;
    }

    indicators.forEach((indicator, i) => {
        indicator.classList.remove('active');
        if (i === slideIndex) {
            indicator.classList.add('active');
        }
    });
}

function moveCarousel(direction) {
    showSlide(slideIndex + direction);
    clearInterval(carouselInterval);
    startCarousel(); // Redémarre l'autoplay après une interaction manuelle
}

function startCarousel() {
    const accueilSection = document.getElementById('accueil-section');
    // Démarre l'autoplay uniquement si nous sommes sur la section d'accueil
    if (accueilSection && accueilSection.classList.contains('active')) {
        clearInterval(carouselInterval); // Assurer qu'il n'y a qu'un seul intervalle
        carouselInterval = setInterval(() => {
            moveCarousel(1); // Passe à la slide suivante
        }, 5000); // Change toutes les 5 secondes
    }
}


// --- INITIALISATION FINALE ---
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    // showSection('accueil') est appelé implicitement par la classe 'active'
    // initCarousel() est appelé dans le bloc DOMContentLoaded ci-dessus
});