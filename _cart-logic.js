// Dépendances: _config.js, _utils.js (showToast, calculateItemPrice, formatDate, extractPriceDetails)

// --- GESTION DU STOCKAGE DU PANIER ---

/**
 * Sauvegarde l'état actuel du panier dans le stockage local.
 */
function saveCart() {
    localStorage.setItem('panier', JSON.stringify(panier));
    updateCartCount();
}

/**
 * Met à jour le compteur du panier dans la navigation.
 */
function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    const totalItems = panier.reduce((sum, item) => sum + item.quantity, 0);
    if (countElement) {
        countElement.textContent = totalItems > 0 ? `(${totalItems})` : '';
    }
}

// --- AJOUT ET MODIFICATION DU PANIER ---

/**
 * Ajoute le produit sélectionné (dans la modale) au panier.
 */
function addToCartFromModal() {
    const product = selectedProductForModal;
    const quantity = parseInt(document.getElementById('modal-quantity').value);
    const startDate = document.getElementById('modal-start-date').value;
    const endDate = document.getElementById('modal-end-date').value;
    
    if (!product || !quantity || quantity <= 0) {
        showToast("Veuillez choisir une quantité valide.");
        return;
    }
    if (quantity > product.max_quantity) {
        showToast(`Quantité maximale pour ce produit : ${product.max_quantity}`);
        return;
    }
    // Validation des dates si le prix est journalier
    const { isDaily } = extractPriceDetails(product.price);
    if (isDaily) {
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            showToast("Veuillez choisir des dates de début et de fin valides.");
            return;
        }
    }

    const item = {
        productId: product.id,
        name: product.name,
        image_url: product.image_url,
        price: product.price,
        caution: product.caution,
        quantity: quantity,
        startDate: startDate || null,
        endDate: endDate || null
    };

    // Vérifier si un produit avec les mêmes ID et DATES est déjà dans le panier
    const existingItemIndex = panier.findIndex(p => 
        p.productId === item.productId && p.startDate === item.startDate && p.endDate === item.endDate
    );

    if (existingItemIndex > -1) {
        // Mettre à jour la quantité
        panier[existingItemIndex].quantity += quantity;
        showToast(`Quantité de ${product.name} mise à jour dans le panier.`);
    } else {
        // Ajouter un nouvel article
        panier.push(item);
        showToast(`${product.name} ajouté au panier !`);
    }

    saveCart();
    closeModal();
}

/**
 * Supprime un article du panier.
 * @param {number} itemId Index de l'article dans le tableau `panier`.
 */
function removeItemFromCart(itemId) {
    if (confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
        panier.splice(itemId, 1);
        saveCart();
        renderCart(); // Re-render the cart
        showToast("Article retiré du panier.");
    }
}

/**
 * Met à jour la quantité d'un article dans le panier.
 * @param {number} itemId Index de l'article.
 * @param {number} newQuantity Nouvelle quantité.
 */
function updateCartQuantity(itemId, newQuantity) {
    newQuantity = parseInt(newQuantity);
    if (newQuantity < 1 || isNaN(newQuantity)) return;
    
    // (Note: La vérification de la quantité max devrait être faite ici si les données produit sont facilement accessibles)
    panier[itemId].quantity = newQuantity;
    saveCart();
    renderCart();
}

/**
 * Met à jour les dates de location d'un article.
 * @param {number} itemId Index de l'article.
 * @param {string} newStartDate Nouvelle date de début.
 * @param {string} newEndDate Nouvelle date de fin.
 */
function updateCartDates(itemId, newStartDate, newEndDate) {
    if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
        showToast("La date de fin doit être postérieure ou égale à la date de début.");
        // Recharger les valeurs précédentes pour annuler l'entrée utilisateur
        document.getElementById(`cart-start-date-${itemId}`).value = panier[itemId].startDate;
        document.getElementById(`cart-end-date-${itemId}`).value = panier[itemId].endDate;
        return;
    }

    panier[itemId].startDate = newStartDate;
    panier[itemId].endDate = newEndDate;
    saveCart();
    renderCart();
}

// --- AFFICHAGE DU PANIER ET TOTALS ---

/**
 * Rend l'affichage complet du panier.
 */
