// Dépendances: _config.js, _ui-data.js (loadProductsFromCSVFile, initCarousel), _cart-logic.js (handleSubmitReservation, updateCartCount)

// --- GESTION DU MODE SOMBRE ET INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => { // [cite: 1199]
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
        // Fonction de bascule du mode sombre [cite: 1199]
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            // Sauvegarder la préférence de mode sombre [cite: 1199]
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
    // Appliquer la préférence de mode sombre [cite: 1199]
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    initApp(); // Initialisation de l'application [cite: 1199]
});

function initApp() {
    loadProductsFromCSVFile(); // Charger les données [cite: 1200]

    const form = document.getElementById('reservation-form'); // [cite: 1201]
    if (form) {
        form.addEventListener('submit', handleSubmitReservation); // [cite: 1202]
    }

    // Assurer que le premier lien est actif au démarrage [cite: 1203]
    const firstLink = document.querySelector('.main-nav ul li a');
    if (firstLink) {
        firstLink.classList.add('active');
    }
    showSection('accueil'); // Afficher la section d'accueil par défaut [cite: 1204]
    updateCartCount(); // Mise à jour du compteur au chargement [cite: 1204]
}


// --- NAVIGATION PRINCIPALE ---
function showSection(sectionId) {
    // Gestion du carrousel [cite: 1205]
    if (sectionId !== 'accueil') {
        clearInterval(carouselInterval);
    } else {
        // Ne démarrer le carrousel que s'il y a des slides [cite: 1205, 1206]
        if (totalSlides > 0) {
            startCarousel();
        }
    }
    if (sectionId === 'panier') {
        renderCart(); // [cite: 1207]
    }

    // Afficher/Masquer les sections [cite: 1207, 1208]
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId + '-section');
    if (target) target.classList.add('active'); // [cite: 1208, 1209]

    // Mettre à jour la navigation principale [cite: 1209]
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        const linkSectionId = link.getAttribute('onclick').match(/showSection\('(.+?)'\)/)?.[1];
        if (linkSectionId === sectionId) {
            link.classList.add('active'); // [cite: 1209]
        }
    });
    
    // Afficher/Masquer la navigation par catégorie [cite: 1210]
    const catNav = document.getElementById('catalogue-nav'); // [cite: 1210]
    if (sectionId === 'catalogue') { // [cite: 1211]
        catNav.style.display = 'flex'; // Utiliser flex pour l'alignement [cite: 1212]
        if (!document.querySelector('.cat-nav button.active') && allProductsData.length > 0) {
            filterProducts('all'); // [cite: 1212]
        }
    } else {
        catNav.style.display = 'none'; // [cite: 1213]
    }
}