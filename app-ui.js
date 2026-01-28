// --- NOTIFICATIONS TOAST ---
window.showToast = function(message) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
};

// --- GESTION DE LA MODALE PRODUIT ---
window.openModal = function(productId) { 
    const modal = document.getElementById('product-modal');
    if (!window.allProductsData) return;

    const product = window.allProductsData.find(p => p.id == productId);
    if (product) {
        window.selectedProductForModal = product;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-image').src = product.image_url; 
        document.getElementById('modal-description').innerHTML = product.description; 
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <small style="font-weight:400; opacity:0.6;">TTC</small>`;
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <small style="font-weight:400; opacity:0.6;">TTC</small>`;
        
        document.getElementById('modal-quantity').value = 1;
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden'; // Bloque le scroll
    }
};

window.closeModal = function() {
    document.getElementById('product-modal').style.display = "none";
    document.body.style.overflow = 'auto';
};

// --- CARROUSEL ---
let slideIndex = 0;
let carouselInterval;

window.initCarouselUI = function(images) {
    const track = document.getElementById('carousel-track');
    if (!track || !images.length) return;
    track.innerHTML = images.map(img => `<div class="carousel-slide"><img src="${img}" alt="Illustration"></div>`).join('');
    
    const indicators = document.getElementById('carousel-indicators');
    if (indicators) {
        indicators.innerHTML = images.map((_, i) => `<span onclick="window.showSlide(${i}, ${images.length})"></span>`).join('');
    }
    
    window.showSlide(0, images.length);
    
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        window.moveCarousel(1);
    }, 5000);
};

window.showSlide = function(index, total) {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    slideIndex = (index + total) % total;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    
    const dots = document.querySelectorAll('#carousel-indicators span');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === slideIndex));
};

window.moveCarousel = function(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length) window.showSlide(slideIndex + n, slides.length);
};