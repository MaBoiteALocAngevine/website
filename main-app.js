// Dépend de toutes les fonctions précédentes (loadProductsFromCSVFile, showSection, toggleDarkMode, etc.)
// =================================================================
// 6. INITIALISATION DE L'APPLICATION 
// =================================================================

/**
 * Bascule entre le mode sombre et le mode clair.
 */
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

// FIX: Rendre les fonctions essentielles globales. 
// Le code HTML appelle 'showSection' directement via 'onclick="..."' avant que
// le DOM ne soit complètement chargé, d'où l'erreur 'is not defined'.
// En les attachant à l'objet 'window', on s'assure qu'elles sont connues dès que le script est chargé.
window.moveCarousel = moveCarousel;
window.startCarousel = startCarousel;
window.closeModal = closeModal;
window.showSection = showSection;
window.filterProducts = filterProducts;
window.openModal = openModal;
window.addToCartFromModal = addToCartFromModal;
window.updateCartItem = updateCartItem;
window.removeItem = removeItem;
window.toggleDarkMode = toggleDarkMode;

// *** BLOC DE DÉMARRAGE DE L'APPLICATION ***
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialiser le mode sombre s'il est déjà en localStorage
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // 2. Charger les données et initialiser l'UI (Catalogue, Carrousel, Panier)
    loadProductsFromCSVFile();

    // 3. Initialiser les écouteurs d'événements
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
        const icon = darkModeToggle.querySelector('i');
        if (icon) {
             const isDarkMode = document.body.classList.contains('dark-mode');
             icon.classList.remove(isDarkMode ? 'fa-moon' : 'fa-sun');
             icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
        }
    }
    
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleSubmitReservation);
    }
});