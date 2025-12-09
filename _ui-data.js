// Dépendances: _config.js, _utils.js (showProductDetails)

// --- GESTION DU CSV ---
function parseCSV(csvText) { // [cite: 1285]
    // ... Logique de parsing CSV (la fonction complète est trop longue) ... [cite: 1286-1294]
}

async function loadProductsFromCSVFile() { // [cite: 1295]
    const loadingMessage = document.getElementById('loading-message'); // [cite: 1295]
    if (loadingMessage) loadingMessage.textContent = "Lecture du fichier data.csv...";

    try {
        // Assurez-vous que le chemin 'data.csv' est correct par rapport à l'exécution du site
        const response = await fetch('data.csv'); // [cite: 1295]
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const compiledText = await response.text(); // [cite: 1295]
        
        // Utilisation du parser [cite: 1297]
        const { products } = parseCSV(compiledText); 
        allProductsData = products; // [cite: 1297]

        // Filtrer les images pour le carrousel [cite: 1298, 1299]
        carouselImagesData = allProductsData
            .filter(p => p.carrousel && p.carrousel.toLowerCase().trim() === 'oui' && p.publication && p.publication.toLowerCase().trim() === 'oui') 
            .map(p => p.image_url); // [cite: 1299]
        
        renderCategoryButtons(); // [cite: 1300]
        renderProductList(allProductsData); // [cite: 1300]

        // Masquer le message de chargement [cite: 1302, 1303]
        if (loadingMessage) loadingMessage.style.display = 'none'; 

        initCarousel(); // [cite: 1304]

    } catch (error) {
        console.error("Impossible de charger les données du catalogue:", error);
        if (loadingMessage) loadingMessage.textContent = "Erreur de chargement du catalogue.";
    }
}

// --- RENDU ET FILTRAGE DU CATALOGUE ---
// ... renderProductCard, renderCategoryButtons, filterProducts, searchProducts ...

// --- CARROUSEL ---
// ... initCarousel, moveCarousel, showSlide, startCarousel ... [cite: 1305-1314]