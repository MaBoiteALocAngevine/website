// --- VARIABLES GLOBALES UI ---
let slideIndex = 0;
let carouselInterval;
let selectedProductForModal = null;

// --- NOTIFICATION TOAST ---
function showToast(message) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// --- GESTION DE LA MODALE PRODUIT ---
function openModal(productId) { 
    const modal = document.getElementById('product-modal');
    if (typeof allProductsData === 'undefined' || !allProductsData) return;

    const product = allProductsData.find(p => p.id == productId);
    if (product) {
        selectedProductForModal = product;
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-image').src = product.image_url; 
        document.getElementById('modal-description').innerHTML = product.description; 
        document.getElementById('modal-product-price-value').innerHTML = `${product.price} <span style="font-size: 0.8em; color: var(--text-muted);">TTC</span>`;
        document.getElementById('modal-product-caution-value').innerHTML = `${product.caution} <span style="font-size: 0.8em; color: var(--text-muted);">TTC</span>`;
        
        const qtyInput = document.getElementById('modal-quantity');
        qtyInput.value = 1;
        qtyInput.max = product.max_quantity;
        
        document.getElementById('modal-start-date').value = '';
        document.getElementById('modal-end-date').value = '';
        modal.style.display = "flex";
    }
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = "none";
    selectedProductForModal = null;
}

// --- CARROUSEL ---
function initCarouselUI(images) {
    const track = document.getElementById('carousel-track');
    const indicators = document.getElementById('carousel-indicators');
    if (!track || !images || images.length === 0) return;

    track.innerHTML = '';
    indicators.innerHTML = '';
    images.forEach((imgSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${imgSrc}" alt="Slide ${index + 1}">`;
        track.appendChild(slide);
        const indicator = document.createElement('span');
        indicator.onclick = () => showSlide(index, images.length);
        indicators.appendChild(indicator);
    });
    showSlide(0, images.length);
    
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        const total = document.querySelectorAll('.carousel-slide').length;
        if (total > 0) showSlide(slideIndex + 1, total);
    }, 4000);
}

function showSlide(index, total) {
    slideIndex = index;
    if (slideIndex >= total) slideIndex = 0;
    if (slideIndex < 0) slideIndex = total - 1;
    const track = document.getElementById('carousel-track');
    const indicators = document.querySelectorAll('#carousel-indicators span');
    if (track) track.style.transform = `translateX(-${slideIndex * 100}%)`;
    indicators.forEach((ind, i) => ind.classList.toggle('active', i === slideIndex));
}

function moveCarousel(n) {
    const total = document.querySelectorAll('.carousel-slide').length;
    if (total > 0) showSlide(slideIndex + n, total);
}