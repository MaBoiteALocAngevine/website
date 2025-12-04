// --- VARIABLES GLOBALES ---
let allProductsData = [];
let carouselImagesData = []; // Liste des images pour le carrousel
let slideIndex = 0;
let totalSlides = 0;
let carouselInterval;
let selectedProductForModal = null;
let panier = JSON.parse(localStorage.getItem('panier')) || []; // Chargement depuis le stockage local
const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis)";
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com"; 

const CATEGORIES = {
    'all': 'Tous les produits',
    'evenementiel': 'Événementiel',
    'outillage': 'Outillage'
};

// --- MODE SOMBRE ET INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
         // Fonction de bascule du mode sombre
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            // Sauvegarder la préférence de mode sombre
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
    // Appliquer la préférence de mode sombre
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    // Initialisation de l'application
    initApp(); 
});

function initApp() {
    loadProductsFromCSVFile();

    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', handleSubmitReservation);
    }

    // Assurer que le premier lien est actif au démarrage
    const firstLink = document.querySelector('.main-nav ul li a');
    if (firstLink) {
        firstLink.classList.add('active');
    }
    showSection('accueil'); // Afficher la section d'accueil par défaut
    updateCartCount(); // Mise à jour du compteur au chargement
}

// --- NAVIGATION ---
function showSection(sectionId) {
    // Gestion du carrousel
    if (sectionId !== 'accueil') {
        clearInterval(carouselInterval);
    } else {
        // Ne démarrer le carrousel que s'il y a des slides
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
        // Utilisation d'un attribut data-section pour une identification plus propre
        const linkSectionId = link.getAttribute('onclick').match(/showSection\('(.+?)'\)/)?.[1];
        if (linkSectionId === sectionId) {
            link.classList.add('active');
        }
    });

    // Afficher/Masquer la navigation par catégorie
    const catNav = document.getElementById('catalogue-nav');
    if (sectionId === 'catalogue') {
        catNav.style.display = 'flex'; // Utiliser flex pour l'alignement
        // Assurez-vous que les produits sont filtrés sur 'all' si aucune autre catégorie n'est sélectionnée
        if (!document.querySelector('.cat-nav button.active') && allProductsData.length > 0) {
            filterProducts('all'); 
        }
    } else {
        catNav.style.display = 'none';
    }
}

// --- NOTIFICATION TOAST ---
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return; // Sécurité
    toast.textContent = message;
    toast.classList.add("show");
    
    // Masquer le toast après 3 secondes
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// --- MODALE PRODUIT ---
function showProductDetails(productId) {
    const modal = document.getElementById('product-modal');
    // Important: utilisez == pour comparer le string id du produit avec l'ID du produit dans le tableau
    const product = allProductsData.find(p => p.id == productId); 
    if (product) {
        selectedProductForModal = product;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-image').src = product.image_url; 
        
        // CORRECTION/AMÉLIORATION : Afficher la caution dans la modale
        document.getElementById('modal-description').innerHTML = product.description.replace(/\n/g, '<br>');
        document.getElementById('modal-price').innerHTML = `Prix: <strong>${product.price}</strong>`;
        document.getElementById('modal-caution').innerHTML = `Caution Unitaire: <strong>${product.caution}</strong>`; 

        document.getElementById('modal-quantity').value = 1;
        document.getElementById('modal-quantity').max = product.max_quantity;
        document.getElementById('modal-start-date').value = '';
        document.getElementById('modal-end-date').value = '';

        document.getElementById('modal-max-quantity-info').textContent = `Max disponible : ${product.max_quantity}`;
        modal.style.display = "flex"; // Utiliser flex pour centrer la modale
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
        modal.style.display = "none";
        selectedProductForModal = null;
    }
};

// --- LOGIQUE PANIER ---

function extractPriceDetails(priceString) {
    // Regex pour extraire le nombre (accepte , ou .)
    const priceMatch = priceString.match(/([\d\.,]+)/);
    
    // Détermination de l'unité de prix
    const unitMatch = priceString.toLowerCase().includes('jour') ? 'per_day' : 
                      priceString.toLowerCase().includes('personne') ? 'per_person' :
                      'flat_rate'; 

    let priceValue = 0;
    if (priceMatch) {
        // Remplacer la virgule par un point pour le parseFloat
        priceValue = parseFloat(priceMatch[1].replace(',', '.'));
    }
    return { value: priceValue, unit: unitMatch, unitString: priceString.match(/€\s*(\/.+)?/)?.[1]?.trim() || '' };
}

