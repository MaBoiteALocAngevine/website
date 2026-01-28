window.allProductsData = [];

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
            return p;
        }).filter(p => p.publication?.toLowerCase() !== 'non');

        renderProductList(window.allProductsData);
        if (window.initCarouselUI) {
            const imgs = window.allProductsData.filter(p => p.carrousel?.toLowerCase() === 'oui').map(p => p.image_url);
            window.initCarouselUI(imgs);
        }
        document.getElementById('loading-message').style.display = 'none';
    } catch (e) { console.error(e); }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <div class="product-image-wrapper" onclick="window.openModal(${p.id})">
                <img src="${p.image_url}" loading="lazy">
                <div class="image-overlay"><span>VOIR DÉTAILS</span></div>
            </div>
            <div class="product-card-body">
                <h4 onclick="window.openModal(${p.id})">${p.name}</h4>
                <p class="product-price">${p.price}</p>
                <button class="primary-action-btn card-btn" onclick="window.openModal(${p.id})">Détails & Réservation</button>
            </div>
        </div>
    `).join('');
}

window.searchProducts = function() {
    const term = document.getElementById('product-search').value.toLowerCase();
    const filtered = window.allProductsData.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    renderProductList(filtered);
};