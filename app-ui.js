// --- NOTIFICATION TOAST ---
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
    
    // On cherche dans la variable globale définie dans app-catalog.js
    if (!window.allProductsData || window.allProductsData.length === 0) {
        console.error("Les données ne sont pas prêtes.");
        return;
    }

    const product = window.allProductsData.find(p => p.id == productId);
    if (product) {
        window.selectedProductForModal = product;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-image').src = product.image_url; 
        document.getElementById('modal-description').innerHTML = product.description; 
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <span style="font-size: 0.8em; opacity: 0.7;">TTC</span>`;
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <span style="font-size: 0.8em; opacity: 0.7;">TTC</span>`;
        
        const qtyInput = document.getElementById('modal-quantity');
        qtyInput.value = 1;
        qtyInput.max = product.max_quantity;
        
        document.getElementById('modal-start-date').value = '';
        document.getElementById('modal-end-date').value = '';
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden'; 
    }
};

window.closeModal = function() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = "none";
    document.body.style.overflow = 'auto';
};

// --- CARROUSEL ---
let slideIndex = 0;
let carouselInterval;

window.initCarouselUI = function(images) {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    if (!track || !images || images.length === 0) return;

    track.innerHTML = '';
    indicators.innerHTML = '';
    images.forEach((imgSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${imgSrc}" alt="Aperçu">`;
        track.appendChild(slide);
        const indicator = document.createElement('span');
        indicator.onclick = () => window.showSlide(index, images.length);
        indicators.appendChild(indicator);
    });
    window.showSlide(0, images.length);
    
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        const total = document.querySelectorAll('.carousel-slide').length;
        window.showSlide(slideIndex + 1, total);
    }, 5000);
};

window.showSlide = function(index, total) {
    slideIndex = index;
    if (slideIndex >= total) slideIndex = 0;
    if (slideIndex < 0) slideIndex = total - 1;
    const track = document.getElementById('carousel-track');
    const indicators = document.querySelectorAll('#carousel-indicators span');
    if (track) track.style.transform = `translateX(-${slideIndex * 100}%)`;
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === slideIndex));
};

window.moveCarousel = function(n) {
    const total = document.querySelectorAll('.carousel-slide').length;
    window.showSlide(slideIndex + n, total);
};