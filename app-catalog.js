window.allProductsData = []; // Variable globale accessible par app-ui.js
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

function normalizeText(text) {
    if (!text) return "";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
        window.allProductsData = products;
        renderCategoryButtons();
        renderProductList(window.allProductsData);
        if (document.getElementById('loading-message')) document.getElementById('loading-message').style.display = 'none';
        const carImgs = window.allProductsData.filter(p => p.carrousel?.toLowerCase().trim() === 'oui').map(p => p.image_url);
        if (typeof initCarouselUI === "function") initCarouselUI(carImgs);
    } catch (e) { console.error("Erreur chargement catalogue:", e); }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = products.length ? '' : '<div class="empty-state">Aucun produit trouvé pour cette recherche.</div>';
    
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-wrapper" onclick="openModal(${p.id})">
                <img src="${p.image_url || 'images/placeholder.jpg'}" alt="${p.name}" loading="lazy">
                <div class="image-overlay"><span>Voir détails</span></div>
            </div>
            <div class="product-card-body">
                <h4 onclick="openModal(${p.id})">${p.name}</h4>
                <p class="product-price">${p.price}</p>
                <button class="primary-action-btn card-btn" onclick="openModal(${p.id})">Détails & Réservation</button>
            </div>`;
        container.appendChild(card);
    });
}

function searchProducts() {
    const term = normalizeText(document.getElementById('product-search').value);
    const filtered = window.allProductsData.filter(p => normalizeText(p.name).includes(term) || normalizeText(p.description).includes(term));
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
            renderProductList(key === 'all' ? window.allProductsData : window.allProductsData.filter(p => p.category === key));
        };
        if (key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}