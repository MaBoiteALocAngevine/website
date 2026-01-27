document.addEventListener("DOMContentLoaded", () => {
    // Mode sombre
    document.getElementById("dark-mode-toggle")?.addEventListener("click", toggleDarkMode);
    
    // Chargement données
    loadProductsFromCSVFile();

    // Formulaire
    document.getElementById('reservation-form')?.addEventListener('submit', handleSubmitReservation);
    document.getElementById('user-email')?.addEventListener('input', updateCartUI);

    // Section par défaut
    showSection('accueil');
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId + '-section')?.classList.add('active');

    // Menu actif
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
    
    const catNav = document.getElementById('catalogue-nav');
    catNav.style.display = (sectionId === 'catalogue') ? 'flex' : 'none';

    if (sectionId === 'panier') renderCart();
}