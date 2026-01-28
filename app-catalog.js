let allProductsData = [];
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

// Nettoie le texte pour la recherche (minuscule + supprime accents)
function normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "");
}

async function loadProductsFromCSVFile() {
    try {
        const response = await fetch('data.csv');
        const csvData = await response.text();
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        allProductsData = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g).map(val => val.trim().replace(/"/g, ''));
            let p = {};
            headers.forEach((h, i) => p[h.toLowerCase()] = values[i]);
            p.id = parseInt(p.id);
            p.max_quantity = parseInt(p.max_quantity);
            return p;
        });

        renderCategoryButtons();
        renderProductList(allProductsData);
        document.getElementById('loading-message').style.display = 'none';
        
        const carImgs = allProductsData.filter(p => p.carrousel?.toLowerCase() === 'oui').map(p => p.image_url);
        initCarouselUI(carImgs);
    } catch (e) { console.error("Erreur catalogue:", e); }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    container.innerHTML = products.length ? '' : '<p>Aucun produit ne correspond à votre recherche.</p>';
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_url}" alt="${p.name}">
            <div class="product-card-body">
                <h4>${p.name}</h4>
                <p class="description-snippet">${p.description.substring(0, 80)}...</p>
                <p class="product-price">${p.price} <span style="font-size:0.8em">TTC</span></p>
                <button onclick="openModal(${p.id})">Détails et Location</button>
            </div>`;
        container.appendChild(card);
    });
}

function searchProducts() {
    const term = normalizeText(document.getElementById('product-search').value);
    const filtered = allProductsData.filter(p => 
        normalizeText(p.name).includes(term) || normalizeText(p.description).includes(term)
    );
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
        if(key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}