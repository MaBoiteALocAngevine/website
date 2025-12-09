// Dépend des fonctions de _utils.js (calculateItemPrice, calculateItemCaution, showToast)
// =================================================================
// 4. LOGIQUE DU PANIER 
// =================================================================

/**
 * Met à jour le compteur du panier dans le header.
 */
function updateCartCount() {
    const count = panier.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
    
    const submitBtn = document.getElementById('submit-reservation');
    if (submitBtn) {
        if (panier.length > 0) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Envoyer ma demande de réservation";
        } else {
            submitBtn.disabled = true;
            submitBtn.textContent = "Envoyer ma demande de réservation (Panier vide)";
        }
    }

    localStorage.setItem('panier', JSON.stringify(panier));
}

/**
 * Charge le panier depuis le stockage local.
 */
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('panier');
    if (savedCart) {
        panier = JSON.parse(savedCart);
    }
}

/**
 * Ajoute un produit au panier.
 */
function addToCart(id, quantity, startDate, endDate) {
    const existingItemIndex = panier.findIndex(item => item.id === id && item.startDate === startDate && item.endDate === endDate);
    
    if (existingItemIndex > -1) {
        panier[existingItemIndex].quantity += quantity;
    } else {
        panier.push({
            id: id,
            quantity: quantity,
            startDate: startDate,
            endDate: endDate
        });
    }

    updateCartCount();
    const productName = allProductsData.find(p => p.id === id)?.name || `Produit #${id}`;
    showToast(`${quantity} x ${productName} ajouté(s) au panier.`);
    // renderCart est défini dans _ui-data.js
    if (typeof renderCart !== 'undefined') renderCart(); 
}

/**
 * Met à jour la quantité d'un article dans le panier.
 */
function updateCartItem(id, startDate, endDate, newQuantity) {
    const itemIndex = panier.findIndex(item => item.id === id && item.startDate === startDate && item.endDate === endDate);

    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            removeItem(id, startDate, endDate);
        } else {
            panier[itemIndex].quantity = newQuantity;
            updateCartCount();
            if (typeof renderCart !== 'undefined') renderCart();
        }
    }
}

/**
 * Supprime un article du panier.
 */
function removeItem(id, startDate, endDate) {
    panier = panier.filter(item => !(item.id === id && item.startDate === startDate && item.endDate === endDate));
    updateCartCount();
    showToast("Article retiré du panier.");
    if (typeof renderCart !== 'undefined') renderCart();
}

/**
 * Calcule le total de la location (hors caution) pour l'ensemble du panier.
 */
function calculateTotals() {
    const subtotal = panier.reduce((sum, item) => sum + calculateItemPrice(item), 0);
    const totalCaution = calculateTotalCaution();
    return { subtotal, totalCaution };
}

/**
 * Calcule la caution totale pour l'ensemble du panier.
 */
function calculateTotalCaution() {
    return panier.reduce((sum, item) => sum + calculateItemCaution(item), 0);
}

// Gère la soumission du formulaire de réservation
function handleSubmitReservation(event) {
    event.preventDefault();
    if (panier.length === 0) {
        showToast("Votre panier est vide. Veuillez ajouter des articles.");
        return;
    }
    
    const formData = new FormData(event.target);
    const reservationDetails = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        delivery: formData.get('delivery') ? 'Oui' : 'Non',
        panier: panier,
        ...calculateTotals()
    };

    console.log("Demande de réservation envoyée:", reservationDetails);
    
    panier = [];
    updateCartCount();
    if (typeof renderCart !== 'undefined') renderCart();
    event.target.reset(); 
    
    showToast("Votre demande de réservation a été envoyée ! Nous vous recontacterons bientôt.");
    // showSection est défini dans _ui-data.js
    if (typeof showSection !== 'undefined') showSection('accueil'); 
}