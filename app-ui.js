let modalSlideIndex = 0;
let currentModalImages = [];
let slideIndex = 0;
let carouselInterval;

// --- NOTIFICATIONS ---
window.showToast = function(message) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
};

// --- MODALE PRODUIT ---
window.openModal = function(productId) { 
    const modal = document.getElementById('product-modal');
    if (!window.allProductsData) return;

    const product = window.allProductsData.find(p => p.id == productId);
    if (product) {
        window.selectedProductForModal = product;
        currentModalImages = product.images;
        modalSlideIndex = 0;

        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').innerHTML = product.description; 
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <small>TTC</small>`;
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <small>TTC</small>`;
        
        updateModalImage();

        document.getElementById('modal-quantity').value = 1;
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden';
    }
};

function updateModalImage() {
    const imgElement = document.getElementById('modal-image');
    const prevBtn = document.getElementById('modal-prev-btn');
    const nextBtn = document.getElementById('modal-next-btn');
    const counter = document.getElementById('modal-image-counter');

    if (!imgElement) return;
    imgElement.src = currentModalImages[modalSlideIndex];

    const hasMultiple = currentModalImages.length > 1;
    if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (counter) {
        counter.style.display = hasMultiple ? 'block' : 'none';
        counter.textContent = `${modalSlideIndex + 1} / ${currentModalImages.length}`;
    }
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

// --- CARROUSEL ACCUEIL ---
window.initCarouselUI = function(images) {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    if (!track || !images || images.length === 0) return;

    track.innerHTML = images.map(img => `<div class="carousel-slide"><img src="${img}" alt="Illustration"></div>`).join('');
    
    if (indicators) {
        indicators.innerHTML = images.map((_, i) => `<span onclick="window.showSlide(${i}, ${images.length})"></span>`).join('');
    }
    
    slideIndex = 0;
    window.showSlide(0, images.length);
    
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        window.moveCarousel(1);
    }, 5000);
};

window.showSlide = function(index, total) {
    const track = document.getElementById('carousel-track');
    if (!track || total === 0) return;
    
    slideIndex = (index + total) % total;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    const dots = document.querySelectorAll('#carousel-indicators span');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
};

window.moveCarousel = function(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length > 0) {
        window.showSlide(slideIndex + n, slides.length);
    }
};