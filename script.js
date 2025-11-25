// --- VARIABLES GLOBALES ---
        let allProductsData = [];
        // MISE À JOUR 1 : Initialisation du tableau avec des chemins vers images/carrousel
        let carouselImages = [
            'images/carrousel/location-tente.jpg',
            'images/carrousel/location-sono.jpg',
            'images/carrousel/location-echafaudage.jpg',
            'images/carrousel/materiel-evenementiel.jpg'
            // ⚠️ IMPORTANT : Remplacez ces noms par ceux de vos images réelles dans images/carrousel/
        ];
        let slideIndex = 0;
        let totalSlides = 0;
        let carouselInterval;
        let selectedProductForModal = null; // Stocke l'objet produit pour l'ajout au panier
        // Le tableau qui stocke les articles du panier
        let panier = [];
        // Message informatif de livraison
        const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis)";
        const CATEGORIES = {
            'all': 'Tous les produits',
            'evenementiel': 'Événementiel',
            'outillage': 'Outillage'
        };

        // --- MODE SOMBRE ---
        document.addEventListener("DOMContentLoaded", () => {
            const toggle = document.getElementById("dark-mode-toggle");
            if (toggle) {
                toggle.addEventListener("click", () => {
                    document.body.classList.toggle("dark-mode");
                });
            }
            // MISE À JOUR 3 : Initialisation du carrousel au chargement de la page
            initCarousel();
        });

        // --- NAVIGATION ---
        function showSection(sectionId) {
            if (sectionId !== 'accueil') {
                clearInterval(carouselInterval);
            } else {
                startCarousel();
            }
            if (sectionId === 'panier') {
                renderCart();
            }

            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            const target = document.getElementById(sectionId + '-section');
            if (target) target.classList.add('active');

            document.querySelectorAll('.main-nav a').forEach(link => {
                link.classList.remove('active');
                if (link.onclick && link.onclick.toString().includes(`showSection('${sectionId}')`)) {
                    link.classList.add('active');
                }
            });

            const catNav = document.getElementById('catalogue-nav');
            if (sectionId === 'catalogue') {
                catNav.style.display = 'block';
                if (!document.querySelector('.cat-nav button.active')) {
                    filterProducts('all');
                }
            } else {
                catNav.style.display = 'none';
            }
        }

        // --- MODALE PRODUIT ---
        // MODIFICATION : Accepte l'ID du produit
        function showProductDetails(productId) {
            const modal = document.getElementById('product-modal');
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
                modal.style.display = "block";
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
        function getPriceValue(priceString) {
            // Extrait le premier nombre valide (avec décimales . ou ,) de la chaîne de prix
            const match = priceString.match(/([\d\.,]+)/);
            if (match) {
                // Remplace la virgule par un point pour le parseFloat si elle est utilisée comme séparateur décimal
                return parseFloat(match[1].replace(',', '.'));
            }
            return 0;
        }

        // MODIFICATION : Les dates sont désormais optionnelles
        function addToCartFromModal() {
            if (selectedProductForModal) {
                const qtyInput = document.getElementById('modal-quantity');
                const startDate = document.getElementById('modal-start-date').value;
                const endDate = document.getElementById('modal-end-date').value;
                const quantity = parseInt(qtyInput.value) || 1;

                // Validation UNIQUEMENT si les deux dates sont renseignées, on vérifie l'ordre.
                if (startDate && endDate && (new Date(startDate) > new Date(endDate))) {
                    alert("La date de début ne peut pas être postérieure à la date de fin.");
                    return;
                }

                const item = {
                    id: Date.now(), // ID unique pour cet item du panier
                    product: selectedProductForModal,
                    startDate: startDate, // Date de début (peut être vide)
                    endDate: endDate, // Date de fin (peut être vide)
                    quantity: quantity
                };

                panier.push(item);
                closeModal();
                updateCartCount();
                alert(`${item.product.name} (x${quantity}) ajouté à la demande de réservation.`);
            }
        }

        function updateCartCount() {
            document.getElementById('cart-count').textContent = panier.length;
            const validateBtn = document.querySelector('#panier-section .validate-btn');
            const userEmailInput = document.getElementById('user-email');
            
            // Le bouton est activé si le panier n'est pas vide ET si un email est saisi
            const isValid = panier.length > 0 && userEmailInput.value.trim() !== '';
            validateBtn.disabled = !isValid;
        }

        // Ajout de la fonction pour mettre à jour l'état du bouton si l'email change
        document.getElementById('user-email').addEventListener('input', updateCartCount);

        function handleDeliveryChange() {
            const isChecked = document.getElementById('delivery-checkbox').checked;
            const addressGroup = document.getElementById('delivery-address-group');
            const infoSpan = document.getElementById('delivery-info');
            
            if (isChecked) {
                addressGroup.style.display = 'block';
                infoSpan.textContent = DELIVERY_INFO_MESSAGE;
            } else {
                addressGroup.style.display = 'none';
                infoSpan.textContent = DELIVERY_INFO_MESSAGE;
            }
            renderCartSummary();
        }

        function renderCartSummary() {
            // Recalcul du total (qui n'est pas vraiment un total en € mais un décompte d'items)
            document.getElementById('cart-total-price').textContent = `${panier.length} article(s)`;
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
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                
                const product = item.product;
                
                // Formatage des dates pour l'affichage (vide si non sélectionné)
                const startDate = item.startDate ? `Du: <strong>${item.startDate}</strong>` : 'Date de début: Non spécifiée';
                const endDate = item.endDate ? `Au: <strong>${item.endDate}</strong>` : 'Date de fin: Non spécifiée';

                itemElement.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}">
                    <div class="item-details">
                        <h4>${product.name}</h4>
                        <p>Prix: ${product.price}</p>
                        <p>${startDate}</p>
                        <p>${endDate}</p>
                    </div>
                    <div class="item-controls">
                        <label>Qté: 
                            <input type="number" value="${item.quantity}" min="1" max="${product.max_quantity}" 
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
                    alert(`Attention : Seules ${max} unités sont disponibles pour ${item.product.name}.`);
                    item.quantity = max;
                } else if (qty < 1 || isNaN(qty)) {
                    item.quantity = 1;
                } else {
                    item.quantity = qty;
                }
                
                // Re-render pour s'assurer que l'affichage est à jour (et corrige la valeur si max dépassée)
                renderCart();
            }
        }

        function removeFromCart(itemId) {
            panier = panier.filter(item => item.id !== itemId);
            renderCart();
            updateCartCount();
        }

        function validateCart() {
            if (panier.length === 0) {
                alert("Votre panier est vide. Veuillez ajouter des articles avant de valider.");
                return;
            }

            const userEmail = document.getElementById('user-email').value.trim();
            if (!userEmail || !userEmail.includes('@')) {
                alert("Veuillez entrer une adresse email valide pour la réservation.");
                document.getElementById('user-email').focus();
                return;
            }

            const isDelivery = document.getElementById('delivery-checkbox').checked;
            const deliveryAddress = isDelivery ? document.getElementById('delivery-address').value.trim() : 'Non demandée';
            const reservationMessage = document.getElementById('reservation-message').value.trim() || 'Aucun message supplémentaire.';

            let emailBody = `Bonjour,

Je souhaite effectuer une demande de réservation pour le matériel suivant :

--- ARTICLES DEMANDÉS ---\n`;

            panier.forEach(item => {
                const dates = (item.startDate && item.endDate) ? 
                    ` (Période souhaitée : du ${item.startDate} au ${item.endDate})` : 
                    ` (Période souhaitée : Non spécifiée)`;
                
                emailBody += `
- ${item.product.name} (x${item.quantity})
  Tarif unitaire : ${item.product.price}${dates}\n`;
            });

            emailBody += `\n--- INFORMATIONS SUPPLÉMENTAIRES ---\n
Demande de livraison : ${isDelivery ? 'OUI' : 'NON'}
Adresse de livraison (si demandée) : ${deliveryAddress}
Message : ${reservationMessage}
Sous-total articles : ${panier.length} article(s)

Merci de bien vouloir me recontacter pour confirmer la disponibilité, le tarif total, et finaliser la réservation.

Cordialement,
`;

            const mailtoLink = `mailto:maboitealocangevine@gmail.com?subject=Demande de Réservation Matériel (${panier.length} articles)&body=${encodeURIComponent(emailBody)}`;
            
            // Ouvre le client mail de l'utilisateur
            window.location.href = mailtoLink;
            
            // Réinitialise le panier après l'envoi de l'email (même si l'utilisateur doit confirmer l'envoi)
            panier = [];
            document.getElementById('user-email').value = '';
            document.getElementById('reservation-message').value = '';
            document.getElementById('delivery-checkbox').checked = false;
            handleDeliveryChange(); // Cache le champ d'adresse
            renderCart();
            alert("Votre demande de réservation a été préparée dans votre client de messagerie. N'oubliez pas de l'envoyer !");
        }


        // --- LOGIQUE CAROUSEL ---
        function initCarousel() {
            const track = document.getElementById('carousel-track');
            const indicators = document.getElementById('carousel-indicators');
            
            track.innerHTML = '';
            indicators.innerHTML = '';
            
            carouselImages.forEach((imgSrc, index) => {
                // Créer la slide
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.innerHTML = `<img src="${imgSrc}" alt="Slide Carrousel ${index + 1}">`;
                track.appendChild(slide);
                
                // Créer l'indicateur
                const indicator = document.createElement('span');
                indicator.onclick = () => showSlide(index);
                indicators.appendChild(indicator);
            });
            
            totalSlides = carouselImages.length;
            showSlide(0);
            startCarousel();
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
            }, 4000); // Change l'image toutes les 4 secondes
        }

        // --- LOGIQUE CATALOGUE ---
        // Fonction pour charger et traiter le contenu du fichier data.csv (qui est dans le txt compilé)
        function loadProductsFromText() {
            const compiledText = `id,category,name,description,price,image_url,max_quantity
101,evenementiel,Table de Réception Pliante,"Table de réception en plastique pliante. Peut accueillir jusqu'à 8 personnes. Dimensions : 180x75cm.",10 € / jour,images/table.jpg,10
102,evenementiel,Tente de Réception 3x6m,"Tente professionnelle blanche idéale pour les événements extérieurs. Facile à monter.",50 € / jour,images/tente.jpg,3
103,evenementiel,Groupe Électrogène 3000W,"Groupe électrogène puissant pour alimenter lumières et musique lors de vos événements en extérieur.",35 € / jour,images/groupe.jpg,5
104,evenementiel,Guirlande Lumineuse Guinguette (70m),"70 mètres d'éclairage blanc chaud. Parfait pour créer une ambiance festive et chaleureuse.",45 € / jour,images/guirlande.jpg,8
105,evenementiel,Canon à Confettis Professionnel,"Canon à confettis à air comprimé pour un effet spectaculaire (confettis non inclus).",20 € / jour,images/canon.jpg,2
106,evenementiel,Kit Vaisselle (Assiettes, Verres, Couverts),"Set complet de vaisselle de qualité (par 12). Comprend assiettes, verres à pied et couverts.",1.50 € / personne,images/vaisselle.jpg,100
107,evenementiel,Vidéo-projecteur 4K et Écran,"Idéal pour diffuser photos, vidéos ou présentations. Écran de 100 pouces inclus.",30 € / jour,images/videoprojecteur.jpg,4
108,outillage,Bétonnière Électrique 160L,"Bétonnière de grande capacité (160 litres) pour travaux de maçonnerie. Moteur 650W.",25 € / jour,images/betonniere.jpg,5
109,outillage,Échafaudage Roulant (4m),"Échafaudage sécurisé et mobile, hauteur de travail jusqu'à 4 mètres.",35 € / jour,images/echafaudage.jpg,2
110,outillage,Ponceuse Excentrique Professionnelle,"Ponceuse puissante avec aspiration pour travaux de finition sur bois ou plâtre.",15 € / jour,images/ponceuse.jpg,10
111,outillage,Scie Sauteuse sans Fil 18V,"Scie légère et maniable, vendue avec batteries et lames de rechange.",12 € / jour,images/sciesauteuse.jpg,10
112,outillage,Perceuse-Visseuse à Percussion,"Outil multifonction pour percer et visser dans tous types de matériaux (béton, bois, acier).",18 € / jour,images/perceuse.jpg,10
113,evenementiel,Machine à Popcorn Professionnelle,"Faites le délice de vos invités avec cette machine à popcorn facile d'utilisation.",25 € / jour,images/popcorn.jpg,3
114,evenementiel,Chaises Pliantes de Jardin,"Chaises blanches robustes et confortables. Idéales pour l'extérieur.",1 € / jour,images/chaise.jpg,150`;

            const lines = compiledText.trim().split('\n');
            const headers = lines[0].split(',');
            const products = [];

            // Simple CSV parsing, handles quoted fields only for description.
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
                        // Ne pas ajouter le guillemet à la valeur
                        continue;
                    }
                    if (char === ',' && !inQuote) {
                        values.push(current.trim().replace(/^"|"$/g, '')); // Nettoyage supplémentaire
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim().replace(/^"|"$/g, '')); // Dernière valeur

                if (values.length === headers.length) {
                    const product = {};
                    headers.forEach((header, index) => {
                        product[header.trim()] = values[index];
                    });
                    products.push(product);
                }
            }

            allProductsData = products;
            renderCategoryButtons();
            renderProductList(allProductsData);
            document.getElementById('loading-message').style.display = 'none';
        }

        // Fonction pour générer les boutons de catégorie
        function renderCategoryButtons() {
            const nav = document.getElementById('catalogue-nav');
            nav.innerHTML = '';
            
            // Bouton "Tous"
            let buttonAll = document.createElement('button');
            buttonAll.textContent = CATEGORIES['all'];
            buttonAll.onclick = () => filterProducts('all');
            buttonAll.classList.add('active'); // Actif par défaut
            nav.appendChild(buttonAll);
            
            // Autres catégories
            const uniqueCategories = [...new Set(allProductsData.map(p => p.category))];
            
            uniqueCategories.forEach(cat => {
                let button = document.createElement('button');
                button.textContent = CATEGORIES[cat] || cat;
                button.onclick = () => filterProducts(cat);
                nav.appendChild(button);
            });
        }
        
        // Fonction pour filtrer et afficher les produits
        function filterProducts(category) {
            document.querySelectorAll('#catalogue-nav button').forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(category.toLowerCase().replace('all', 'tous'))) {
                    btn.classList.add('active');
                }
            });

            const filteredProducts = category === 'all' 
                ? allProductsData 
                : allProductsData.filter(p => p.category === category);
                
            document.getElementById('product-search').value = ''; // Réinitialiser la recherche
            renderProductList(filteredProducts);
        }

        // Fonction pour chercher les produits (sur le dataset complet)
        function searchProducts() {
            const searchTerm = document.getElementById('product-search').value.toLowerCase();
            const filteredProducts = allProductsData.filter(product => {
                const name = product.name.toLowerCase();
                const description = product.description.toLowerCase();
                const category = product.category.toLowerCase();
                return name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm);
            });
            
            // Désactiver le bouton de catégorie actif si la recherche est utilisée
            document.querySelectorAll('#catalogue-nav button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            renderProductList(filteredProducts);
        }

        // Fonction pour générer la liste HTML des produits
        function renderProductList(products) {
            const listContainer = document.getElementById('product-list-container');
            listContainer.innerHTML = ''; // Nettoyer la liste existante

            if (products.length === 0) {
                listContainer.innerHTML = '<p style="text-align: center; color: #777;">Aucun produit trouvé correspondant à votre recherche.</p>';
                return;
            }

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                // MODIFICATION: Ajout de la classe "product-price" pour le style
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

        // Charger les produits au démarrage
        window.onload = loadProductsFromText;