function calculateItemPrice(item) {
    const { product, quantity, startDate, endDate } = item;
    const { value, unit } = extractPriceDetails(product.price);
    const cautionValue = parseFloat(product.caution.replace('€', '').trim()) || 0;
    
    let basePrice = value;
    let multiplier = 1;
    let warning = null;
    let isDaily = unit === 'per_day';

    if (isDaily) {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            // Calcule la différence en jours et ajoute 1 pour inclure les deux dates (location J0 au J+1 = 2 jours)
            const diffTime = end.getTime() - start.getTime(); // Utilisez getTime()
            // Assurez-vous que la date de fin est >= la date de début
            if (diffTime < 0) {
                 warning = " (Erreur de dates: Début > Fin. Est. 1 jour.)";
                 multiplier = 1;
            } else {
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                 multiplier = diffDays;
            }

        } else {
            warning = " (Est. 1 jour. Veuillez spécifier les dates pour le calcul réel)";
            multiplier = 1; 
        }
    } else if (unit === 'per_person') {
         // Pour 'per_person', le prix est appliqué par personne. La quantité est le nombre de personnes/sets.
         multiplier = 1; 
    } else {
         // Pour 'flat_rate', le multiplicateur est 1
         multiplier = 1; 
    }
    
    const totalPrice = basePrice * multiplier * quantity;
    const totalCaution = cautionValue * quantity;
    
    return {
        total: totalPrice,
        totalCaution: totalCaution,
        unit: unit,
        multiplier: multiplier,
        warning: warning,
        isDaily: isDaily
    };
}

function saveCart() {
    localStorage.setItem('panier', JSON.stringify(panier));
}

function addToCartFromModal() {
    if (selectedProductForModal) {
        const qtyInput = document.getElementById('modal-quantity');
        const startDate = document.getElementById('modal-start-date').value;
        const endDate = document.getElementById('modal-end-date').value;
        const quantity = parseInt(qtyInput.value) || 1;

        if (quantity < 1) {
             showToast("Erreur: La quantité doit être supérieure à zéro.");
             return;
        }

        if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
            showToast("Erreur: La date de début ne peut pas être postérieure à la date de fin.");
            return;
        }
        
        // Vérification de la disponibilité max (même si déjà dans la modale)
        const max = parseInt(selectedProductForModal.max_quantity);
        if (quantity > max) {
            showToast(`⚠️ Max disponible : ${max} unités pour ${selectedProductForModal.name}.`);
            qtyInput.value = max;
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
        saveCart(); // Sauvegarde
        closeModal();
        updateCartCount();
        showToast(`✅ ${item.product.name} (x${quantity}) ajouté à la demande de réservation.`);
    }
}

function updateCartCount() {
    document.getElementById('cart-count').textContent = panier.length;
    const validateBtn = document.querySelector('#reservation-form .validate-btn');
    const userEmailInput = document.getElementById('user-email');
    
    // Le bouton est activé si le panier n'est pas vide
    const isValid = panier.length > 0;
    validateBtn.disabled = !isValid;
    renderCartSummary(); 
}

// Lier l'événement 'input' de l'email à la mise à jour du bouton (pas strictement nécessaire si on valide l'email à l'envoi)
document.addEventListener('input', (event) => {
    if (event.target.id === 'user-email') {
        // La validation finale de l'email se fait au submit pour plus de fluidité
    }
});

function handleDeliveryChange() {
    const isChecked = document.getElementById('delivery-checkbox').checked;
    const addressGroup = document.getElementById('delivery-address-group');
    const infoSpan = document.getElementById('delivery-info');
    
    if (infoSpan) infoSpan.textContent = isChecked ? DELIVERY_INFO_MESSAGE : '';
    if (addressGroup) addressGroup.style.display = isChecked ? 'block' : 'none';
    renderCartSummary();
}

