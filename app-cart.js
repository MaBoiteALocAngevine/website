let panier = [];
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com";

function parsePrice(str) {
    if (!str) return 0;
    const match = str.toString().replace(/\s/g, '').match(/(\d+([,\.]\d+)?)/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

function calculateItemPrice(item) {
    const val = parsePrice(item.product.price);
    const isDaily = item.product.price.toLowerCase().includes('jour') || !item.product.title.toLowerCase().includes('forfait');
    let mult = 1;
    if (isDaily && item.startDate && item.endDate) {
        const diff = Math.abs(new Date(item.endDate) - new Date(item.startDate));
        mult = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
    }
    return { total: val * mult * item.quantity, multiplier: mult, isDaily };
}

window.addToCartFromModal = function() {
    const qtyInput = document.getElementById('modal-quantity');
    const qty = parseInt(qtyInput.value) || 1;
    const start = document.getElementById('modal-start-date').value;
    const end = document.getElementById('modal-end-date').value;

    if (!start || !end) {
        window.showToast("⚠️ Veuillez choisir les dates de location.");
        return;
    }

    const maxAllowed = parseInt(window.selectedProductForModal.inventory);
    if (qty > maxAllowed) {
        window.showToast(`⚠️ Quantité limitée : seulement ${maxAllowed} disponible(s).`);
        qtyInput.value = maxAllowed;
        return;
    }

    panier.push({ id: Date.now(), product: window.selectedProductForModal, quantity: qty, startDate: start, endDate: end });
    window.closeModal();
    window.updateCartUI();
    window.showToast(`✅ ${window.selectedProductForModal.name} ajouté !`);
};

window.updateCartUI = function() {
    const count = document.getElementById('cart-count');
    if (count) count.textContent = panier.length;
    renderCartSummary();
};

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
    
    const validateBtn = document.querySelector('#reservation-form .primary-action-btn');
    if (validateBtn) {
        const email = document.getElementById('user-email').value;
        validateBtn.disabled = (panier.length === 0 || !email.includes('@'));
    }
}

window.renderCart = function() {
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
};

window.removeFromCart = function(id) {
    panier = panier.filter(i => i.id !== id);
    window.renderCart();
    window.updateCartUI();
};

window.handleDeliveryChange = function() {
    const check = document.getElementById('delivery-checkbox').checked;
    const addr = document.getElementById('delivery-address-group');
    if (addr) addr.style.display = check ? 'block' : 'none';
};

window.handleSubmitReservation = function(e) {
    e.preventDefault();
    const email = document.getElementById('user-email').value.trim();
    const message = document.getElementById('reservation-message').value || "Aucun message particulier.";
    const delivery = document.getElementById('delivery-checkbox').checked;
    const address = delivery ? document.getElementById('delivery-address').value : "Retrait par le client (Rives du Loir)";
    const marketing = document.getElementById('marketing-consent').checked ? "OUI ✅" : "NON ❌";
    
    let totalRent = 0;
    let totalCaution = 0;
    let articlesList = "";

    panier.forEach(i => {
        const c = calculateItemPrice(i);
        totalRent += c.total;
        totalCaution += parsePrice(i.product.caution) * i.quantity;
        articlesList += `\n■ ${i.product.name.toUpperCase()}\n  Quantité : x${i.quantity}\n  Période  : du ${i.startDate} au ${i.endDate}\n  Sous-total : ${c.total.toFixed(2)} €\n  --------------------------------------`;
    });
    
    let body = `==========================================\n   NOUVELLE DEMANDE DE RÉSERVATION\n==========================================\n\nCOORDONNÉES DU CLIENT :\n------------------------------------------\n📧 Email : ${email}\n🚚 Livraison : ${delivery ? "OUI" : "NON"}\n📍 Adresse : ${address}\n📢 Inscription Nouveautés : ${marketing}\n\nDÉTAILS :\n------------------------------------------${articlesList}\n\nRÉCAPITULATIF :\n------------------------------------------\n💰 TOTAL LOCATION : ${totalRent.toFixed(2)} € TTC\n🛡️ TOTAL CAUTIONS : ${totalCaution.toFixed(2)} € TTC\n\nMESSAGE :\n"${message}"\n\n==========================================\nMa boîte à loc' Angevine\n==========================================`;

    document.getElementById('hidden-replyto').value = email;
    document.getElementById('hidden-cc').value = email;
    document.getElementById('hidden-subject').value = `Demande de réservation - ${email}`;
    document.getElementById('email-body-content').value = body;

    e.target.submit();
};