document.addEventListener("DOMContentLoaded", () => {
    // Initialisation
    initDarkMode();
    loadProductsFromCSVFile();
    
    // Listeners
    const form = document.getElementById('reservation-form');
    if (form) form.addEventListener('submit', handleSubmitReservation);
    
    const emailInput = document.getElementById('user-email');
    if (emailInput) {
        emailInput.addEventListener('input', updateCartUI);
    }

    // Forcer l'affichage de l'accueil au démarrage
    showSection('accueil');
});

function showSection(id) {
    // 1. Gérer les classes actives sur les sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Sécurité supplémentaire
    });
    
    const target = document.getElementById(id + '-section');
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // 2. Navigation Active (Souligné)
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
    const navLink = document.getElementById('nav-' + id);
    if (navLink) navLink.classList.add('active');

    // 3. Barre de catégories
    const catNav = document.getElementById('catalogue-nav');
    if (catNav) {
        catNav.style.display = (id === 'catalogue') ? 'flex' : 'none';
    }

    // 4. Cas particulier panier
    if (id === 'panier') {
        renderCart();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}