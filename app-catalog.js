window.allProductsData = [];
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

async function loadProductsFromCSVFile() {
    try {
        const response = await fetch('data.csv');
        const csvData = await response.text();
        const lines = csvData.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        window.allProductsData = lines.slice(1).filter(l => l.trim()).map(line => {
            const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g).map(v => v.trim().replace(/^"|"$/g, ''));
            let p = {};
            headers.forEach((h, i) => p[h] = values[i]);
            p.id = parseInt(p.id);
            p.images = p.image_url ? p.image_url.split(';').map(img => img.trim()) : ['images/placeholder.jpg'];
            p.main_image = p.images[0]; 
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
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image-wrapper" onclick="window.openModal(${p.id})">
                <img src="${p.main_image}" alt="Location ${p.name} - Angers 49" loading="lazy" width="350" height="233">
                <div class="image-overlay"><span>DÉCOUVRIR</span></div>
            </div>
            <div class="product-card-body">
                <h4 onclick="window.openModal(${p.id})">${p.name}</h4>
                <p class="product-price">${p.price}</p>
                <button class="primary-action-btn card-btn" onclick="window.openModal(${p.id})">Détails & Réservation</button>
            </div>
        </div>
    `).join('');
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