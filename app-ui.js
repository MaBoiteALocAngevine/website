function addToCartFromModal() {
    const qty = parseInt(document.getElementById('modal-quantity').value) || 1;
    const start = document.getElementById('modal-start-date').value;
    const end = document.getElementById('modal-end-date').value;

    // SÉCURITÉ RENFORCÉE
    if (!start || !end) {
        window.showToast("⚠️ Veuillez choisir les dates de location.");
        return;
    }

    if (new Date(start) >= new Date(end)) {
        window.showToast("⚠️ La date de fin doit être après la date de début.");
        return;
    }

    panier.push({ id: Date.now(), product: window.selectedProductForModal, quantity: qty, startDate: start, endDate: end });
    window.closeModal();
    updateCartUI();
    window.showToast(`✅ ${window.selectedProductForModal.name} ajouté !`);
}