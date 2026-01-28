let allProductsData = [];
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
                // Filtrage publication
                if (p.publication && p.publication.toLowerCase().trim() === 'non') continue;
                products.push(p);
            }
        }
        allProductsData = products;
        renderCategoryButtons();
        renderProductList(allProductsData);
        
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) loadingMsg.style.display = 'none';

        const carImgs = allProductsData.filter(p => p.carrousel?.toLowerCase().trim() === 'oui').map(p => p.image_url);
        initCarouselUI(carImgs);
    } catch (e) {
        console.error("Erreur Catalogue:", e);
    }
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
    const filtered = allProductsData.filter(p => normalizeText(p.name).includes(term) || normalizeText(p.description).includes(term));
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