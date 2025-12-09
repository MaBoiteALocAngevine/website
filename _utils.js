// --- _utils.js ---
// Fonctions utilitaires
// Dépendances: _config.js

/**
 * Affiche une notification temporaire (toast) à l'utilisateur.
 * @param {string} message Le message à afficher.
 */
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    if (toast) {
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000); // 3 secondes
    }
}

/**
 * Extrait la valeur numérique du prix et détermine s'il est journalier.
 * @param {string} priceString La chaîne de prix (ex: "6 € / jour", "1.5 € / personne").
 * @returns {object} { priceValue: number, isDaily: boolean }
 */
function extractPriceDetails(priceString) {
    // Nettoyer la chaîne (retirer le symbole €, / jour, / personne, etc.)
    let cleanedValue = priceString.replace(/[^\d,\.]/g, '').replace(',', '.');
    const priceValue = parseFloat(cleanedValue);
    const isDaily = priceString.toLowerCase().includes('/ jour');

    return { priceValue, isDaily };
}

/**
 * Calcule le prix total d'un article en fonction de la durée de location.
 * @param {object} item L'objet panier (avec les détails du produit et les dates/quantités).
 * @returns {number} Le prix total calculé.
 */
function calculateItemPrice(item) {
    // Utilise la chaîne de prix d'origine du produit pour déterminer si c'est journalier
    const product = allProductsData.find(p => p.id === item.id);
    if (!product) return 0;
    
    const { priceValue, isDaily } = extractPriceDetails(product.price);

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
    if (dayCount <= 0 || isNaN(dayCount)) dayCount = 1;

    return priceValue * dayCount * item.quantity;
}

/**
 * Calcule la caution totale d'un article
 * @param {object} item L'objet panier
 * @returns {number} La caution totale
 */
function calculateItemCaution(item) {
    const product = allProductsData.find(p => p.id === item.id);
    if (!product) return 0;

    // Assure que la caution est un nombre
    const cautionString = product.caution.replace('€', '');
    const cautionValue = parseFloat(cautionString);
    if (isNaN(cautionValue)) return 0;
    
    // Pour les cautions unitaires, on multiplie par la quantité
    return cautionValue * item.quantity; 
}

/**
 * Calcule la caution totale pour l'ensemble du panier.
 * @returns {number} La caution totale.
 */
function calculateTotalCaution() {
    return panier.reduce((sum, item) => sum + calculateItemCaution(item), 0);
}

/**
 * Formate une date au format YYYY-MM-DD vers DD/MM/YYYY
 * @param {string} dateString La date au format YYYY-MM-DD.
 * @returns {string} La date formatée DD/MM/YYYY.
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}