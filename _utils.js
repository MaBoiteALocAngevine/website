// Dépendances: _config.js (nécessite allProductsData, selectedProductForModal, closeModal)

// --- UTILITAIRES DIVERS ---

/**
 * Affiche une notification toast.
 * @param {string} message Le message à afficher.
 */
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    if (toast) {
        toast.textContent = message;
        toast.classList.add("show");
        // Retire la notification après 3 secondes (doit correspondre au CSS)
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000); 
    }
}

// --- GESTION DE LA MODALE PRODUIT ---

/**
 * Affiche les détails d'un produit dans la modale.
 * @param {number} productId L'ID du produit à afficher.
 */
function showProductDetails(productId) {
    const product = allProductsData.find(p => p.id == productId);
    if (!product) return;

    selectedProductForModal = product;
    const modal = document.getElementById('product-modal');
    
    // Remplissage de la modale
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-image').src = product.image_url;
    document.getElementById('modal-description').innerHTML = product.description;
    document.getElementById('modal-price').textContent = product.price;
    document.getElementById('modal-caution').textContent = product.caution;
    document.getElementById('modal-max-quantity').textContent = `Quantité max : ${product.max_quantity}`;
    
    // Réinitialiser les champs de la modale
    document.getElementById('modal-quantity').value = 1;
    document.getElementById('modal-start-date').value = '';
    document.getElementById('modal-end-date').value = '';

    // Afficher la modale
    if (modal) {
        modal.style.display = "block";
    }
}

/**
 * Ferme la modale.
 */
function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = "none";
    }
}

// Fermeture de la modale si l'utilisateur clique en dehors
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        closeModal();
    }
}

// --- UTILITAIRES DE PRIX ET CALCULS ---

/**
 * Extrait le montant et l'unité d'une chaîne de prix.
 * @param {string} priceString Chaîne de prix (ex: "15,00 €/jour").
 * @returns {object} {priceValue: number, isDaily: boolean}
 */
function extractPriceDetails(priceString) {
    const match = priceString.match(/([\d\s,]+)\s*€\s*(\/(jour|forfait))?/i);
    if (!match) return { priceValue: 0, isDaily: false };

    // Nettoyer la valeur (remplacer la virgule par un point, supprimer les espaces)
    const cleanedValue = match[1].replace(/,/g, '.').replace(/\s/g, '');
    const priceValue = parseFloat(cleanedValue);
    const isDaily = priceString.toLowerCase().includes('/jour');

    return { priceValue, isDaily };
}

/**
 * Calcule le prix total d'un article en fonction de la durée de location.
 * @param {object} item L'objet panier (avec les détails du produit et les dates/quantités).
 * @returns {number} Le prix total calculé.
 */
function calculateItemPrice(item) {
    const { priceValue, isDaily } = extractPriceDetails(item.price);
    
    if (!isDaily || !item.startDate || !item.endDate) {
        // Prix forfaitaire ou dates manquantes, on multiplie juste par la quantité
        return priceValue * item.quantity;
    }

    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    // Calculer le nombre de jours (incluant le jour de départ et d'arrivée)
    const timeDifference = end.getTime() - start.getTime();
    let dayCount = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
    
    // S'assurer qu'il y a au moins 1 jour
    if (dayCount <= 0) dayCount = 1;

    return priceValue * dayCount * item.quantity;
}

/**
 * Formate une date au format YYYY-MM-DD vers DD/MM/YYYY
 * @param {string} dateString La chaîne de date YYYY-MM-DD
 * @returns {string} La date formatée DD/MM/YYYY
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Utilisez toLocaleDateString pour le format français
    return date.toLocaleDateString('fr-FR');
}