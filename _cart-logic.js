// --- _cart-logic.js ---
// Dépendances: _config.js, _utils.js (showToast, calculateItemPrice, formatDate, extractPriceDetails, calculateTotalCaution, calculateItemCaution)

// --- GESTION DU STOCKAGE DU PANIER ---

/**
 * Sauvegarde l'état actuel du panier dans le stockage local.
 */
function saveCart() {
    localStorage.setItem('panier', JSON.stringify(panier));
    updateCartCount();
    // Re-rendre le panier si nous sommes sur la section panier
    if (document.getElementById('panier-section').classList.contains('active')) {
        renderCart();
    }
}

/**
 * Met à jour le compteur du panier dans la navigation.
 */
function updateCartCount() {
    const countElement = document.getElementById('cart-count');
    const totalItems = panier.reduce((sum, item) => sum + item.quantity, 0);
    if (countElement) {
        // Affiche la quantité totale d'articles dans le panier
        countElement.textContent = totalItems > 0 ? totalItems : 0; 

        // Mise à jour du bouton de réservation
        const submitButton = document.getElementById('submit-reservation');
        if (submitButton) {
            if (totalItems > 0) {
                submitButton.disabled = false;
                submitButton.textContent = "Envoyer ma demande de réservation";
            } else {
                submitButton.disabled = true;
                submitButton.textContent = "Envoyer ma demande de réservation (Panier vide)";
            }
        }
    }
}

// --- AJOUT ET MODIFICATION DU PANIER ---

/**
 * Ajoute le produit sélectionné (dans la modale) au panier.
 */
function addToCartFromModal() {
    const product = selectedProductForModal;
    const quantityInput = document.getElementById('modal-quantity');
    const quantity = parseInt(quantityInput ? quantityInput.value : 0);
    const startDateInput = document.getElementById('modal-start-date');
    const endDateInput = document.getElementById('modal-end-date');
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;
    
    if (!product || !quantity || quantity <= 0) {
        showToast("Veuillez choisir une quantité valide.");
        return;
    }
    
    // Vérification de la quantité maximale
    if (quantity > product.max_quantity) {
        showToast(`Quantité maximale pour ce produit : ${product.max_quantity}`);
        return;
    }

    // Validation des dates si le prix est journalier
    const { isDaily } = extractPriceDetails(product.price);
    if (isDaily) {
        if (!startDate || !endDate || new Date(startDate) > new Date(endDate)) {
            // CORRECTION DE L'ERREUR DE SYNTAXE
            showToast("Veuillez choisir des dates de location valides."); 
            return;
        }
    }

    // Créer un identifiant unique pour cette instance du panier
    const cartItemId = `${product.id}-${Date.now()}`; 

    const newItem = {
        cartItemId: cartItemId, 
        id: product.id, 
        name: product.name, 
        quantity: quantity, 
        startDate: startDate, 
        endDate: endDate
    };

    panier.push(newItem);
    saveCart();
    closeModal();
    showToast(`${quantity}x ${product.name} ajouté(s) au panier.`);
}

/**
 * Supprime un article du panier.
 * @param {string} cartItemId L'identifiant unique de l'article dans le panier.
 */
function removeItem(cartItemId) {
    panier = panier.filter(item => item.cartItemId !== cartItemId);
    saveCart();
    showToast("Article retiré du panier.");
}

/**
 * Met à jour la quantité, la date de début ou de fin d'un article du panier.
 * @param {string} cartItemId L'identifiant unique de l'article dans le panier.
 * @param {string} type Le type de champ à mettre à jour ('quantity', 'startDate', 'endDate').
 * @param {string|number} value La nouvelle valeur.
 */