function renderCartSummary() {
    let totalEstimate = 0;
    let totalCaution = 0;
    let totalItems = 0;

    panier.forEach(item => {
        const itemPriceCalc = calculateItemPrice(item);
        totalEstimate += itemPriceCalc.total;
        totalCaution += itemPriceCalc.totalCaution; // Ajout de la caution
        totalItems += item.quantity;
    });

    const totalItemsElement = document.getElementById('cart-total-price');
    if (totalItemsElement) totalItemsElement.textContent = `${totalItems} article(s)`;
    
    const totalEstimateElement = document.getElementById('cart-total-estimate');
    if (totalEstimateElement) {
        if (totalEstimate > 0) {
            totalEstimateElement.textContent = `${totalEstimate.toFixed(2)} € (Est. HT)`;
            totalEstimateElement.style.color = 'var(--primary-color)';
        } else {
            totalEstimateElement.textContent = "0.00 €";
            // totalEstimateElement.style.color est géré par le CSS
        }
    }

    // CORRECTION/AMÉLIORATION : Affichage de la caution totale
    const totalCautionElement = document.getElementById('cart-total-caution');
    if (totalCautionElement) {
        totalCautionElement.textContent = `${totalCaution.toFixed(2)} €`;
    }

    // AMÉLIORATION : Affichage de la politique de caution
    const policyContainer = document.getElementById('cart-policy-info');
    if (policyContainer) {
        policyContainer.innerHTML = `
            <p><strong>Rappel Important :</strong> Le total estimé ci-dessus est **Hors Taxes (HT)** et ne comprend pas les frais de livraison éventuels.</p>
            <p><strong>Caution Totale :</strong> Le montant de **${totalCaution.toFixed(2)} €** est requis comme dépôt de garantie.</p>
            <p class="caution-return-note">Le dépôt de garantie sera restitué intégralement après vérification du matériel au retour.</p>
        `;
    }
}


function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return; // Sécurité
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
        const itemCautionPrice = (itemPriceCalc.totalCaution / item.quantity).toFixed(2); // Caution unitaire
        
        const itemWarning = itemPriceCalc.warning ? `<br><small style="color: #A44C3A; font-weight: 600;">${itemPriceCalc.warning}</small>` : '';
        
        const datesDisplay = itemPriceCalc.isDaily ? (
            (item.startDate && item.endDate) ? 
            `Du: <strong>${item.startDate}</strong> au: <strong>${item.endDate}</strong> (${itemPriceCalc.multiplier}j)` : 
            `Période: Non spécifiée`
        ) : `Période: Sans impact sur le prix unitaire`;

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';

        itemElement.innerHTML = `
            <img src="${item.product.image_url}" alt="${item.product.name}">
            <div class="item-details">
                <h4>${item.product.name}</h4>
                <p>${datesDisplay}</p>
                <p>Prix unitaire: ${item.product.price}</p>
                <p class="cart-item-caution">Caution unitaire: ${itemCautionPrice} €</p>
                <p><strong>Est. Coût Total : ${itemTotalPrice} €</strong> ${itemWarning}</p>
            </div>
            <div class="item-controls">
                <label>Qté: 
                    <input type="number" value="${item.quantity}" min="1" max="${item.product.max_quantity}" 
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
        
        saveCart();
        renderCart();
    }
}

function removeFromCart(itemId) {
    panier = panier.filter(item => item.id !== itemId);
    saveCart();
    renderCart();
    updateCartCount();
}

function handleSubmitReservation(event) {
    event.preventDefault(); 

    const form = event.target;
    const userEmailInput = document.getElementById('user-email');
    
    if (panier.length === 0) {
        showToast("Votre panier est vide. Veuillez ajouter des articles avant de valider.");
        return;
    }

    const userEmail = userEmailInput.value.trim();
    if (!userEmail || !userEmail.includes('@')) {
        showToast("Veuillez entrer une adresse email valide pour la réservation.");
        userEmailInput.focus();
        return;
    }

    // 1. Mise à jour de la destination du formulaire
    form.action = `https://formsubmit.co/${BUSINESS_EMAIL}`;

    // 2. Génération du corps de l'e-mail détaillé
    const isDelivery = document.getElementById('delivery-checkbox').checked;
    const deliveryAddress = isDelivery ? document.getElementById('delivery-address').value.trim() : 'Non demandée (Retrait sur place)';
    const reservationMessage = document.getElementById('reservation-message').value.trim() || 'Aucun message supplémentaire.';

    let priceDetails = '';
    let totalEstimate = 0;
    let totalCaution = 0;
    let totalItems = 0;

    panier.forEach(item => {
        const itemPriceCalc = calculateItemPrice(item);
        totalEstimate += itemPriceCalc.total;
        totalCaution += itemPriceCalc.totalCaution;
        totalItems += item.quantity;
        
        const dates = itemPriceCalc.isDaily ? (
            (item.startDate && item.endDate) ? 
            `Du ${item.startDate} au ${item.endDate} (${itemPriceCalc.multiplier} jour(s))` : 
            `Non spécifiée.`
        ) : `Non applicable (Tarif forfaitaire).`;

        const calculatedPriceLine = itemPriceCalc.isDaily ? 
            `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR (Basé sur ${itemPriceCalc.multiplier}j)` : 
            `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR`;

        const cautionLine = `Caution Unitaire : ${item.product.caution} | Caution Totale : ${itemPriceCalc.totalCaution.toFixed(2)} EUR`;

        // FORMATAGE SIMPLE TEXTE
        priceDetails += `
-------------------------------------------------------
ARTICLE ${item.product.id} : ${item.product.name}
-------------------------------------------------------
Quantité : x${item.quantity}
Prix unitaire : ${item.product.price}
Période souhaitée : ${dates}
Estimation Coût : ${calculatedPriceLine}
${cautionLine}
`;
    });

    const emailBody = `Bonjour,

Nous vous remercions pour votre demande de réservation. Voici le récapitulatif des articles demandés.

=======================================================
RECAPITULATIF DE LA DEMANDE
=======================================================
${priceDetails.trim()}

=======================================================
INFORMATIONS COMPLEMENTAIRES
=======================================================
Email du client : ${userEmail}
Demande de livraison : ${isDelivery ? 'OUI' : 'NON'}
Adresse de livraison (si demandée) : ${deliveryAddress}
Message du client : ${reservationMessage}

=======================================================
ESTIMATION GLOBALE (HORS LIVRAISON)
=======================================================
Nombre total d'articles : ${totalItems}
Estimation du Total HT des articles : ${totalEstimate.toFixed(2)} EUR
Caution Totale Requise : ${totalCaution.toFixed(2)} EUR
(Ce montant est une estimation et sera confirmé par devis après vérification des disponibilités et ajout des frais de livraison éventuels.)

=======================================================
CONTACT RAPIDE
=======================================================
Si vous souhaitez apporter des modifications à cette demande ou obtenir des précisions rapides,
vous pouvez nous envoyer un e-mail directement à : ${BUSINESS_EMAIL}

Nous vous recontacterons sous 24h ouvrées pour finaliser la réservation.
Cordialement,
L'équipe Ma boîte à loc' Angevine
`;
    
    // 3. Injection du corps de l'e-mail dans le champ caché
    document.getElementById('email-body-content').value = emailBody.trim();

    // 4. Champs cachés pour le service de formulaire (FormSubmit)
    document.getElementById('hidden-subject').value = `Demande de Réservation Matériel (${totalItems} articles) - Est. ${totalEstimate.toFixed(2)} EUR`;
    document.getElementById('hidden-replyto').value = userEmail;
    document.getElementById('hidden-cc').value = userEmail;


    // 5. Soumission effective du formulaire
    // form.submit();

    // 6. Affichage de la notification toast 
    showToast("📧 Votre demande de réservation est en cours d'envoi !");

    // 7. Réinitialisation
    panier = [];
    saveCart();
    document.getElementById('reservation-message').value = '';
    document.getElementById('delivery-checkbox').checked = false;
    handleDeliveryChange(); 
    renderCart();
}