function renderCart() {
    const cartList = document.getElementById('cart-list');
    const cartTotals = document.getElementById('cart-totals');
    const reservationForm = document.getElementById('reservation-form');

    if (!cartList || !cartTotals || !reservationForm) return;

    cartList.innerHTML = '';
    
    if (panier.length === 0) {
        cartList.innerHTML = '<p class="empty-cart-message">Votre panier est vide pour le moment.</p>';
        cartTotals.innerHTML = '';
        reservationForm.style.display = 'none';
        return;
    }

    let subTotal = 0;
    let totalCaution = 0;
    reservationForm.style.display = 'block';

    panier.forEach((item, index) => {
        const itemTotal = calculateItemPrice(item);
        subTotal += itemTotal;
        
        // Extraction de la caution
        const cautionMatch = item.caution.match(/([\d\s,]+)\s*€/i);
        // Nettoyage de la valeur de la caution
        const cautionValue = cautionMatch ? parseFloat(cautionMatch[1].replace(/,/g, '.').replace(/\s/g, '')) : 0; 
        totalCaution += cautionValue * item.quantity;

        const isDaily = extractPriceDetails(item.price).isDaily;

        const cartItemHTML = `
            <div class="cart-item">
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price-unit">${item.price}</p>
                    
                    ${isDaily ? 
                        `<div class="cart-dates">
                            <label>Du:</label>
                            <input type="date" id="cart-start-date-${index}" value="${item.startDate || ''}" 
                                onchange="updateCartDates(${index}, this.value, document.getElementById('cart-end-date-${index}').value)">
                            <label>Au:</label>
                            <input type="date" id="cart-end-date-${index}" value="${item.endDate || ''}" 
                                onchange="updateCartDates(${index}, document.getElementById('cart-start-date-${index}').value, this.value)">
                        </div>` 
                        : `<p class="cart-dates-info">Location forfaitaire</p>`
                    }

                    <div class="cart-item-controls">
                        <label for="cart-quantity-${index}">Qté:</label>
                        <input type="number" id="cart-quantity-${index}" value="${item.quantity}" min="1" 
                            onchange="updateCartQuantity(${index}, this.value)" class="quantity-input">
                        <span class="cart-item-total">Total: ${itemTotal.toFixed(2).replace('.', ',')} €</span>
                        <button onclick="removeItemFromCart(${index})" class="remove-btn">Retirer</button>
                    </div>
                </div>
            </div>
        `;
        cartList.innerHTML += cartItemHTML;
    });

    // Affichage des totaux
    const deliveryCheck = document.getElementById('delivery-check');
    const isDeliveryChecked = deliveryCheck ? deliveryCheck.checked : false;
    const deliveryCost = isDeliveryChecked ? DELIVERY_INFO_MESSAGE : "0,00 €";

    cartTotals.innerHTML = `
        <div class="cart-summary">
            <p>Sous-Total Location: <span>${subTotal.toFixed(2).replace('.', ',')} €</span></p>
            <p>Total Caution: <span>${totalCaution.toFixed(2).replace('.', ',')} €</span></p>
            
            <div class="delivery-option">
                <input type="checkbox" id="delivery-check" onchange="handleDeliveryChange()" ${isDeliveryChecked ? 'checked' : ''}>
                <label for="delivery-check">Demande de Livraison</label>
            </div>
            <p class="delivery-cost">Frais de livraison: <span>${deliveryCost}</span></p>
            
            <h3 class="grand-total">TOTAL (Location + Caution): <span>${(subTotal + totalCaution).toFixed(2).replace('.', ',')} €</span></h3>
        </div>
    `;
    
    // Réattacher l'événement pour la case à cocher après le rendu
    // C'est nécessaire car innerHTML écrase l'élément
    const newDeliveryCheck = document.getElementById('delivery-check');
    if (newDeliveryCheck) {
        newDeliveryCheck.onchange = handleDeliveryChange;
    }
}

/**
 * Gère le changement d'état de la case à cocher de livraison.
 */
function handleDeliveryChange() {
    renderCart(); // Re-render pour mettre à jour l'affichage des frais
}


// --- SOUMISSION DE LA RÉSERVATION ---

/**
 * Gère la soumission du formulaire de réservation et prépare l'email.
 * @param {Event} event L'événement de soumission du formulaire.
 */
function handleSubmitReservation(event) {
    event.preventDefault();

    if (panier.length === 0) {
        showToast("Votre panier est vide.");
        return;
    }
    
    const name = document.getElementById('client-name').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;
    const message = document.getElementById('client-message').value;
    const isDelivery = document.getElementById('delivery-check').checked;

    if (!name || !email || !phone) {
        showToast("Veuillez remplir votre nom, email et téléphone.");
        return;
    }

    let emailBody = `Réservation de matériel pour ${name} (${phone}, ${email})\n\n`;
    emailBody += "--- DÉTAIL DE LA COMMANDE ---\n";

    let subTotal = 0;
    let totalCaution = 0;

    panier.forEach((item) => {
        const itemTotal = calculateItemPrice(item);
        subTotal += itemTotal;

        const cautionMatch = item.caution.match(/([\d\s,]+)\s*€/i);
        const cautionValue = cautionMatch ? parseFloat(cautionMatch[1].replace(/,/g, '.').replace(/\s/g, '')) : 0;
        totalCaution += cautionValue * item.quantity;

        const datesString = item.startDate && item.endDate ? ` (Du ${formatDate(item.startDate)} au ${formatDate(item.endDate)})` : '';

        emailBody += `\n- ${item.name} (${item.price}) x ${item.quantity}${datesString}`;
        emailBody += `\n  > Total Est. Location: ${itemTotal.toFixed(2).replace('.', ',')} € (Caution: ${item.caution} x ${item.quantity})`;
    });

    const grandTotal = subTotal + totalCaution;
    
    emailBody += "\n\n--- RÉSUMÉ DES COÛTS ---\n";
    emailBody += `Sous-Total Location: ${subTotal.toFixed(2).replace('.', ',')} €\n`;
    emailBody += `Total Caution: ${totalCaution.toFixed(2).replace('.', ',')} €\n`;
    emailBody += `Demande de Livraison: ${isDelivery ? 'OUI (' + DELIVERY_INFO_MESSAGE + ')' : 'NON'}\n`;
    emailBody += `TOTAL ESTIMÉ (Location + Caution): ${grandTotal.toFixed(2).replace('.', ',')} €\n`;

    if (message) {
        emailBody += `\n--- MESSAGE SUPPLÉMENTAIRE --\n${message}\n`;
    }

    // Effacer le panier et rediriger vers le client de messagerie
    localStorage.removeItem('panier');
    panier = [];
    saveCart(); 

    const subject = `Demande de Réservation: ${name}`;
    const mailtoLink = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    window.location.href = mailtoLink;

    // Afficher un message de confirmation rapide avant la redirection
    showToast("Email de réservation préparé ! Veuillez l'envoyer via votre client de messagerie.");
    showSection('accueil'); // Rediriger l'utilisateur
}