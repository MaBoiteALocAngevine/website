let panier = [];
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com";

// ==========================================
// GESTION GLOBALE DES DATES DE LOCATION
// ==========================================
window.globalRentalDates = {
    start: '',
    end: ''
};

function formatDateFR(str) {
    if (!str) return '';
    const parts = str.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
}

function calculateDurationDays(start, end) {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.abs(d2 - d1);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

window.initGlobalDates = function() {
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('global-start-date');
    const endInput = document.getElementById('global-end-date');
    
    if (startInput) startInput.min = today;
    if (endInput) endInput.min = today;

    // Restaurer depuis localStorage si existant
    try {
        const saved = localStorage.getItem('mbal_rental_dates');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.start && parsed.end && parsed.start >= today) {
                window.globalRentalDates.start = parsed.start;
                window.globalRentalDates.end = parsed.end;
            }
        }
    } catch (e) {
        console.warn("Erreur lecture dates globales:", e);
    }

    window.updateGlobalDatesUI();
};

window.updateGlobalDatesUI = function() {
    const { start, end } = window.globalRentalDates;
    const startInput = document.getElementById('global-start-date');
    const endInput = document.getElementById('global-end-date');
    const badge = document.getElementById('global-dates-badge');
    const resetBtn = document.getElementById('reset-global-dates-btn');
    const applyBtn = document.getElementById('apply-to-cart-btn');
    const cartDatesText = document.getElementById('cart-dates-text');

    if (startInput && startInput.value !== start) startInput.value = start;
    if (endInput) {
        if (start) endInput.min = start;
        if (endInput.value !== end) endInput.value = end;
    }

    if (start && end) {
        const days = calculateDurationDays(start, end);
        const text = `Du ${formatDateFR(start)} au ${formatDateFR(end)} (${days} jour${days > 1 ? 's' : ''})`;

        if (badge) {
            badge.style.display = 'inline-flex';
            badge.textContent = `📅 ${text}`;
        }
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (applyBtn) {
            applyBtn.style.display = (panier.length > 0) ? 'inline-block' : 'none';
        }
        if (cartDatesText) cartDatesText.textContent = text;
    } else {
        if (badge) badge.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (applyBtn) applyBtn.style.display = 'none';
        if (cartDatesText) cartDatesText.textContent = "Non définie";
    }
};

window.handleGlobalStartDateChange = function() {
    const startInput = document.getElementById('global-start-date');
    const endInput = document.getElementById('global-end-date');
    const start = startInput.value;
    if (!start) return;

    endInput.min = start;
    let end = endInput.value;
    if (!end || end < start) {
        end = start;
        endInput.value = start;
    }

    window.setGlobalDates(start, end);
};

window.handleGlobalEndDateChange = function() {
    const startInput = document.getElementById('global-start-date');
    const endInput = document.getElementById('global-end-date');
    const today = new Date().toISOString().split('T')[0];
    let start = startInput.value;
    const end = endInput.value;

    if (!end) return;
    if (!start) {
        start = today;
        startInput.value = today;
        endInput.min = today;
    }

    if (end < start) {
        endInput.value = start;
        window.setGlobalDates(start, start);
    } else {
        window.setGlobalDates(start, end);
    }
};

window.setGlobalDates = function(start, end, showToastNotification = true) {
    window.globalRentalDates.start = start;
    window.globalRentalDates.end = end;

    try {
        localStorage.setItem('mbal_rental_dates', JSON.stringify({ start, end }));
    } catch (e) {}

    window.updateGlobalDatesUI();

    // Mettre à jour automatiquement les articles du panier s'il y en a
    if (panier.length > 0) {
        panier.forEach(item => {
            item.startDate = start;
            item.endDate = end;
        });
        window.renderCart();
        window.updateCartUI();
        if (showToastNotification && typeof window.showToast === 'function') {
            const days = calculateDurationDays(start, end);
            window.showToast(`📅 Dates appliquées au panier (${days} jour${days > 1 ? 's' : ''})`);
        }
    } else if (showToastNotification && typeof window.showToast === 'function') {
        const days = calculateDurationDays(start, end);
        window.showToast(`📅 Dates enregistrées : ${days} jour${days > 1 ? 's' : ''}`);
    }
};

