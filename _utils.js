// Dépend de _config.js
// =================================================================
// 2. ÉTATS GLOBAUX (Variables partagées)
// =================================================================
let allProductsData = [];
let carouselProducts = [];
let panier = [];
let currentCarouselIndex = 0;
let carouselInterval = null; 

// =================================================================
// 3. UTILITAIRES 
// =================================================================

/**
 * Convertit une chaîne CSV en un tableau d'objets JavaScript.
 */
function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        
        const values = line.match(/(?:\"([^\"]*)\"|([^,]+))/g).map(v => v.replace(/^"|"$/g, '').trim());

        if (values.length !== headers.length) {
            console.error(`Erreur de parsing à la ligne ${i + 1}. Nombre de colonnes incorrect.`);
            continue;
        }

        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            let key = headers[j].trim();
            let value = values[j] || '';
            
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                value = Number(value);
            }
            
            obj[key] = value;
        }
        data.push(obj);
    }
    return data;
}

/**
 * Extrait la valeur numérique du prix et vérifie s'il s'agit d'un prix journalier.
 */
function extractPriceDetails(priceString) {
    const cleanedValue = priceString.replace(/€/g, '').replace(/[^\d.,]/g, '').replace(',', '.').trim();
    const priceValue = parseFloat(cleanedValue) || 0;
    const isDaily = priceString.toLowerCase().includes('/jour');

    return { priceValue, isDaily };
}

/**
 * Calcule le prix total d'un article en fonction de la durée de location.
 */
function calculateItemPrice(item) {
    const product = allProductsData.find(p => p.id === item.id);
    if (!product) return 0;

    const { priceValue, isDaily } = extractPriceDetails(product.price);
    
    if (!isDaily || !item.startDate || !item.endDate) {
        return priceValue * item.quantity;
    }

    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    const timeDifference = end.getTime() - start.getTime();
    let dayCount = Math.ceil(timeDifference / (1000 * 3600 * 24)) + 1;
    
    if (dayCount <= 0 || isNaN(dayCount)) dayCount = 1;

    return priceValue * dayCount * item.quantity;
}

/**
 * Calcule la caution totale d'un article
 */
function calculateItemCaution(item) {
    const product = allProductsData.find(p => p.id === item.id);
    if (!product) return 0;

    const cautionString = product.caution.toString().replace('€', '').trim();
    const cautionValue = parseFloat(cautionString) || 0;
    
    return cautionValue * item.quantity; 
}

/**
 * Formate une date au format YYYY-MM-DD vers DD/MM/YYYY
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Affiche une notification (toast).
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}