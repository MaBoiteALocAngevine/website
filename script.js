// --- VARIABLES GLOBALES ---
        let allProductsData = [];
        let carouselImagesData = []; // Liste des images pour le carrousel
        let slideIndex = 0;
        let totalSlides = 0;
        let carouselInterval;
        let selectedProductForModal = null;
        let panier = [];
        const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis)";
        const BUSINESS_EMAIL = "maboitealocangevine@gmail.com"; 

        const CATEGORIES = {
            'all': 'Tous les produits',
            'evenementiel': 'Événementiel',
            'outillage': 'Outillage'
        };

        // --- MODE SOMBRE ---
        document.addEventListener("DOMContentLoaded", () => {
            const toggle = document.getElementById("dark-mode-toggle");
            if (toggle) {
                 // Fonction de bascule du mode sombre
                toggle.addEventListener("click", () => {
                    document.body.classList.toggle("dark-mode");
                });
            }
            // Initialisation de l'application
            initApp(); 
        });

        function initApp() {
            loadProductsFromCSVFile();

            const form = document.getElementById('reservation-form');
            if (form) {
                form.addEventListener('submit', handleSubmitReservation);
            }
             // Assurer que le premier lien est actif au démarrage
            document.querySelector('.main-nav ul li a').classList.add('active');
            showSection('accueil'); // Afficher la section d'accueil par défaut
        }


        // --- NAVIGATION ---
        function showSection(sectionId) {
            // Gestion du carrousel
            if (sectionId !== 'accueil') {
                clearInterval(carouselInterval);
            } else {
                // Ne démarrer le carrousel que s'il y a des slides
                if (totalSlides > 0) {
                     startCarousel();
                }
            }
            if (sectionId === 'panier') {
                renderCart();
            }

            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            const target = document.getElementById(sectionId + '-section');
            if (target) target.classList.add('active');

            // Mettre à jour la navigation principale
            document.querySelectorAll('.main-nav a').forEach(link => {
                link.classList.remove('active');
                if (link.onclick && link.onclick.toString().includes(`showSection('${sectionId}')`)) {
                    link.classList.add('active');
                }
            });

            // Afficher/Masquer la navigation par catégorie
            const catNav = document.getElementById('catalogue-nav');
            if (sectionId === 'catalogue') {
                catNav.style.display = 'flex'; // Utiliser flex pour l'alignement
                if (!document.querySelector('.cat-nav button.active')) {
                    filterProducts('all');
                }
            } else {
                catNav.style.display = 'none';
            }
        }

        // --- NOTIFICATION TOAST ---
        function showToast(message) {
            const toast = document.getElementById("toast-notification");
            toast.textContent = message;
            toast.classList.add("show");
            
            // Masquer le toast après 3 secondes
            setTimeout(() => {
                toast.classList.remove("show");
            }, 3000);
        }

        // --- MODALE PRODUIT ---
        function showProductDetails(productId) {
            const modal = document.getElementById('product-modal');
            // La recherche se fait uniquement dans les produits publiés (allProductsData)
            const product = allProductsData.find(p => p.id == productId); 
            if (product) {
                selectedProductForModal = product;
                document.getElementById('modal-title').textContent = product.name;
                document.getElementById('modal-image').src = product.image_url; 
                document.getElementById('modal-description').textContent = product.description;
                document.getElementById('modal-price').innerHTML = `Prix: <strong>${product.price}</strong>`;
                document.getElementById('modal-quantity').value = 1;
                document.getElementById('modal-quantity').max = product.max_quantity;
                document.getElementById('modal-start-date').value = '';
                document.getElementById('modal-end-date').value = '';

                document.getElementById('modal-max-quantity-info').textContent = `Max disponible : ${product.max_quantity}`;
                modal.style.display = "flex"; // Utiliser flex pour centrer la modale
            }
        }

        function closeModal() {
            document.getElementById('product-modal').style.display = "none";
            selectedProductForModal = null;
        }

        // Fermer la modale en cliquant en dehors
        window.onclick = function(event) {
            const modal = document.getElementById('product-modal');
            if (event.target == modal) {
                modal.style.display = "none";
                selectedProductForModal = null;
            }
        };

        // --- LOGIQUE PANIER ---

        function extractPriceDetails(priceString) {
            const priceMatch = priceString.match(/([\d\.,]+)/);
            const unitMatch = priceString.toLowerCase().includes('jour') ? 'per_day' : 
                              priceString.toLowerCase().includes('personne') ? 'per_person' :
                              'flat_rate'; 

            let priceValue = 0;
            if (priceMatch) {
                priceValue = parseFloat(priceMatch[1].replace(',', '.'));
            }
            return { value: priceValue, unit: unitMatch, unitString: priceString.match(/€\s*(\/.+)?/)?.[1]?.trim() || '' };
        }

        function calculateItemPrice(item) {
            const { product, quantity, startDate, endDate } = item;
            const { value, unit } = extractPriceDetails(product.price);
            
            let basePrice = value;
            let multiplier = 1;
            let warning = null;
            let isDaily = unit === 'per_day';

            if (isDaily) {
                if (startDate && endDate) {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    // Calcule la différence en jours et ajoute 1 pour inclure les deux dates
                    const diffTime = Math.abs(end - start);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                    multiplier = diffDays;
                } else {
                    warning = " (Est. 1 jour. Veuillez spécifier les dates pour le calcul réel)";
                    multiplier = 1; 
                }
            } else if (unit === 'per_person') {
                 // Pour 'per_person', la quantité est le nombre de personnes
                 multiplier = 1; 
            } else {
                 // Pour 'flat_rate', le multiplicateur est 1
                 multiplier = 1; 
            }
            
            const totalPrice = basePrice * multiplier * quantity;
            
            return {
                total: totalPrice,
                unit: unit,
                multiplier: multiplier,
                warning: warning,
                isDaily: isDaily
            };
        }

        function addToCartFromModal() {
            if (selectedProductForModal) {
                const qtyInput = document.getElementById('modal-quantity');
                const startDate = document.getElementById('modal-start-date').value;
                const endDate = document.getElementById('modal-end-date').value;
                const quantity = parseInt(qtyInput.value) || 1;

                if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
                    showToast("Erreur: La date de début ne peut pas être postérieure à la date de fin.");
                    return;
                }

                const item = {
                    id: Date.now(), 
                    product: selectedProductForModal,
                    startDate: startDate, 
                    endDate: endDate, 
                    quantity: quantity
                };

                panier.push(item);
                closeModal();
                updateCartCount();
                showToast(`✅ ${item.product.name} (x${quantity}) ajouté à la demande de réservation.`);
            }
        }

        function updateCartCount() {
            document.getElementById('cart-count').textContent = panier.length;
            const validateBtn = document.querySelector('#reservation-form .validate-btn');
            const userEmailInput = document.getElementById('user-email');
            
            const isValid = panier.length > 0 && userEmailInput.value.trim().includes('@');
            validateBtn.disabled = !isValid;
            renderCartSummary(); 
        }

        // Lier l'événement 'input' de l'email à la mise à jour du bouton
        document.addEventListener('input', (event) => {
            if (event.target.id === 'user-email') {
                updateCartCount();
            }
        });

        function handleDeliveryChange() {
            const isChecked = document.getElementById('delivery-checkbox').checked;
            const addressGroup = document.getElementById('delivery-address-group');
            const infoSpan = document.getElementById('delivery-info');
            
            infoSpan.textContent = isChecked ? DELIVERY_INFO_MESSAGE : '';
            addressGroup.style.display = isChecked ? 'block' : 'none';
            renderCartSummary();
        }

        function renderCartSummary() {
            let totalEstimate = 0;
            let totalItems = 0;

            panier.forEach(item => {
                const itemPriceCalc = calculateItemPrice(item);
                totalEstimate += itemPriceCalc.total;
                totalItems += item.quantity;
            });

            document.getElementById('cart-total-price').textContent = `${totalItems} article(s)`;
            
            const totalElement = document.getElementById('cart-total-estimate');
            if (totalEstimate > 0) {
                totalElement.textContent = `${totalEstimate.toFixed(2)} € (Est. TTC)`;
                totalElement.style.color = 'var(--primary-color)';
            } else {
                totalElement.textContent = "0.00 €";
                totalElement.style.color = 'var(--text-dark)';
            }
        }


        function renderCart() {
            const container = document.getElementById('cart-items-container');
            container.innerHTML = '';
            
            if (panier.length === 0) {
                container.innerHTML = '<p class="empty-cart-message">Votre panier de réservation est vide.</p>';
                renderCartSummary();
                updateCartCount();
                return;
            }

            panier.forEach(item => {
                const itemPriceCalc = calculateItemPrice(item);
                
                const itemTotalPrice = itemPriceCalc.total.toFixed(2);
                const itemWarning = itemPriceCalc.warning ? `<br><small style="color: #A44C3A; font-weight: 600;">${itemPriceCalc.warning}</small>` : '';
                
                const datesDisplay = (item.startDate && item.endDate) ? 
                    `Du: <strong>${item.startDate}</strong> au: <strong>${item.endDate}</strong> (${itemPriceCalc.multiplier}j)` : 
                    `Période: Non spécifiée`;

                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';

                itemElement.innerHTML = `
                    <img src="${item.product.image_url}" alt="${item.product.name}">
                    <div class="item-details">
                        <h4>${item.product.name}</h4>
                        <p>${datesDisplay}</p>
                        <p>Prix unitaire: ${item.product.price}</p>
                        <p><strong>Est. Coût : ${itemTotalPrice} €</strong> ${itemWarning}</p>
                    </div>
                    <div class="item-controls">
                        <label>Qté: 
                            <input type="number" value="${item.quantity}" min="1" max="${item.product.max_quantity}" 
                                onchange="updateCartQuantity(${item.id}, this.value)">
                        </label>
                        <button class="remove-btn" onclick="removeFromCart(${item.id})">Supprimer</button>
                    </div>
                `;
                container.appendChild(itemElement);
            });

            renderCartSummary();
            updateCartCount();
        }

        function updateCartQuantity(itemId, newQuantity) {
            const item = panier.find(i => i.id === itemId);
            if (item) {
                const qty = parseInt(newQuantity);
                const max = parseInt(item.product.max_quantity);
                
                if (qty > max) {
                    showToast(`⚠️ Max disponible : ${max} unités pour ${item.product.name}.`);
                    item.quantity = max;
                } else if (qty < 1 || isNaN(qty)) {
                    item.quantity = 1;
                } else {
                    item.quantity = qty;
                }
                
                renderCart();
            }
        }

        function removeFromCart(itemId) {
            panier = panier.filter(item => item.id !== itemId);
            renderCart();
            updateCartCount();
        }

        function handleSubmitReservation(event) {
            event.preventDefault(); 

            const form = event.target;
            const userEmailInput = document.getElementById('user-email');
            
            if (panier.length === 0) {
                showToast("Votre panier est vide. Veuillez ajouter des articles avant de valider.");
                return;
            }

            const userEmail = userEmailInput.value.trim();
            if (!userEmail || !userEmail.includes('@')) {
                showToast("Veuillez entrer une adresse email valide pour la réservation.");
                userEmailInput.focus();
                return;
            }

            // 1. Mise à jour de la destination du formulaire
            form.action = `https://formsubmit.co/${BUSINESS_EMAIL}`;

            // 2. Génération du corps de l'e-mail détaillé
            const isDelivery = document.getElementById('delivery-checkbox').checked;
            const deliveryAddress = isDelivery ? document.getElementById('delivery-address').value.trim() : 'Non demandée (Retrait sur place)';
            const reservationMessage = document.getElementById('reservation-message').value.trim() || 'Aucun message supplémentaire.';

            let priceDetails = '';
            let totalEstimate = 0;
            let totalItems = 0;

            panier.forEach(item => {
                const itemPriceCalc = calculateItemPrice(item);
                totalEstimate += itemPriceCalc.total;
                totalItems += item.quantity;
                
                const dates = (item.startDate && item.endDate) ? 
                    `Du ${item.startDate} au ${item.endDate} (${itemPriceCalc.multiplier} jour(s))` : 
                    `Non spécifiée.`;
                
                const calculatedPriceLine = itemPriceCalc.isDaily ? 
                    `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR (Basé sur ${itemPriceCalc.multiplier}j)` : 
                    `Est. Coût Article : ${itemPriceCalc.total.toFixed(2)} EUR`;

                // FORMATAGE SIMPLE TEXTE
                priceDetails += `
-------------------------------------------------------
ARTICLE ${item.product.id} : ${item.product.name}
-------------------------------------------------------
Nom de l'article : ${item.product.name}
Quantité : x${item.quantity}
Prix unitaire : ${item.product.price}
Période souhaitée : ${dates}
Estimation Coût : ${calculatedPriceLine}
`;
            });

            const emailBody = `Bonjour,

Nous vous remercions pour votre demande de réservation. Voici le récapitulatif des articles demandés.

=======================================================
RECAPITULATIF DE LA DEMANDE
=======================================================
${priceDetails.trim()}

=======================================================
INFORMATIONS COMPLEMENTAIRES
=======================================================
Email du client : ${userEmail}
Demande de livraison : ${isDelivery ? 'OUI' : 'NON'}
Adresse de livraison (si demandée) : ${deliveryAddress}
Message du client : ${reservationMessage}

=======================================================
ESTIMATION GLOBALE (HORS LIVRAISON)
=======================================================
Nombre total d'articles : ${totalItems}
Estimation du Total TTC des articles : ${totalEstimate.toFixed(2)} EUR
(Ce montant est une estimation et sera confirmé par devis après vérification des disponibilités et ajout des frais de livraison éventuels.)

=======================================================
CONTACT RAPIDE
=======================================================
Si vous souhaitez apporter des modifications à cette demande ou obtenir des précisions rapides,
vous pouvez nous envoyer un e-mail directement à : ${BUSINESS_EMAIL}

Nous vous recontacterons sous 24h ouvrées pour finaliser la réservation.
Cordialement,
L'équipe Ma boîte à loc' Angevine
`;
            
            // 3. Injection du corps de l'e-mail dans le champ caché
            document.getElementById('email-body-content').value = emailBody.trim();

            // 4. Champs cachés pour le service de formulaire (FormSubmit)
            document.getElementById('hidden-subject').value = `Demande de Réservation Matériel (${totalItems} articles) - Est. ${totalEstimate.toFixed(2)} EUR`;
            document.getElementById('hidden-replyto').value = userEmail;
            document.getElementById('hidden-cc').value = userEmail;


            // 5. Soumission effective du formulaire
            form.submit();

            // 6. Affichage de la notification toast 
            showToast("📧 Votre demande de réservation est en cours d'envoi !");

            // 7. Réinitialisation
            panier = [];
            document.getElementById('reservation-message').value = '';
            document.getElementById('delivery-checkbox').checked = false;
            handleDeliveryChange(); 
            renderCart();
        }


        // --- LOGIQUE CAROUSEL ---

        function initCarousel() {
            const track = document.getElementById('carousel-track');
            const indicators = document.getElementById('carousel-indicators');
            const container = document.getElementById('carousel-container');
            
            // Si le conteneur n'existe pas ou si la liste d'images est vide, on s'arrête
            if (!container || carouselImagesData.length === 0) {
                 if (container) {
                     // Message d'erreur/information si aucune image n'est trouvée pour le carrousel
                     container.innerHTML = '<p style="text-align: center; color: var(--primary-color); padding: 50px;">Aucune image sélectionnée pour le carrousel. Vérifiez la colonne "carrousel" dans data.csv.</p>';
                 }
                totalSlides = 0;
                return;
            }
            
            track.innerHTML = '';
            indicators.innerHTML = '';
            
            carouselImagesData.forEach((imgSrc, index) => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.innerHTML = `<img src="${imgSrc}" alt="Slide Carrousel ${index + 1}">`;
                track.appendChild(slide);
                
                const indicator = document.createElement('span');
                indicator.onclick = () => showSlide(index);
                indicators.appendChild(indicator);
            });
            
            totalSlides = carouselImagesData.length;
            if (totalSlides > 0) {
                showSlide(0);
                // Démarrer seulement si l'accueil est la section active
                if (document.getElementById('accueil-section').classList.contains('active')) {
                    startCarousel();
                }
            } 
        }

        function showSlide(index) {
            slideIndex = index;
            if (slideIndex >= totalSlides) { slideIndex = 0; }
            if (slideIndex < 0) { slideIndex = totalSlides - 1; }
            
            const track = document.getElementById('carousel-track');
            const indicators = document.querySelectorAll('#carousel-indicators span');
            
            if (track) {
                track.style.transform = `translateX(-${slideIndex * 100}%)`;
            }

            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === slideIndex);
            });
        }

        function moveCarousel(n) {
            showSlide(slideIndex + n);
        }

        function startCarousel() {
            clearInterval(carouselInterval);
            carouselInterval = setInterval(() => {
                moveCarousel(1);
            }, 4000); 
        }

        // --- LOGIQUE CATALOGUE ET CHARGEMENT CSV ---

        async function loadProductsFromCSVFile() {
            const csvFilePath = 'data.csv'; 
            
            try {
                const response = await fetch(csvFilePath);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }
                const compiledText = await response.text();

                // DÉBUT DU PARSING CSV
                const lines = compiledText.trim().split('\n');
                if (lines.length === 0) {
                     throw new Error("Le fichier CSV est vide.");
                }
                
                // Extraction des entêtes (sans espaces et en minuscules pour la robustesse)
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const products = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    if (!line.trim()) continue;

                    let values = [];
                    let current = '';
                    let inQuote = false;

                    for (let j = 0; j < line.length; j++) {
                        const char = line[j];

                        if (char === '"') {
                            inQuote = !inQuote;
                            continue;
                        }
                        if (char === ',' && !inQuote) {
                            values.push(current.trim().replace(/^"|"$/g, ''));
                            current = '';
                        } else {
                            current += char;
                        }
                    }
                    values.push(current.trim().replace(/^"|"$/g, '')); // Dernière valeur

                    if (values.length === headers.length) {
                        const product = {};
                        headers.forEach((header, index) => {
                            product[header] = values[index];
                        });
                        products.push(product);
                    } else {
                         // Le warning est important si le format du CSV est incorrect
                         console.warn(`Ligne ignorée (format incorrect, ${values.length} col. vs ${headers.length} attendues): ${line}`);
                    }
                }
                // FIN DU PARSING CSV

                
                // 🛠 NOUVELLE LOGIQUE DE FILTRAGE
                // 1. Filtrer les produits : seuls ceux avec "publication: Oui" sont affichés
                const publishedProducts = products.filter(p => 
                    p.publication && p.publication.toLowerCase().trim() === 'oui'
                );

                allProductsData = publishedProducts;
                
                // 2. Filtrer les images pour le carrousel (colonne 'carrousel' ou 'is_carousel')
                carouselImagesData = allProductsData
                    // La colonne carrousel doit exister dans le CSV et contenir "oui"
                    .filter(p => p.carrousel && p.carrousel.toLowerCase().trim() === 'oui') 
                    .map(p => p.image_url);

                renderCategoryButtons();
                renderProductList(allProductsData);
                
                // FIX: Vérifier l'existence de l'élément avant de le manipuler
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                    loadingMessage.style.display = 'none';
                }

                initCarousel(); 

            } catch (error) {
                console.error("Impossible de charger le catalogue :", error);
                const loadingMessage = document.getElementById('loading-message');
                if (loadingMessage) {
                     loadingMessage.textContent = "Erreur: Impossible de charger le catalogue. Vérifiez data.csv et la console.";
                     loadingMessage.style.color = '#A44C3A'; 
                }
            }
        }


        function renderCategoryButtons() {
            const nav = document.getElementById('catalogue-nav');
            nav.innerHTML = '';
            
            // Bouton "Tous"
            let buttonAll = document.createElement('button');
            buttonAll.textContent = CATEGORIES['all'];
            buttonAll.onclick = () => filterProducts('all');
            buttonAll.classList.add('active'); 
            nav.appendChild(buttonAll);
            
            // Autres catégories
            // On utilise uniquement les produits PUBLIÉS
            const uniqueCategories = [...new Set(allProductsData.map(p => p.category))];
            
            uniqueCategories.forEach(cat => {
                let button = document.createElement('button');
                button.textContent = CATEGORIES[cat] || cat;
                button.onclick = () => filterProducts(cat);
                nav.appendChild(button);
            });
        }
        
        function filterProducts(category) {
            document.querySelectorAll('#catalogue-nav button').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(category.toLowerCase().replace('all', 'tous'))) {
                    btn.classList.add('active');
                }
            });

            const filteredProducts = category === 'all' 
                ? allProductsData 
                // allProductsData contient déjà les produits publiés
                : allProductsData.filter(p => p.category === category);
                
            document.getElementById('product-search').value = ''; 
            renderProductList(filteredProducts);
        }

        function searchProducts() {
            const searchTerm = document.getElementById('product-search').value.toLowerCase();
            const filteredProducts = allProductsData.filter(product => {
                const name = product.name.toLowerCase();
                const description = product.description.toLowerCase();
                const category = product.category.toLowerCase();
                return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
            });
            
            document.querySelectorAll('#catalogue-nav button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            renderProductList(filteredProducts);
        }

        function renderProductList(products) {
            const listContainer = document.getElementById('product-list-container');
            listContainer.innerHTML = ''; 

            if (products.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #777;">Aucun produit trouvé correspondant à votre recherche.</p>';
                return;
            }

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <div class="product-card-body">
                        <h4>${product.name}</h4>
                        <p>${product.description}</p>
                        <p class="product-price"><strong>${product.price}</strong></p>
                        <button onclick="showProductDetails('${product.id}')">Détails / Réserver</button>
                    </div>
                `;
                listContainer.appendChild(card);
            });
        }

        // Chargement initial au démarrage
        window.onload = initApp;