// --- LOGIQUE CAROUSEL ---

function initCarousel() {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    const container = document.getElementById('carousel-container');
    
    // Si le conteneur n'existe pas ou si la liste d'images est vide, on s'arrête
    if (!container || carouselImagesData.length === 0) {
         if (container) {
             // Afficher le contenu du conteneur parent (accueil-section) en bloc si le carrousel est masqué
             container.style.display = 'none'; 
         }
        totalSlides = 0;
        return;
    }
    
    container.style.display = 'block'; // S'assurer qu'il est visible s'il y a des slides

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
        // Démarrer seulement si l'accueil est la section active
        if (document.getElementById('accueil-section').classList.contains('active')) {
            startCarousel();
        }
    } 
}

function showSlide(index) {
    slideIndex = index;
    if (slideIndex >= totalSlides) { slideIndex = 0; }
    if (slideIndex < 0) { slideIndex = totalSlides - 1; }
    
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
    // Ne démarrer l'intervalle que s'il n'y a pas déjà un intervalle en cours
    if (carouselInterval) clearInterval(carouselInterval);
    if (totalSlides <= 1) return; // Pas besoin de carrousel s'il n'y a qu'une ou zéro slide

    carouselInterval = setInterval(() => {
        moveCarousel(1);
    }, 4000); 
}

// --- LOGIQUE CATALOGUE ET CHARGEMENT CSV ---

