// --- _main-app.js ---
// Dépendances: _config.js, _utils.js, _cart-logic.js, _ui-data.js

// Rendre les fonctions essentielles globales pour les événements 'onclick' dans index.html
window.moveCarousel = moveCarousel;
window.startCarousel = startCarousel;
window.closeModal = closeModal;
window.showSection = showSection;
window.filterProducts = filterProducts;
window.openModal = openModal;
window.addToCartFromModal = addToCartFromModal;
window.updateCartItem = updateCartItem;
window.removeItem = removeItem;
// Ajout des fonctions utilisées dans l'initialisation
window.loadProductsFromCSVFile = loadProductsFromCSVFile;
window.updateCartCount = updateCartCount;

// Ajout de la fonction toggleDarkMode qui semble manquer
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    const toggleButton = document.getElementById('dark-mode-toggle');
    const icon = toggleButton.querySelector('i');

    if (isDarkMode) {
        localStorage.setItem('darkMode', 'enabled');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        localStorage.setItem('darkMode', 'disabled');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// *** BLOC DE DÉMARRAGE DE L'APPLICATION (FIX DES BUGS) ***
document.addEventListener('DOMContentLoaded', () => {
    // 1. Charger les données et initialiser l'UI (Catalogue, Carrousel)
    // C'est l'appel manquant qui empêchait le catalogue et le carrousel de s'afficher
    loadProductsFromCSVFile(); // Chargement des données et appel à initCarousel/filterProducts

    // 2. Initialiser les écouteurs d'événements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    const reservationForm = document.getElementById('reservation-form');
    // Le formulaire est sur la section contact. On s'assure qu'il est lié à la fonction de soumission.
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleSubmitReservation);
    }

    // 3. Afficher la section d'accueil (par défaut) et démarrer le carrousel
    showSection('accueil');
    
    // 4. Initialiser l'affichage du panier (compteur dans le header)
    updateCartCount();

    // 5. Initialiser le mode sombre s'il est déjà en localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        // Mise à jour de l'icône
        const icon = document.getElementById('dark-mode-toggle').querySelector('i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
});