function updateCartItem(cartItemId, type, value) {
    const itemIndex = panier.findIndex(item => item.cartItemId === cartItemId);
    if (itemIndex > -1) {
        const item = panier[itemIndex];
        const product = allProductsData.find(p => p.id === item.id);
        
        // Validation de quantité
        if (type === 'quantity') {
            const newQuantity = parseInt(value);
            if (newQuantity > 0 && newQuantity <= product.max_quantity) {
                item.quantity = newQuantity;
            } else if (newQuantity <= 0) {
                // Option : supprimer l'article si la quantité est 0
                removeItem(cartItemId);
                return; 
            } else {
                showToast(`Quantité maximale pour ${product.name} : ${product.max_quantity}`);
                // Revenir à l'ancienne valeur dans l'interface si l'entrée est invalide
                document.querySelector(`#item-${cartItemId} [data-type="quantity"]`).value = item.quantity;
                return;
            }
        } else if (type === 'startDate' || type === 'endDate') {
            item[type] = value;
            // Re-valider les dates si les deux sont définies
            const { isDaily } = extractPriceDetails(product.price);
            if (isDaily && item.startDate && item.endDate && new Date(item.startDate) > new Date(item.endDate)) {
                showToast("Date de début doit être antérieure ou égale à la date de fin.");
                // Optionnel: réinitialiser l'une des dates
                item[type] = ''; 
                document.querySelector(`#item-${cartItemId} [data-type="${type}"]`).value = '';
                return;
            }
        }

        saveCart();
        renderCart(); // Re-render pour mettre à jour les totaux
    }
}

// --- RENDU DU PANIER ---

/**
 * Affiche le contenu du panier sur la page 'panier'.
 */
function renderCart() {
    const container = document.getElementById('cart-items-container');
    const summary = document.getElementById('cart-summary');
    container.innerHTML = '';

    if (panier.length === 0) {
        container.innerHTML = '<p class="empty-cart-message">Votre panier est vide.</p>';
        summary.style.display = 'none';
        updateCartCount(); // Pour désactiver le bouton de réservation
        return;
    }

    summary.style.display = 'block';
    
    // Rendu des articles
    panier.forEach(item => {
        const product = allProductsData.find(p => p.id === item.id);
        if (!product) return; // Si le produit n'est pas trouvé

        const itemTotal = calculateItemPrice(item).toFixed(2);
        const itemCaution = calculateItemCaution(item).toFixed(2);
        const { isDaily, priceValue } = extractPriceDetails(product.price);

        const priceDetails = isDaily 
            ? `(${priceValue.toFixed(2)} € / jour)` 
            : `(${priceValue.toFixed(2)} €)`;

        const dateControls = isDaily ? `
            <div class="cart-dates-control">
                <label for="start-${item.cartItemId}">Début:</label>
                <input type="date" id="start-${item.cartItemId}" data-type="startDate" value="${item.startDate || ''}" 
                       onchange="updateCartItem('${item.cartItemId}', 'startDate', this.value)">
                <label for="end-${item.cartItemId}">Fin:</label>
                <input type="date" id="end-${item.cartItemId}" data-type="endDate" value="${item.endDate || ''}" 
                       onchange="updateCartItem('${item.cartItemId}', 'endDate', this.value)">
            </div>
        ` : '';

        const cartItemHTML = `
            <div class="cart-item" id="item-${item.cartItemId}">
                <img src="${product.image_url}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name} ${priceDetails}</h4>
                    <p>Caution : <span class="cart-item-caution">${itemCaution} €</span></p>
                    <p class="item-total-price">Total estimé : <strong class="price-estimate">${itemTotal} €</strong></p>
                    ${dateControls}
                </div>
                <div class="item-controls">
                    <label for="qty-${item.cartItemId}">Quantité :</label>
                    <input type="number" id="qty-${item.cartItemId}" data-type="quantity" value="${item.quantity}" min="1" max="${product.max_quantity}"
                           onchange="updateCartItem('${item.cartItemId}', 'quantity', this.value)">
                    <button class="remove-btn" onclick="removeItem('${item.cartItemId}')">Retirer</button>
                </div>
            </div>
        `;
        container.innerHTML += cartItemHTML;
    });

    // Rendu du résumé
    calculateCartTotals();
    updateCartCount();
}


/**
 * Calcule et affiche les totaux du panier (sous la liste des articles).
 */
