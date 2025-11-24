// --- VARIABLES GLOBALES ---
let allProductsData = [];
let carouselImages = [];
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

    // Le total final est le sous-total produits (car la livraison est sur devis)
    document.getElementById('total-final-price').textContent = productSubtotal.toFixed(2) + ' €';
}


function renderCart() {
    const container = document.getElementById('cart-items-container');
    
    if (panier.length === 0) {
        container.innerHTML = '<div class="empty-cart-message">Votre panier est vide. Ajoutez des articles depuis le Catalogue.</div>';
        const summary = document.querySelector('.cart-summary');
        if (summary) summary.style.display = 'none';
        return;
    }

    const summary = document.querySelector('.cart-summary');
    if (summary) summary.style.display = 'block';
    
    // Mise à jour de l'état de la livraison
    handleDeliveryChange(); 

    container.innerHTML = panier.map(item => {
        const itemId = item.id;
        const maxQty = parseInt(item.product.max_quantity) || 1;
        
        return `
            <div class="cart-item" data-id="${itemId}">
                <div class="item-details">
                    <h4>${item.product.name} (Max: ${maxQty})</h4>
                    <p>Prix unitaire : ${item.product.price}</p>
                </div>
                <div class="item-controls">
                    <label for="qty-${itemId}">Qté:</label>
                    <input type="number" id="qty-${itemId}" onchange="updateItemQuantity(${itemId}, this.value)" value="${item.quantity}" min="1" max="${maxQty}">
                    
                    <label for="start-${itemId}">Début:</label>
                    <input type="date" id="start-${itemId}" onchange="updateItemDate(${itemId}, 'start', this.value)" value="${item.startDate}">
                    
                    <label for="end-${itemId}" style="margin-left: 10px;">Fin:</label>
                    <input type="date" id="end-${itemId}" onchange="updateItemDate(${itemId}, 'end', this.value)" value="${item.endDate}">
                    
                    <button class="remove-btn" onclick="removeItemFromCart(${itemId})">Supprimer</button>
                </div>
            </div>
        `;
    }).join('');
    
    updateCartUI();
}

function updateItemQuantity(itemId, value) {
    const item = panier.find(i => i.id === itemId);
    const newQty = parseInt(value) || 1;
    const maxQty = parseInt(item.product.max_quantity) || 1;
    
    if (item) {
        // S'assure que la quantité est dans les limites [1, maxQty]
        item.quantity = Math.max(1, Math.min(newQty, maxQty));
        
        // Corrige la valeur affichée dans le champ si elle était invalide
        document.getElementById(`qty-${itemId}`).value = item.quantity;
    }
    updateCartUI();
}

function updateItemDate(itemId, type, value) {
    const item = panier.find(i => i.id === itemId);
    if (item) {
        if (type === 'start') {
            item.startDate = value;
        } else {
            item.endDate = value;
        }
    }
}

function removeItemFromCart(itemId) {
    panier = panier.filter(item => item.id !== itemId);
    renderCart();
}