// NOUVEAU PARSER CSV ROBUSTE
function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return { headers: [], products: [] };

    // Extraction des entêtes
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    const products = [];

    // Utilisation d'une regex simplifiée pour capturer les champs, en tenant compte des guillemets
    const csvRegex = /("([^"]*)"|[^,]*)(,|$)/g;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let values = [];
        let match;
        let lineCursor = 0;

        while ((match = csvRegex.exec(line)) !== null) {
            // match[1] contient le champ complet (y compris les guillemets si présents)
            // match[2] contient le contenu sans les guillemets (pour les champs entre guillemets)
            let value = match[2] !== undefined ? match[2] : match[1];

            // Retirer les guillemets inutiles sur les valeurs non capturées par match[2]
            value = value.replace(/^"|"$/g, '').trim();
            
            // Remplacer les <br> par des sauts de ligne si nécessaire pour le HTML
            value = value.replace(/<br>/g, '\n'); 
            
            values.push(value);
            lineCursor = csvRegex.lastIndex;

            // Sortir si nous sommes à la fin de la ligne sans séparateur final
            if (lineCursor >= line.length && match[3] === '') break;
        }

        if (values.length === headers.length) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = values[index];
            });
            products.push(product);
        } else {
             console.warn(`Ligne ignorée (format incorrect, ${values.length} col. vs ${headers.length} attendues): ${line}`);
        }
    }
    return { headers, products };
}


async function loadProductsFromCSVFile() {
    const csvFilePath = 'data.csv'; 
    
    try {
        const response = await fetch(csvFilePath);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const compiledText = await response.text();
        
        // Utilisation du nouveau parser
        const { products } = parseCSV(compiledText); 
        
        allProductsData = products;
        
        // Filtrer les images pour le carrousel
        carouselImagesData = allProductsData
            .filter(p => p.carrousel && p.carrousel.toLowerCase().trim() === 'oui' && p.publication && p.publication.toLowerCase().trim() === 'oui') 
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
             loadingMessage.style.color = '#c0392b'; 
        }
    }
}


function renderCategoryButtons() {
    const nav = document.getElementById('catalogue-nav');
    if (!nav) return;
    nav.innerHTML = '';
    
    // Bouton "Tous"
    let buttonAll = document.createElement('button');
    buttonAll.textContent = CATEGORIES['all'];
    buttonAll.onclick = () => filterProducts('all');
    buttonAll.classList.add('active'); 
    nav.appendChild(buttonAll);
    
    // Autres catégories
    // Filtrer les catégories uniques des produits qui sont marqués 'Oui' dans la colonne 'publication'
    const uniqueCategories = [...new Set(allProductsData
        .filter(p => p.publication && p.publication.toLowerCase().trim() === 'oui')
        .map(p => p.category))];
    
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
        // Logique de correspondance pour activer le bouton
        if (btn.textContent.toLowerCase().includes(category.toLowerCase().replace('all', 'tous'))) {
            btn.classList.add('active');
        }
    });

    const productsToFilter = allProductsData.filter(p => p.publication && p.publication.toLowerCase().trim() === 'oui');
    
    const filteredProducts = category === 'all' 
        ? productsToFilter
        : productsToFilter.filter(p => p.category === category);
        
    document.getElementById('product-search').value = ''; 
    renderProductList(filteredProducts);
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    
    // Filtrer sur les produits publiés
    const publishedProducts = allProductsData.filter(p => p.publication && p.publication.toLowerCase().trim() === 'oui');

    const filteredProducts = publishedProducts.filter(product => {
        const name = product.name.toLowerCase();
        const description = product.description.toLowerCase();
        const category = product.category.toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
    });
    
    // Désactiver tous les boutons de catégorie lors d'une recherche
    document.querySelectorAll('#catalogue-nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    renderProductList(filteredProducts);
}

function renderProductList(products) {
    const listContainer = document.getElementById('product-list-container');
    if (!listContainer) return;
    listContainer.innerHTML = ''; 

    if (products.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #777; padding: 30px;">Aucun produit trouvé correspondant à votre recherche.</p>';
        return;
    }

    products.forEach(product => {
        // Remplacer les sauts de ligne par <br> pour l'affichage HTML
        const shortDescription = product.description ? product.description.split('\n')[0] : '';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Utilisation de la caution du CSV pour l'affichage
        const cautionDisplay = product.caution ? `<p class="product-caution">Caution: ${product.caution}</p>` : '';

        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-card-body">
                <h4>${product.name}</h4>
                <p>${shortDescription}...</p>
                <p class="product-price"><strong>${product.price}</strong></p>
                ${cautionDisplay}
                <button onclick="showProductDetails('${product.id}')">Détails / Réserver</button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Chargement initial au démarrage
window.onload = initApp;