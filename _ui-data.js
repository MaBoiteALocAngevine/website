// --- _ui-data.js ---
// Dépendances: _config.js, _utils.js (showToast, extractPriceDetails)
// Logique d'affichage et de chargement des données

// --- CHARGEMENT DES DONNÉES ET RENDU INITIAL ---

/**
 * Charge les données des produits à partir du fichier CSV (simulé).
 */
function loadProductsFromCSVFile() {
    // Simuler le chargement du CSV ici car l'API du navigateur ne le permet pas directement
    // NOTE: Le contenu du CSV est codé en dur pour éviter les problèmes d'accès aux fichiers locaux
    const csvContent = `id,category,name,description,price,image_url,max_quantity,carrousel,publication,caution
101,evenementiel,Table de réception,"Grâce à sa conception pliable et légère, cette table haute est facile à transporter et à installer en quelques secondes. Elle est l'élément clé pour transformer l'ambiance de vos événements : le format debout favorise les échanges, le professionnalisme de vos réceptions, et la convivialité de vos rassemblements, qu'ils soient privés ou professionnels.<br><br><strong>Détails Techniques</strong><br>- Type : Table de réception haute<br>- Hauteur : 105 cm<br>- Plateau : Plastique Blanc<br>- Diamètre du plateau : 60 cm<br>- Accessoire inclus : Toile / Housse de couleur Noire<br>- Fonctionnalité : Pliable<br>- Dimensions pliée (L x l x E) : 126 cm x 60 cm x 5 cm",6 € / jour,images/table.jpg,12,Oui,Oui,40€
102,evenementiel,Tonelle pliante 3x6m,"Solution idéale pour l'organisation de vos événements en extérieur, cette tonnelle offre un espace couvert confortable et élégant. Sa structure est conçue pour être <b>très facile à monter et démonter</b> rapidement à 2 ou 3 personnes. Elle est l'atout convivial et professionnel indispensable pour protéger vos convives ou vos buffets des intempéries.<br><br><strong>Détails Techniques</strong><br>- Dimensions : 3m x 6m<br>- Capacité : Accueille confortablement 15 à 20 personnes debout<br>- Toile : Polyester Gris Anthracite design<br>- Structure : Métal robuste<br>- Réglage : Hauteur ajustable par pied (idéal en cas de pente ou de terrain non plat)<br>- Spécificité : Instructions de montage fournies<br>- Important : La structure ne permet pas l’ajout de toiles latérales<br><br><strong>Conseil de Sécurité</strong><br>- En cas de vent fort, il est impératif de replier la tonnelle pour éviter tout risque d’endommagement.",20 € / jour,images/tente.jpg,1,Oui,Oui,100€
103,evenementiel,Vidéo-projecteur,"Idéal pour sublimer vos événements, présentations professionnelles ou soirées de cinéma. Grâce à son excellente luminosité de 3000 lumens, cet équipement est facile à transporter et à installer, garantissant une image claire et contrastée même dans un environnement légèrement éclairé. Il est parfait pour des projections de qualité, ajoutant une touche professionnelle et conviviale à tous vos rassemblements.<br><br><strong>Détails Techniques</strong><br>- Modèle : Epson EB-W22<br>- Résolution native : WXGA (1280 x 800)<br>- Technologie : 3LCD (pour des couleurs naturelles et homogènes)<br>- Puissance lumineuse : 3000 lumens<br>- Connectiques : HDMI, VGA, USB, audio<br>- Utilisation : Compatible ordinateur, console ou clé HDMI<br><br><strong>Contenu et Options</strong><br>- Inclus : Câble HDMI de 5 mètres, Adaptateur compatible avec les nouvelles prises HDMI, Housse de transport rigide et pratique<br>- Option (5 €/24h) : Micro filaire professionnel",15 € / jour,images/videoprojecteur.jpg,1,Oui,Oui,350€
104,evenementiel,Guirlande Lumineuse Guinguette (70m),"Créez une ambiance chaleureuse et féerique pour tous vos événements, intérieurs comme extérieurs. Avec ses 70 mètres de lumières couleur jaune chaud et son fil noir discret, cette guirlande est idéale pour décorer des salles, des jardins ou des tonnelles. Elle est facile à installer et dispose de plusieurs modes pour s'adapter à l'atmosphère souhaitée.<br><br><strong>Détails Techniques</strong><br>- Longueur : 70 mètres<br>- Couleur des LED : Jaune Chaud<br>- Couleurs du fil : Noir<br>- Fonctionnalités : Plusieurs modes de scintillement, possibilité de rester statique<br>- Alimentation : Branchement sur secteur<br><br><strong>Conditions d'Usage</strong><br>- Usage : Intérieur et Extérieur<br>- Sécurité : En extérieur, il est impératif d’abriter la prise secteur et d’éviter tout écoulement d’eau sur le boîtier de branchement.",5 € / jour,images/guirlande.jpg,1,Oui,Oui,50€
105,evenementiel,Canon à Confettis Professionnel,Canon à confettis à air comprimé pour un effet spectaculaire (confettis non inclus).,20 € / jour,images/canon.jpg,1,Non,Oui,200€
106,evenementiel,"Kit Vaisselle (Assiettes, Verres, Couverts)","Set complet de vaisselle de qualité (par 12). Comprend assiettes, verres à pied et couverts.",1.5 € / personne,images/vaisselle.jpg,100,Non,Non,50€
201,outillage,Perceuse Visseuse Professionnelle,Perceuse visseuse sans fil de marque Bosch. Idéale pour les petits travaux de la maison.,15 € / jour,images/perceuse.jpg,1,Non,Oui,100€
202,outillage,Échafaudage Roulant (4m),"Échafaudage en aluminium léger et sécurisé, hauteur de travail maximale de 4 mètres.",25 € / jour,images/echafaudage.jpg,1,Non,Oui,300€
203,outillage,Groupe Électrogène 3000W,Groupe électrogène puissant pour alimenter lumières et musique lors de vos événements en extérieur.,35 € / jour,images/groupe.jpg,1,Non,Non,400€
`;

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        document.getElementById('loading-message').textContent = 'Erreur: Fichier de données vide ou mal formé.';
        return;
    }

    const headers = lines[0].split(',');
    allProductsData = [];

    // Ligne 1: headers, on commence à 1 pour les données
    for (let i = 1; i < lines.length; i++) {
        // Utilisation d'une regex pour gérer les champs contenant des virgules à l'intérieur de guillemets
        const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(val => 
            val.replace(/^"|"$/g, '').trim() // Nettoyage des guillemets
        );
        
        if (values.length === headers.length) {
            let product = {};
            for (let j = 0; j < headers.length; j++) {
                product[headers[j].trim()] = values[j];
            }
            product.id = parseInt(product.id);
            product.max_quantity = parseInt(product.max_quantity);
            allProductsData.push(product);
        }
    }

    document.getElementById('loading-message').style.display = 'none';

    // Rendre l'interface après le chargement
    renderCatalogueNav();
    filterProducts('all');
    initCarousel(); 
}

