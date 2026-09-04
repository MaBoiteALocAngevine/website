window.allProductsData = [];
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
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        
        window.allProductsData = lines.slice(1).filter(l => l.trim()).map(line => {
            const values = parseCSVLine(line);
            let p = {};
            headers.forEach((h, i) => p[h] = values[i]);
            
            // --- MAPPING FORMAT GOOGLE MERCHANT ---
            p.id = parseInt(p.id);
            p.name = p.title; // title -> name
            p.inventory = parseInt(p.inventory) || 1;
            
            // Gestion des images (principale + additionnelles)
            let imgList = [p.image_link];
            if (p.additional_image_link) {
                const extras = p.additional_image_link.split(';').map(img => img.trim());
                imgList = imgList.concat(extras);
            }
            p.images = imgList.filter(img => img !== "");
            p.main_image = p.images[0]; 

            // Sécurité Catégorie (car absente du CSV)
            // On définit 'outillage' si l'ID commence par 2, sinon 'evenementiel'
            p.category = (p.id >= 200 && p.id < 300) ? 'outillage' : 'evenementiel';

            return p;
        }).filter(p => p.publication?.toLowerCase() !== 'non');

        renderCategoryButtons();
        renderProductList(window.allProductsData);
        
        if (window.initCarouselUI) {
            const imgs = window.allProductsData.filter(p => p.carrousel?.toLowerCase() === 'oui').map(p => p.main_image);
            window.initCarouselUI(imgs);
        }
        document.getElementById('loading-message').style.display = 'none';
    } catch (e) { console.error("Erreur Catalogue:", e); }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = products.length ? '' : '<div class="empty-state">Aucun produit trouvé.</div>';
    
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-wrapper" onclick="window.openModal(${p.id})">
                <img src="${p.main_image}" alt="Location ${p.name} Angers 49" loading="lazy" width="350" height="233">
                <div class="image-overlay"></div>
            </div>
            <div class="product-card-body">
                <h4 onclick="window.openModal(${p.id})">${p.name}</h4>
                <p class="product-price">${p.price.replace('.00 EUR', ' €').replace(' EUR', ' €')}</p>
                <button class="primary-action-btn card-btn" onclick="window.openModal(${p.id})">Détails & Réservation</button>
            </div>`;
        container.appendChild(card);
    });
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
            const filtered = (key === 'all') ? window.allProductsData : window.allProductsData.filter(p => p.category === key);
            renderProductList(filtered);
        };
        if(key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}

window.searchProducts = function() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const filtered = window.allProductsData.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    renderProductList(filtered);
};