function calculateCartTotals() {
    const summary = document.getElementById('cart-summary');
    const totalHT = panier.reduce((sum, item) => sum + calculateItemPrice(item), 0);
    const totalCaution = calculateTotalCaution();

    // NOTE: Micro-entreprise, nous supposons pas de TVA pour l'instant (Montant Total = Montant HT)
    const totalTTC = totalHT; 
    
    // Affichage des totaux
    summary.innerHTML = `
        <div class="reservation-summary">
            <h3>Résumé de la Réservation</h3>
            <div class="cart-totals">
                <p>Sous-total (HT) : <span class="price-estimate bold-text">${totalHT.toFixed(2)} €</span></p>
                <p>TVA (0% - Micro-entreprise) : <span>0.00 €</span></p>
                <p>Total estimé (TTC) : <span class="price-estimate bold-text">${totalTTC.toFixed(2)} €</span></p>
                <p class="caution-total">Caution Totale : <span class="bold-text">${totalCaution.toFixed(2)} €</span></p>
            </div>

            <div class="cart-policy-info">
                <strong>Attention :</strong> Ce total est une estimation. Le prix final sera confirmé avec la date de réservation et l'option de livraison/retrait.
                <p class="caution-return-note">La caution totale est due à la remise du matériel et est restituée en intégralité à son retour, sous réserve de l'état du matériel.</p>
            </div>
        </div>
    `;
}

// --- GESTION DU FORMULAIRE DE RÉSERVATION ---

/**
 * Gère la soumission du formulaire de réservation.
 * @param {Event} event L'événement de soumission.
 */
function handleSubmitReservation(event) {
    event.preventDefault();

    if (panier.length === 0) {
        showToast("Votre panier est vide, impossible d'envoyer la demande.");
        return;
    }

    const form = event.target;
    const name = form.elements['name'].value;
    const email = form.elements['email'].value;
    const phone = form.elements['phone'].value;
    const message = form.elements['message'].value;
    const delivery = form.elements['delivery'].checked;
    
    // Construire le corps de l'e-mail
    let subject = `Demande de Réservation: ${name}`;
    let body = `Bonjour Ma boîte à loc' Angevine,\n\n`;
    body += `Je souhaite effectuer une demande de réservation pour les articles suivants :\n\n`;

    let totalEstim = 0;

    panier.forEach((item, index) => {
        const product = allProductsData.find(p => p.id === item.id);
        const itemTotal = calculateItemPrice(item);
        totalEstim += itemTotal;
        
        let dateInfo = '';
        const { isDaily } = extractPriceDetails(product.price);

        if (isDaily && item.startDate && item.endDate) {
            dateInfo = `Du ${formatDate(item.startDate)} au ${formatDate(item.endDate)}`;
        } else if (isDaily) {
            dateInfo = `(Dates de location à préciser)`;
        }

        body += `${index + 1}. ${item.name} (ID: ${item.id})\n`;
        body += `   Quantité: ${item.quantity}\n`;
        if (dateInfo) body += `   Période: ${dateInfo}\n`;
        body += `   Prix estimé : ${itemTotal.toFixed(2)} €\n`;
        body += `   Caution unitaire : ${calculateItemCaution(item).toFixed(2)} €\n\n`;
    });

    const totalCaution = calculateTotalCaution();

    body += `-------------------------------------------\n`;
    body += `Total Estimé HT/TTC : ${totalEstim.toFixed(2)} €\n`;
    body += `Caution Totale : ${totalCaution.toFixed(2)} €\n`;
    body += `\n-------------------------------------------\n`;
    body += `Détails du demandeur:\n`;
    body += `Nom / Entreprise: ${name}\n`;
    body += `Email: ${email}\n`;
    body += `Téléphone: ${phone || 'Non renseigné'}\n`;
    body += `Livraison / Retrait souhaité: ${delivery ? 'OUI' : 'NON'}\n`;
    if (message) body += `Message / Besoins spécifiques: ${message}\n`;
    
    body += `\nMerci de me recontacter pour confirmer la disponibilité et le prix total.\n`;

    // Créer le lien mailto
    const mailtoLink = `mailto:maboitealocangevine@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Ouvrir le client mail
    window.location.href = mailtoLink;

    // Optionnel : Vider le panier après l'envoi de l'e-mail (après confirmation)
    // panier = [];
    // saveCart(); 
    // showToast("Demande envoyée ! Veuillez confirmer l'e-mail dans votre client mail.");
}