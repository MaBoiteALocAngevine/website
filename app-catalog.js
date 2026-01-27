let allProductsData = [];
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

async function loadProductsFromCSVFile() {
    try {
        const response = await fetch('data.csv');
        const csvData = await response.text();
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        allProductsData = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g).map(val => val.trim().replace(/"/g, ''));
            let product = {};
            headers.forEach((header, index) => product[header.toLowerCase()] = values[index]);
            product.id = parseInt(product.id);
            product.max_quantity = parseInt(product.max_quantity);
            return product;
        });

        renderCategoryButtons();
        renderProductList(allProductsData);
        document.getElementById('loading-message').style.display = 'none';
        
        const carouselImgs = allProductsData.filter(p => p.carrousel?.toLowerCase() === 'oui').map(p => p.image_url);
        initCarousel(carouselImgs);
    } catch (error) {
        console.error("Erreur CSV:", error);
    }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    container.innerHTML = products.length ? '' : '<p>Aucun produit trouvé.</p>';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}">
            <div class="product-card-body">
                <h4>${product.name}</h4>
                <p class="description-snippet">${product.description.substring(0, 80)}...</p>
                <p class="product-price">${product.price} <span style="font-size: 0.8em; color: var(--secondary-color);">TTC</span></p>
                <button onclick="openModal(${product.id})">Détails et Location</button>
            </div>`;
        container.appendChild(card);
    });
}

function filterProducts(category) {
    const filtered = category === 'all' ? allProductsData : allProductsData.filter(p => p.category === category);
    renderProductList(filtered);
}

function searchProducts() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const filtered = allProductsData.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    renderProductList(filtered);
}

function renderCategoryButtons() {
    const nav = document.getElementById('catalogue-nav');
    nav.innerHTML = '';
    Object.keys(CATEGORIES).forEach(key => {
        const btn = document.createElement('button');
        btn.textContent = CATEGORIES[key];
        btn.onclick = () => {
            document.querySelectorAll('.cat-nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(key);
        };
        if(key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}