function sendReservationEmail() {
    // 1. Validation de base
    if (panier.length === 0) {
        alert("Votre panier est vide. Veuillez ajouter des articles avant de valider votre demande.");
        return;
    }
    
    // 2. Validation Email
    const userEmail = document.getElementById('user-email').value.trim();
    if (!userEmail || !userEmail.includes('@') || !userEmail.includes('.')) {
        alert("Veuillez renseigner une adresse email valide pour que nous puissions vous répondre.");
        document.getElementById('user-email').focus();
        return;
    }

    // 3. Validation Adresse de Livraison
    const isDeliveryChecked = document.getElementById('delivery-checkbox').checked;
    const deliveryAddress = document.getElementById('delivery-address').value.trim();
    if (isDeliveryChecked && deliveryAddress.length < 10) {
        alert("Vous avez coché 'Livraison'. Veuillez renseigner une adresse complète pour le devis.");
        document.getElementById('delivery-address').focus();
        return;
    }

    // 4. Collecte des données pour l'Email
    const message = document.getElementById('reservation-message').value;
    const subtotal = document.getElementById('total-final-price').textContent;
    
    const deliveryStatus = isDeliveryChecked 
        ? `OUI (Adresse : ${deliveryAddress})\n\nATTENTION: Le coût de la livraison est à déterminer.` 
        : 'NON (Retrait au local)';

    let emailBody = "--- DEMANDE DE RÉSERVATION ---\n\n";
    emailBody += `Email du client : ${userEmail}\n`;
    emailBody += `Livraison demandée : ${deliveryStatus}\n`;
    emailBody += "--------------------------------------\n";

    panier.forEach(item => {
        const start = item.startDate ? ` du ${item.startDate}` : ' (date début non spécifiée)';
        const end = item.endDate ? ` au ${item.endDate}` : ' (date fin non spécifiée)';
        
        emailBody += `Article : ${item.product.name}\n`;
        emailBody += `Quantité : ${item.quantity}\n`;
        emailBody += `Période : ${start}${end}\n`;
        emailBody += `Prix unitaire : ${item.product.price}\n`;
        emailBody += "--------------------------------------\n";
    });

    emailBody += `\nSous-total (Hors livraison) : ${subtotal}\n`;
    emailBody += `\nMessage du client : \n${message || 'Aucun message supplémentaire.'}\n`;
    emailBody += "\nMerci de répondre à cette demande par email.\n";

    // 5. Envoi (Toujours mailto pour le front-end simple)
    const subject = "Nouvelle demande de réservation Ma boîte à loc' Angevine";
    const mailtoLink = `mailto:maboitealocangevine@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;
    
    alert("Votre demande a été préparée ! Veuillez confirmer l'envoi dans la fenêtre de votre boîte mail qui vient de s'ouvrir.");
}


// --- CARROUSEL ---
function loadCarouselImages() {
    // Liste des images réelles à afficher dans le carrousel
    carouselImages = [
        "images/carrousel/giraffe.jpg",
        "images/carrousel/guirlande.jpg",
        "images/carrousel/table.jpg",
        "images/carrousel/tente.jpg"
    ];
    totalSlides = carouselImages.length;

    const track = document.getElementById('carousel-track');
    if (!track) return;

    track.innerHTML = carouselImages.map(src => `
        <div class="carousel-slide">
            <img src="${src}" alt="Image carrousel">
        </div>
    `).join('');

    slideIndex = 0;
    track.style.transform = 'translateX(0%)';
    updateIndicators();

    clearInterval(carouselInterval);
    if (totalSlides > 1) {
        carouselInterval = setInterval(moveToNextSlide, 4000);
    }
}

function moveCarousel(n) {
    const track = document.getElementById('carousel-track');
    if (!track || totalSlides < 2) return;

    clearInterval(carouselInterval);
    slideIndex += n;
    if (slideIndex >= totalSlides) slideIndex = 0;
    if (slideIndex < 0) slideIndex = totalSlides - 1;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    updateIndicators();
    carouselInterval = setInterval(moveToNextSlide, 4000);
}

function moveToNextSlide() {
    moveCarousel(1);
}

function updateIndicators() {
    const indicators = document.getElementById("carousel-indicators");
    if (!indicators) return;
    
    indicators.innerHTML = "";
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("span");
        if (i === slideIndex) dot.classList.add("active");
        
        dot.onclick = () => {
            const diff = i - slideIndex;
            moveCarousel(diff);
        };
        indicators.appendChild(dot);
    }
}

function startCarousel() {
    if (document.getElementById('carousel-track') && document.getElementById('carousel-track').children.length === 0) {
        loadCarouselImages();
    } else {
        clearInterval(carouselInterval);
        if (totalSlides > 1) {
            carouselInterval = setInterval(moveToNextSlide, 4000);
        }
    }
}

// --- CATEGORIES et CATALOGUE --- 

function generateCategoryButtons() {
    const catNav = document.getElementById('catalogue-nav');
    catNav.innerHTML = '';
    for (const key in CATEGORIES) {
        const button = document.createElement('button');
        button.textContent = CATEGORIES[key];
        button.setAttribute('data-category', key);
        button.onclick = () => filterProducts(key);
        catNav.appendChild(button);
    }
}

function filterProducts(category) {
    const container = document.getElementById('product-list-container');
    const filteredProducts = allProductsData.filter(product =>
        category === 'all' || product.category === category
    );
    container.innerHTML = generateProductHTML(filteredProducts);
    document.querySelectorAll('.cat-nav button').forEach(button => {
        button.classList.remove('active');
        if (button.getAttribute('data-category') === category) {
            button.classList.add('active');
        }
    });
    document.getElementById('product-search').value = '';
}

function loadAndDisplayProducts() {
    fetch('data.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de chargement du fichier data.csv (code: ' + response.status + ')');
            }
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.split('\n').filter(r => r.trim() !== '');
            const headers = rows[0].split(',');
            allProductsData = rows.slice(1).map(row => {
                const values = row.split(',');
                const product = {};
                headers.forEach((header, i) => {
                    let value = values[i] ? values[i].trim().replace(/^"|"$/g, '') : '';
                    product[header.trim()] = value;
                });
                // S'assure que max_quantity est un nombre
                product.max_quantity = parseInt(product.max_quantity) || 1;
                return product;
            });
            generateCategoryButtons();
            showSection('accueil'); 
        })
        .catch(error => {
            console.error('Erreur lors du chargement des produits:', error);
            const container = document.getElementById('product-list-container');
            if (container) {
                container.innerHTML = `<p style="color: red; text-align: center;">Catalogue indisponible.<br>Veuillez vérifier votre fichier <b>data.csv</b> et sa structure.</p>`;
            }
            showSection('accueil');
        });
}

// CORRECTION DÉFINITIVE : Passe uniquement l'ID pour éviter les erreurs de syntaxe
function generateProductHTML(products) {
    return products.map(product => {
        // Seul l'ID est passé comme chaîne
        const productId = product.id; 
        
        return `
            <div class="product-card" data-category="${product.category}" data-name="${product.name}">
                <img src="${product.image_url}" alt="${product.name}">
                <div class="product-card-body">
                    <h4>${product.name}</h4>
                    <button onclick="showProductDetails('${productId}')">Détails / Ajouter</button>
                </div>
            </div>
        `;
    }).join('');
}


// --- RECHERCHE ---
function searchProducts() {
    const input = document.getElementById('product-search');
    const filterText = input.value.toUpperCase();
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toUpperCase();
        card.style.display = name.includes(filterText) ? "" : "none";
    });
}

// --- INITIALISATION GLOBALE ---
window.onload = () => {
    loadCarouselImages(); 
    loadAndDisplayProducts(); 
    updateCartUI(); 
};