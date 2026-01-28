document.addEventListener("DOMContentLoaded", () => {
    initDarkMode();
    loadProductsFromCSVFile();
    document.getElementById('reservation-form')?.addEventListener('submit', handleSubmitReservation);
    document.getElementById('user-email')?.addEventListener('input', updateCartCount);
    showSection('accueil');
});

function showSection(id) {
    // 1. Sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id + '-section')?.classList.add('active');

    // 2. Navigation Active (Souligné)
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
    document.getElementById('nav-' + id)?.classList.add('active');

    // 3. Catégories Catalogue
    const catNav = document.getElementById('catalogue-nav');
    if (catNav) catNav.style.display = (id === 'catalogue') ? 'flex' : 'none';

    if (id === 'panier') renderCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}