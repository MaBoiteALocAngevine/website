// --- _main-app.js ---
// Dépendances: _config.js, _ui-data.js (loadProductsFromCSVFile, initCarousel, startCarousel, moveCarousel, currentSlide, totalSlides, filterProducts, renderCart, closeModal, openModal), _cart-logic.js (handleSubmitReservation, updateCartCount, addToCartFromModal)

// Rendre les fonctions globales pour les événements 'onclick' dans index.html et ui-data
window.moveCarousel = moveCarousel;
window.closeModal = closeModal;
window.showSection = showSection;
window.filterProducts = filterProducts;
window.openModal = openModal;
window.addToCartFromModal = addToCartFromModal;


// --- GESTION DU MODE SOMBRE ET INITIALISATION ---
document.addEventListener("DOMContentLoaded", () => { 
    const toggle = document.getElementById("dark-mode-toggle");
    if (toggle) {
        // Fonction de bascule du mode sombre 
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            // Sauvegarder la préférence de mode sombre 
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
    // Appliquer la préférence de mode sombre 
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
    initApp(); // Initialisation de l'application
});

function initApp() {
    loadProductsFromCSVFile(); // Charger les données

    const form = document.getElementById('reservation-form'); 
    if (form) {
        form.addEventListener('submit', handleSubmitReservation); 
    }

    // Assurer que le premier lien est actif au démarrage 
    const firstLink = document.querySelector('.main-nav ul li a');
    if (firstLink) {
        firstLink.classList.add('active');
    }
    showSection('accueil'); // Afficher la section d'accueil par défaut 
    updateCartCount(); // Mise à jour du compteur au chargement 
}


// --- NAVIGATION PRINCIPALE ---
function showSection(sectionId) {
    // Gestion du carrousel 
    if (sectionId !== 'accueil') {
        clearInterval(carouselInterval);
    } else {
        // Ne démarrer le carrousel que s'il y a des slides 
        if (totalSlides > 0) {
            startCarousel();
        }
    }
    if (sectionId === 'panier') {
        renderCart(); 
    }

    // Afficher/Masquer les sections 
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId + '-section');
    if (target) target.classList.add('active'); 

    // Mettre à jour la navigation principale 
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
        // Récupérer l'ID de la section à partir de l'attribut onclick
        const linkSectionId = link.getAttribute('onclick')?.match(/showSection\('(.+?)'\)/)?.[1];
        if (linkSectionId === sectionId) {
            link.classList.add('active'); 
        }
    });
    
    // Afficher/Masquer la navigation par catégorie 
    const catNav = document.getElementById('catalogue-nav'); 
    if (sectionId === 'catalogue') { 
        catNav.style.display = 'flex'; // Utiliser flex pour l'alignement 
        // Si aucune catégorie n'est active, afficher 'all' par défaut
        if (!document.querySelector('#catalogue-nav button.active') && allProductsData.length > 0) {
            filterProducts('all'); 
        }
    } else {
        catNav.style.display = 'none'; 
    }
}