/**
 * Filtre et affiche les produits par catégorie.
 * @param {string} category Le nom de la catégorie à afficher, ou 'all'.
 */
function filterProducts(category) {
    let filteredProducts;

    // Mise à jour de la navigation par catégorie
    document.querySelectorAll('.cat-nav button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.category === category) {
            button.classList.add('active');
        }
    });

    if (category === 'all') {
        // Ne montrer que les produits marqués 'Oui' pour la publication
        filteredProducts = allProductsData.filter(p => p.publication === 'Oui');
    } else {
        filteredProducts = allProductsData.filter(p => p.category === category && p.publication === 'Oui');
    }

    renderProductCatalogue(filteredProducts);
}

/**
 * Génère le HTML pour la navigation par catégorie.
 */
function renderCatalogueNav() {
    const navContainer = document.getElementById('catalogue-nav');
    const categories = ['all', ...new Set(allProductsData.map(p => p.category))];
    navContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const displayName = cat === 'all' ? 'Tout le Catalogue' : cat.charAt(0).toUpperCase() + cat.slice(1);
        const button = document.createElement('button');
        button.textContent = displayName;
        button.dataset.category = cat;
        button.onclick = () => filterProducts(cat);
        navContainer.appendChild(button);
    });
}

/**
 * Génère et affiche les cartes produits.
 * @param {Array<object>} products Liste des produits à afficher.
 */
function renderProductCatalogue(products) {
    const listContainer = document.getElementById('product-list');
    listContainer.innerHTML = '';
    listContainer.className = 'product-list-container'; // Assurer que le style grid est appliqué

    if (products.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; padding: 50px;">Aucun produit ne correspond à cette catégorie ou à votre recherche.</p>';
        return;
    }

    products.forEach(product => {
        const cardHTML = `
            <div class="product-card" onclick="openModal(${product.id})">
                <img src="${product.image_url}" alt="${product.name}">
                <div class="product-card-body">
                    <h4>${product.name}</h4>
                    <p>${product.description.split('<br>')[0].substring(0, 100)}...</p>
                    <div class="product-price">Prix : ${product.price}</div>
                    <div class="product-caution">Caution : ${product.caution}</div>
                    <button class="button primary-button">Voir les détails</button>
                </div>
            </div>
        `;
        listContainer.innerHTML += cardHTML;
    });
}

// --- GESTION DE LA MODALE ---

/**
 * Ouvre la modale et charge les détails du produit.
 * @param {number} productId L'ID du produit à afficher.
 */
