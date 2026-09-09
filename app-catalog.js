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
        const nextChar = line[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else current += char;
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
}

function parseCSV(text) {
    const lines = [];
    let row = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            row.push(current.trim().replace(/^"|"$/g, ''));
            if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
                lines.push(row);
            }
            row = [];
            current = '';
        } else {
            current += char;
        }
    }
    if (current || row.length > 0) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
            lines.push(row);
        }
    }
    return lines;
}

async function loadProductsFromCSVFile() {
    try {
        let response = await fetch('data.csv');
        if (!response.ok) {
            response = await fetch('/data.csv');
        }
        const csvData = await response.text();
        const parsedRows = parseCSV(csvData);
        if (!parsedRows || parsedRows.length === 0) return;

        const headers = parsedRows[0].map(h => h.trim().toLowerCase());
        
        window.allProductsData = parsedRows.slice(1).map(values => {
            let p = {};
            headers.forEach((h, i) => p[h] = values[i] !== undefined ? values[i] : '');
            
            // --- MAPPING PRODUIT ---
            p.id = parseInt(p.id);
            p.name = p.title || ''; // title -> name
            p.inventory = parseInt(p.inventory) || 1;
            
            // Gestion des images pour le site web :
            // Priorité absolue aux chemins relatifs pour le site (image_site, additional_image_site).
            // Les URLs absolues (image_link, additional_image_link) sont réservées à Google Merchant.
            const mainImg = (p.image_site && p.image_site.trim()) 
                ? p.image_site.trim() 
                : (p.image_link ? p.image_link.trim() : '');
                
            let imgList = mainImg ? [mainImg] : [];
            
            const extraImgsField = (p.additional_image_site && p.additional_image_site.trim())
                ? p.additional_image_site.trim()
                : (p.additional_image_link ? p.additional_image_link.trim() : '');

            if (extraImgsField) {
                const extras = extraImgsField.split(/[;,]/).map(img => img.trim()).filter(img => img !== "");
                imgList = imgList.concat(extras);
            }
            p.images = imgList.filter(img => img !== "");
            p.main_image = p.images[0] || 'images/logo.png'; 

            // Sécurité Catégorie (car absente du CSV)
            // On définit 'outillage' si l'ID commence par 2, sinon 'evenementiel'
            p.category = (p.id >= 200 && p.id < 300) ? 'outillage' : 'evenementiel';

            return p;
        }).filter(p => p.id && p.publication?.toLowerCase() !== 'non');

        renderCategoryButtons();
        renderProductList(window.allProductsData);
        
        if (window.initCarouselUI) {
            const imgs = window.allProductsData.filter(p => p.carrousel?.toLowerCase() === 'oui').map(p => p.main_image);
            window.initCarouselUI(imgs);
        }
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) loadingEl.style.display = 'none';
    } catch (e) { 
        console.error("Erreur Catalogue:", e); 
        const loadingEl = document.getElementById('loading-message');
        if (loadingEl) {
            loadingEl.textContent = "Erreur lors du chargement du catalogue.";
            loadingEl.style.color = '#b05b45';
        }
    }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = products.length ? '' : '<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">Aucun produit trouvé.</div>';
    
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
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    const term = searchInput.value.toLowerCase();
    const filtered = window.allProductsData.filter(p => p.name.toLowerCase().includes(term) || (p.description && p.description.toLowerCase().includes(term)));
    renderProductList(filtered);
};

// Exposer globalement pour interopérabilité
window.loadProductsFromCSVFile = loadProductsFromCSVFile;
window.renderProductList = renderProductList;
window.renderCategoryButtons = renderCategoryButtons;