window.resetGlobalDates = function() {
    window.globalRentalDates.start = '';
    window.globalRentalDates.end = '';
    try {
        localStorage.removeItem('mbal_rental_dates');
    } catch (e) {}

    const startInput = document.getElementById('global-start-date');
    const endInput = document.getElementById('global-end-date');
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    window.updateGlobalDatesUI();
    if (typeof window.showToast === 'function') {
        window.showToast("Dates de location réinitialisées.");
    }
};

window.applyGlobalDatesToCart = function() {
    const { start, end } = window.globalRentalDates;
    if (!start || !end) {
        if (typeof window.showToast === 'function') {
            window.showToast("⚠️ Veuillez d'abord choisir vos dates de location.");
        }
        return;
    }

    if (panier.length === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast("Votre panier est actuellement vide.");
        }
        return;
    }

    panier.forEach(item => {
        item.startDate = start;
        item.endDate = end;
    });

    window.renderCart();
    window.updateCartUI();
    if (typeof window.showToast === 'function') {
        window.showToast("✅ Dates appliquées à tous vos articles !");
    }
};

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

    // Si aucune date globale n'était définie, adopter ces dates pour la suite
    if (!window.globalRentalDates.start || !window.globalRentalDates.end) {
        window.setGlobalDates(start, end, false);
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
    window.updateGlobalDatesUI();
};

function renderCartSummary() {
    let totalRent = 0, totalCaution = 0, totalQty = 0;
    panier.forEach(item => {
        const calc = calculateItemPrice(item);
        totalRent += calc.total;
        totalQty += item.quantity;
        totalCaution += parsePrice(item.product.caution) * item.quantity;
    });

    const rentEl = document.getElementById('cart-total-estimate');
    if (rentEl) rentEl.textContent = `${totalRent.toFixed(2).replace('.', ',')} € TTC`;
    const cautionEl = document.getElementById('cart-total-caution');
    if (cautionEl) cautionEl.textContent = `${totalCaution.toFixed(2).replace('.', ',')} € TTC`;
    
    const validateBtn = document.querySelector('#reservation-form .primary-action-btn');
    if (validateBtn) {
        const emailInput = document.getElementById('user-email');
        const email = emailInput ? emailInput.value : '';
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
                    <p style="margin:5px 0; font-size:0.85rem; color:var(--text-muted);">Qté: ${item.quantity} | Total: ${calc.total.toFixed(2)} € (du ${formatDateFR(item.startDate)} au ${formatDateFR(item.endDate)}${calc.isDaily ? ` - ${calc.multiplier} jour${calc.multiplier > 1 ? 's' : ''}` : ''})</p>
                </div>
                <button onclick="window.removeFromCart(${item.id})" style="background:none; border:none; color:var(--primary); font-weight:bold; cursor:pointer; padding:10px; font-size:1.1rem;" title="Supprimer">✕</button>
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
        articlesList += `\n■ ${i.product.name.toUpperCase()}\n  Quantité : x${i.quantity}\n  Période  : du ${formatDateFR(i.startDate)} au ${formatDateFR(i.endDate)} (${c.multiplier} jour${c.multiplier > 1 ? 's' : ''})\n  Sous-total : ${c.total.toFixed(2)} €\n  --------------------------------------`;
    });
    
    let body = `
==========================================
   NOUVELLE DEMANDE DE RÉSERVATION
==========================================

COORDONNÉES DU CLIENT :
------------------------------------------
📧 Email : ${email}
🚚 Livraison : ${delivery ? "OUI" : "NON"}
📍 Adresse : ${address}
📢 Inscription Nouveautés : ${marketing}

DÉTAILS DE LA COMMANDE :
------------------------------------------
${articlesList}

RÉCAPITULATIF FINANCIER :
------------------------------------------
💰 TOTAL LOCATION : ${totalRent.toFixed(2)} € TTC
🛡️ TOTAL CAUTIONS : ${totalCaution.toFixed(2)} € TTC

MESSAGE DU CLIENT :
------------------------------------------
"${message}"

==========================================
Ma boîte à loc' Angevine
Rives-du-Loir-en-Anjou | 06 52 98 23 48
==========================================`;

    // Remplissage des champs pour Web3Forms
    const subjectEl = document.getElementById('hidden-subject');
    if (subjectEl) subjectEl.value = `Demande de réservation - ${email}`;
    
    const ccField = document.getElementById('hidden-cc');
    if (ccField) {
        ccField.value = email; // Envoi de la copie au client
    }

    const bodyEl = document.getElementById('email-body-content');
    if (bodyEl) bodyEl.value = body;

    // Envoi final
    e.target.submit();
};

