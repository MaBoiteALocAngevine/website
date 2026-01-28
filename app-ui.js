let modalSlideIndex = 0;
let currentModalImages = [];

window.openModal = function(productId) { 
    const modal = document.getElementById('product-modal');
    if (!window.allProductsData) return;

    const product = window.allProductsData.find(p => p.id == productId);
    if (product) {
        window.selectedProductForModal = product;
        currentModalImages = product.images; // Liste des photos
        modalSlideIndex = 0;

        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').innerHTML = product.description; 
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <small>TTC</small>`;
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <small>TTC</small>`;
        
        updateModalImage(); // Affiche la première image et les flèches

        document.getElementById('modal-quantity').value = 1;
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden';
    }
};

// Fonction pour changer l'image dans la modale
function updateModalImage() {
    const imgElement = document.getElementById('modal-image');
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');
    const counter = document.getElementById('modal-image-counter');

    imgElement.src = currentModalImages[modalSlideIndex];

    // On n'affiche les flèches que s'il y a plusieurs images
    const hasMultiple = currentModalImages.length > 1;
    prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    counter.style.display = hasMultiple ? 'block' : 'none';
    counter.textContent = `${modalSlideIndex + 1} / ${currentModalImages.length}`;
}

window.changeModalImage = function(n) {
    modalSlideIndex += n;
    if (modalSlideIndex >= currentModalImages.length) modalSlideIndex = 0;
    if (modalSlideIndex < 0) modalSlideIndex = currentModalImages.length - 1;
    updateModalImage();
};

window.closeModal = function() {
    document.getElementById('product-modal').style.display = "none";
    document.body.style.overflow = 'auto';
};

// --- CARROUSEL ACCUEIL (Inchangé) ---
let slideIndex = 0;
window.initCarouselUI = function(images) {
    const track = document.getElementById('carousel-track');
    if (!track || !images.length) return;
    track.innerHTML = images.map(img => `<div class="carousel-slide"><img src="${img}"></div>`).join('');
    window.showSlide(0, images.length);
};
window.showSlide = function(index, total) {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    slideIndex = (index + total) % total;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
};
window.moveCarousel = function(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length) window.showSlide(slideIndex + n, slides.length);
};