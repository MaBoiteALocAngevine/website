document.addEventListener("DOMContentLoaded", () => {
    // 1. Charger les données du catalogue (depuis app-catalog.js)
    if (typeof loadProductsFromCSVFile === 'function') {
        loadProductsFromCSVFile();
    }

    // 2. Configurer les écouteurs du formulaire de réservation
    const form = document.getElementById('reservation-form');
    if (form && typeof handleSubmitReservation === 'function') {
        form.addEventListener('submit', handleSubmitReservation);
    }

    // 3. Configurer la validation en temps réel de l'email
    const emailInput = document.getElementById('user-email');
    if (emailInput && typeof updateCartUI === 'function') {
        emailInput.addEventListener('input', updateCartUI);
    }

    // 4. Forcer l'affichage de l'accueil immédiatement au lancement
    showSection('accueil');
});

/**
 * Gère le changement de page (sections) sur le site
 */
function showSection(id) {
    // A. Gérer la visibilité des sections
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Sécurité pour garantir que les autres pages sont cachées
    });
    
    const target = document.getElementById(id + '-section');
    if (target) {
        target.classList.add('active');
        target.style.display = 'block'; // Affiche la section demandée
    }

    // B. Mettre à jour l'onglet actif dans le menu de navigation
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
    const navLink = document.getElementById('nav-' + id);
    if (navLink) {
        navLink.classList.add('active');
    }

    // C. Gérer la barre de catégories (visible uniquement dans le catalogue)
    const catNav = document.getElementById('catalogue-nav');
    if (catNav) {
        catNav.style.display = (id === 'catalogue') ? 'flex' : 'none';
    }

    // D. Cas particulier : Rafraîchir le rendu du panier quand on l'ouvre
    if (id === 'panier' && typeof renderCart === 'function') {
        renderCart();
    }

    // E. Retour fluide en haut de page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}