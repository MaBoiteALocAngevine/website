// --- UTILS.JS ---
// Ne contient PAS de déclaration de 'allProductsData' (c'est fait dans config.js)

/**
 * Affiche une notification toast.
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

/**
 * Extrait la valeur numérique du prix et vérifie s'il s'agit d'un prix journalier.
 */
function extractPriceDetails(priceString) {
    const cleanedValue = priceString.replace(/€/g, '').replace(/[^\d.,]/g, '').replace(',', '.').trim();
    const priceValue = parseFloat(cleanedValue) || 0;
    const isDaily = priceString.toLowerCase().includes('/ jour');
    const isPerson = priceString.toLowerCase().includes('/ personne');
    return { priceValue, isDaily, isPerson };
}

/**
 * Calcule le prix total d'un article dans le panier, incluant la durée si journalier.
 */
function calculateItemPrice(item) {
    const product = allProductsData.find(p => p.id === item.id);
    if (!product) return 0;

    const { priceValue, isDaily } = extractPriceDetails(product.price);
    
    // Le prix n'est pas journalier (forfait, par personne, etc.)
    if (!isDaily || !item.startDate || !item.endDate) {
        return priceValue * item.quantity;
    }

    // Calcul de la durée de location en jours
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
 * Parse un contenu CSV en un tableau d'objets JavaScript.
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        // Utilise une regex pour gérer les valeurs entre guillemets contenant des virgules
        const values = line.match(/(?:\"([^\"]*)\"|([^,]+))/g).map(v => v.replace(/^"|"$/g, '').trim());
        if (values.length !== headers.length) {
            console.error(`Erreur de parsing à la ligne ${i + 1}. Nombre de colonnes incorrect.`);
            continue;
        }
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            let key = headers[j].trim();
            let value = values[j] || '';
            // Tente de convertir en nombre si possible
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                value = Number(value);
            }
            obj[key] = value;
        }
        data.push(obj);
    }
    return data;
}