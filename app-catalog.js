let allProductsData = [];
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

function normalizeText(text) {
    if (!text) return "";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Calcule la distance entre deux mots (Fuzzy Search)
function levenshteinDistance(a, b) {
    const tmp = [];
    for (let i = 0; i <= a.length; i++) tmp[i] = [i];
    for (let j = 0; j <= b.length; j++) tmp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            tmp[i][j] = Math.min(
                tmp[i - 1][j] + 1,
                tmp[i][j - 1] + 1,
                tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }
    return tmp[a.length][b.length];
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else current += char;
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
}

async function loadProductsFromCSVFile() {
    try {
        const response = await fetch('data.csv');
        const csvData = await response.text();
        const lines = csvData.split(/\r?\n/);
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const values = parseCSVLine(line);
            if (values.length >= headers.length) {
                let p = {};
                headers.forEach((h, index) => p[h] = values[index]);
                p.id = parseInt(p.id);
                p.max_quantity = parseInt(p.max_quantity) || 1;
                if (p.publication && p.publication.toLowerCase().trim() === 'non') continue;
                products.push(p);
            }
        }
        allProductsData = products;
        renderCategoryButtons();
        renderProductList(allProductsData);
        if (document.getElementById('loading-message')) document.getElementById('loading-message').style.display = 'none';
        const carImgs = allProductsData.filter(p => p.carrousel?.toLowerCase().trim() === 'oui').map(p => p.image_url);
        initCarouselUI(carImgs);
    } catch (e) { console.error(e); }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = products.length ? '' : '<p>Aucun produit trouvé.</p>';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_url || 'images/placeholder.jpg'}" alt="${p.name}">
            <div class="product-card-body">
                <h4>${p.name}</h4>
                <p class="description-snippet">${p.description ? p.description.substring(0, 80) : ''}...</p>
                <p class="product-price">${p.price} <span style="font-size:0.8em">TTC</span></p>
                <button onclick="openModal(${p.id})">Détails et Location</button>
            </div>`;
        container.appendChild(card);
    });
}

function searchProducts() {
    const term = normalizeText(document.getElementById('product-search').value);
    if (term.length < 2) { // Si moins de 2 lettres, on affiche tout
        renderProductList(allProductsData);
        return;
    }

    const filtered = allProductsData.filter(p => {
        const name = normalizeText(p.name);
        const desc = normalizeText(p.description);
        
        // 1. Test classique (contient le mot)
        if (name.includes(term) || desc.includes(term)) return true;

        // 2. Test Fuzzy (mot à mot pour être précis)
        const words = name.split(' ');
        return words.some(word => {
            if (word.length < 3) return false;
            // On autorise 1 erreur si le mot est court, 2 si le mot est long
            const maxErrors = word.length > 5 ? 2 : 1;
            return levenshteinDistance(word, term) <= maxErrors;
        });
    });
    
    renderProductList(filtered);
}

function renderCategoryButtons() {
    const nav = document.getElementById('catalogue-nav');
    if (!nav) return;
    nav.innerHTML = '';
    Object.keys(CATEGORIES).forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = CATEGORIES[key];
        btn.onclick = () => {
            document.querySelectorAll('.cat-nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProductList(key === 'all' ? allProductsData : allProductsData.filter(p => p.category === key));
        };
        if (key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}