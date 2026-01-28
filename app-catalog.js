let allProductsData = [];
const CATEGORIES = { 'all': 'Tous les produits', 'evenementiel': 'Événementiel', 'outillage': 'Outillage' };

// Fonction pour enlever les accents et mettre en minuscule (pour une recherche permissive)
function normalizeText(text) {
    if (!text) return "";
    return text.toString().toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "");
}

// Fonction robuste pour lire une ligne CSV (gère les virgules dans les guillemets)
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
}

async function loadProductsFromCSVFile() {
    try {
        console.log("Chargement du CSV...");
        const response = await fetch('data.csv');
        if (!response.ok) throw new Error("Fichier data.csv introuvable");
        
        const csvData = await response.text();
        const lines = csvData.split(/\r?\n/); // Sépare les lignes proprement
        
        if (lines.length < 2) throw new Error("Le fichier CSV est vide ou mal formé");

        // Récupération des entêtes (id, category, name, etc.)
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Saute les lignes vides

            const values = parseCSVLine(line);
            
            if (values.length >= headers.length) {
                let p = {};
                headers.forEach((h, index) => {
                    p[h] = values[index];
                });
                
                // Conversions de sécurité
                p.id = parseInt(p.id);
                p.max_quantity = parseInt(p.max_quantity) || 1;
                
                // On ne garde que les produits publiés (si la colonne existe)
                if (p.publication && p.publication.toLowerCase() === 'non') {
                    continue; 
                }
                
                products.push(p);
            }
        }

        allProductsData = products;
        console.log("Produits chargés :", allProductsData.length);

        renderCategoryButtons();
        renderProductList(allProductsData);
        
        // Cacher le message de chargement
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) loadingMsg.style.display = 'none';
        
        // Initialiser le carrousel avec les images marquées "Oui"
        const carImgs = allProductsData
            .filter(p => p.carrousel && p.carrousel.toLowerCase() === 'oui')
            .map(p => p.image_url);
        
        if (typeof initCarouselUI === "function") {
            initCarouselUI(carImgs);
        }

    } catch (e) {
        console.error("Erreur critique :", e);
        const container = document.getElementById('product-list-container');
        if (container) {
            container.innerHTML = `<p style="color:red">Erreur lors du chargement des produits. Vérifiez le fichier data.csv.</p>`;
        }
    }
}

function renderProductList(products) {
    const container = document.getElementById('product-list-container');
    if (!container) return;

    container.innerHTML = ''; // On vide tout

    if (products.length === 0) {
        container.innerHTML = '<p class="empty-list-message">Aucun produit ne correspond à votre recherche.</p>';
        return;
    }

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
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;

    const term = normalizeText(searchInput.value);
    
    const filtered = allProductsData.filter(p => {
        const name = normalizeText(p.name || "");
        const desc = normalizeText(p.description || "");
        return name.includes(term) || desc.includes(term);
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
            
            if (key === 'all') {
                renderProductList(allProductsData);
            } else {
                const filtered = allProductsData.filter(p => p.category === key);
                renderProductList(filtered);
            }
        };
        if (key === 'all') btn.classList.add('active');
        nav.appendChild(btn);
    });
}