function openModal(productId) {
    const product = allProductsData.find(p => p.id === productId);
    if (!product) {
        showToast("Produit non trouvé.");
        return;
    }

    selectedProductForModal = product;
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Mettre la date par défaut sur demain pour le début et après-demain pour la fin (pour les tests)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const defaultStartDate = tomorrow.toISOString().split('T')[0];
    const defaultEndDate = dayAfterTomorrow.toISOString().split('T')[0];
    
    // Déterminer si les contrôles de date sont nécessaires
    const { isDaily } = extractPriceDetails(product.price);
    const dateInput = isDaily ? `
        <div class="modal-control-group">
            <label for="modal-start-date">Date de Début</label>
            <input type="date" id="modal-start-date" value="${defaultStartDate}" min="${defaultStartDate}">
        </div>
        <div class="modal-control-group">
            <label for="modal-end-date">Date de Fin</label>
            <input type="date" id="modal-end-date" value="${defaultEndDate}" min="${defaultStartDate}">
        </div>
    ` : '';
    
    const maxQtyMessage = product.max_quantity > 1 ? `(Max : ${product.max_quantity})` : '';

    modalBody.innerHTML = `
        <div class="modal-body-grid">
            <div>
                <img src="${product.image_url}" alt="${product.name}" class="modal-image">
            </div>
            <div class="modal-details">
                <h3 class="modal-header">${product.name}</h3>
                <p class="modal-description">${product.description}</p>
                <p class="modal-price">Prix : <strong>${product.price}</strong></p>
                <p class="modal-caution">Caution : <strong>${product.caution}</strong></p>
            </div>
        </div>
        
        <div class="modal-controls">
            <div class="modal-control-group">
                <label for="modal-quantity">Quantité ${maxQtyMessage}</label>
                <input type="number" id="modal-quantity" value="1" min="1" max="${product.max_quantity}">
            </div>
            ${dateInput}
            <button class="button primary-button add-to-cart-btn" onclick="addToCartFromModal()">Ajouter au Panier</button>
        </div>
    `;

    modal.style.display = 'flex'; // Utiliser flex pour centrer
}

/**
 * Ferme la modale.
 */
function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
    selectedProductForModal = null;
}

// --- GESTION DU CARROUSEL ---

/**
 * Initialise les slides et les indicateurs du carrousel.
 */
function initCarousel() {
    const carouselContainer = document.getElementById('carousel-container');
    const productsInCarousel = allProductsData.filter(p => p.carrousel === 'Oui' && p.publication === 'Oui');
    totalSlides = productsInCarousel.length;

    // S'assurer qu'il n'y a pas d'erreur si le conteneur est absent
    if (!carouselContainer || totalSlides === 0) {
        if (carouselContainer) carouselContainer.style.display = 'none';
        return;
    }
    carouselContainer.style.display = 'block';

    const trackHTML = productsInCarousel.map(p => `
        <div class="carousel-slide" onclick="openModal(${p.id})">
            <img src="${p.image_url}" alt="${p.name}">
            <div class="slide-caption">
                <h4>${p.name}</h4>
                <p>${p.description.split('<br>')[0].substring(0, 80)}...</p>
            </div>
        </div>
    `).join('');

    const dotsHTML = productsInCarousel.map((_, index) => `
        <span class="dot" onclick="currentSlide = ${index}; updateCarousel();"></span>
    `).join('');

    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    const dotsContainer = document.querySelector('.dots-container');

    // Créer le track (il n'est pas dans index.html)
    let track = carouselContainer.querySelector('.carousel-track');
    if (!track) {
        track = document.createElement('div');
        track.className = 'carousel-track';
        carouselContainer.insertBefore(track, prevButton);
    }
    track.innerHTML = trackHTML;
    dotsContainer.innerHTML = dotsHTML;

    // Styles CSS manquants pour le carrousel (ajouter dynamiquement si besoin)
    track.style.width = `${totalSlides * 100}%`;
    
    updateCarousel();
    // Le démarrage automatique est géré dans _main-app.js si la section est 'accueil'
}

/**
 * Met à jour la position du carrousel et l'état des indicateurs.
 */
function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    const dots = document.querySelectorAll('.dots-container .dot');

    if (totalSlides === 0) return;

    // Normalisation de l'index de la slide
    if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
    } else if (currentSlide >= totalSlides) {
        currentSlide = 0;
    }

    // Déplacement de la piste
    const offset = -currentSlide * 100; // Déplacement de 100% par slide
    if (track) {
        track.style.transform = `translateX(${offset}%)`;
    }

    // Mise à jour des indicateurs
    dots.forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === currentSlide) {
            dot.classList.add('active');
        }
    });
}

/**
 * Déplace le carrousel manuellement.
 * @param {number} step -1 pour précédent, 1 pour suivant.
 */
function moveCarousel(step) {
    currentSlide += step;
    updateCarousel();
}

/**
 * Démarre la lecture automatique du carrousel.
 */
function startCarousel() {
    clearInterval(carouselInterval); // S'assurer qu'un seul intervalle tourne
    if (totalSlides > 1) {
        carouselInterval = setInterval(() => {
            currentSlide++;
            updateCarousel();
        }, CAROUSEL_INTERVAL_MS);
    }
}