let panier = [];
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com";

function parsePrice(priceString) {
    if (!priceString) return 0;
    const match = priceString.replace(/\s/g, '').match(/(\d+([,\.]\d+)?)/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

function calculateItemPrice(item) {
    const priceValue = parsePrice(item.product.price);
    const isDaily = item.product.price.toLowerCase().includes('jour');
    let multiplier = 1;

    if (isDaily && item.startDate && item.endDate) {
        const diffTime = Math.abs(new Date(item.endDate) - new Date(item.startDate));
        multiplier = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return { total: priceValue * multiplier * item.quantity, multiplier, isDaily };
}

function addToCartFromModal() {
    const qty = parseInt(document.getElementById('modal-quantity').value);
    const start = document.getElementById('modal-start-date').value;
    const end = document.getElementById('modal-end-date').value;

    if (start && end && new Date(start) > new Date(end)) {
        showToast("Erreur : Dates incorrectes");
        return;
    }

    panier.push({ id: Date.now(), product: selectedProductForModal, quantity: qty, startDate: start, endDate: end });
    closeModal();
    updateCartUI();
    showToast(`✅ ${selectedProductForModal.name} ajouté !`);
}

function updateCartUI() {
    document.getElementById('cart-count').textContent = panier.length;
    renderCartSummary();
}

function renderCartSummary() {
    let totalRent = 0, totalCaution = 0, totalQty = 0;
    panier.forEach(item => {
        const calc = calculateItemPrice(item);
        totalRent += calc.total;
        totalQty += item.quantity;
        totalCaution += parsePrice(item.product.caution) * item.quantity;
    });

    document.getElementById('cart-total-price').textContent = `${totalQty} article(s)`;
    document.getElementById('cart-total-estimate').textContent = `${totalRent.toFixed(2).replace('.', ',')} € TTC`;
    document.getElementById('cart-total-caution').textContent = `${totalCaution.toFixed(2).replace('.', ',')} € TTC`;
    
    document.querySelector('#reservation-form .validate-btn').disabled = (panier.length === 0 || !document.getElementById('user-email').value.includes('@'));
}

// Ajoutez ici vos fonctions removeFromCart, updateCartQuantity et handleSubmitReservation (le code est identique à votre script.js initial)