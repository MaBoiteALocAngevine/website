let panier = [];
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com";

function parsePrice(str) {
    if (!str) return 0;
    const match = str.replace(/\s/g, '').match(/(\d+([,\.]\d+)?)/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

function calculateItemPrice(item) {
    const val = parsePrice(item.product.price);
    const isDaily = item.product.price.toLowerCase().includes('jour');
    let mult = 1;
    if (isDaily && item.startDate && item.endDate) {
        const diff = Math.abs(new Date(item.endDate) - new Date(item.startDate));
        mult = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    return { total: val * mult * item.quantity, multiplier: mult, isDaily };
}

function addToCartFromModal() {
    const qty = parseInt(document.getElementById('modal-quantity').value) || 1;
    const start = document.getElementById('modal-start-date').value;
    const end = document.getElementById('modal-end-date').value;

    if (start && end && new Date(start) > new Date(end)) {
        window.showToast("Erreur : Dates incorrectes");
        return;
    }

    panier.push({ id: Date.now(), product: window.selectedProductForModal, quantity: qty, startDate: start, endDate: end });
    window.closeModal();
    updateCartUI();
    window.showToast(`✅ ${window.selectedProductForModal.name} ajouté !`);
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = panier.length;
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

    document.getElementById('cart-total-estimate').textContent = `${totalRent.toFixed(2).replace('.', ',')} € TTC`;
    document.getElementById('cart-total-caution').textContent = `${totalCaution.toFixed(2).replace('.', ',')} € TTC`;
    
    // FIX : On cherche le bouton par sa classe réelle dans le HTML
    const validateBtn = document.querySelector('#reservation-form .primary-action-btn');
    if (validateBtn) {
        const email = document.getElementById('user-email').value;
        // Le bouton s'active si le panier n'est pas vide ET que l'email contient un @
        validateBtn.disabled = (panier.length === 0 || !email.includes('@'));
    }
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    container.innerHTML = panier.length ? '' : '<p style="text-align:center; padding:20px; color:var(--text-muted);">Votre panier est vide.</p>';
    
    panier.forEach(item => {
        const calc = calculateItemPrice(item);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom:15px; background:var(--surface); padding:15px; border-radius:15px; border:1px solid var(--border); box-shadow:var(--shadow);">
                <img src="${item.product.main_image}" style="width:60px; height:60px; object-fit:cover; border-radius:10px;">
                <div style="flex-grow:1; margin-left:15px;">
                    <h4 style="margin:0; font-size:0.95rem;">${item.product.name}</h4>
                    <p style="margin:5px 0; font-size:0.85rem; color:var(--text-muted);">Qté: ${item.quantity} | Total: ${calc.total.toFixed(2)} €</p>
                </div>
                <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:var(--primary); font-weight:bold; cursor:pointer; padding:10px;">✕</button>
            </div>`;
        container.appendChild(div);
    });
}

function removeFromCart(id) {
    panier = panier.filter(i => i.id !== id);
    renderCart();
    updateCartUI();
}

function handleDeliveryChange() {
    const check = document.getElementById('delivery-checkbox').checked;
    const addr = document.getElementById('delivery-address-group');
    if (addr) addr.style.display = check ? 'block' : 'none';
}

function handleSubmitReservation(e) {
    e.preventDefault();
    const email = document.getElementById('user-email').value;
    const message = document.getElementById('reservation-message').value;
    const delivery = document.getElementById('delivery-checkbox').checked;
    const address = delivery ? document.getElementById('delivery-address').value : 'N/A';
    
    let body = "RECAPITULATIF DE LA DEMANDE :\n";
    panier.forEach(i => {
        const c = calculateItemPrice(i);
        body += `- ${i.product.name} (x${i.quantity}) | Période: ${i.startDate || 'N/A'} au ${i.endDate || 'N/A'} | Est: ${c.total.toFixed(2)}€\n`;
    });
    
    body += `\nEmail client: ${email}\nLivraison: ${delivery ? 'OUI' : 'NON'}\nAdresse: ${address}\nMessage: ${message}`;

    // CONFIGURATION DE L'ENVOI
    document.getElementById('hidden-replyto').value = email; // Pour que vous puissiez lui répondre directement
    document.getElementById('hidden-subject').value = `Nouvelle demande de réservation - ${email}`;
    document.getElementById('email-body-content').value = body;
    
    // COPIE POUR LE CLIENT : On met l'email du client dans le champ CC
    const ccField = document.getElementById('hidden-cc');
    if (ccField) {
        ccField.value = email; 
    }

    e.target.submit();
}