/**
 * Gère le changement de page (sections) sur le site
 */
function showSection(id) {
    if (!id) id = 'accueil';

    // A. Gérer la visibilité des sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Cache les autres pages
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
    if (id === 'panier' && typeof window.renderCart === 'function') {
        window.renderCart();
    }

    // E. Retour fluide en haut de page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Rendre accessible globalement
window.showSection = showSection;

function initApp() {
    // 1. Charger les données du catalogue (depuis app-catalog.js)
    if (typeof window.loadProductsFromCSVFile === 'function') {
        window.loadProductsFromCSVFile();
    } else if (typeof loadProductsFromCSVFile === 'function') {
        loadProductsFromCSVFile();
    }

    // 1b. Initialiser le sélecteur global de dates de location
    if (typeof window.initGlobalDates === 'function') {
        window.initGlobalDates();
    }

    // 2. Configurer les écouteurs du formulaire de réservation
    const form = document.getElementById('reservation-form');
    if (form) {
        const handler = window.handleSubmitReservation || (typeof handleSubmitReservation === 'function' ? handleSubmitReservation : null);
        if (handler) {
            form.addEventListener('submit', handler);
        }
    }

    // 3. Configurer la validation en temps réel de l'email
    const emailInput = document.getElementById('user-email');
    if (emailInput) {
        const updater = window.updateCartUI || (typeof updateCartUI === 'function' ? updateCartUI : null);
        if (updater) {
            emailInput.addEventListener('input', updater);
        }
    }

    // 4. Afficher la section demandée (hash dans l'URL ou accueil par défaut)
    const hash = window.location.hash ? window.location.hash.replace('#', '') : 'accueil';
    if (hash && document.getElementById(hash + '-section')) {
        showSection(hash);
    } else {
        showSection('accueil');
    }
}

// Initialisation immédiate ou sur événement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

