// --- CONFIGURATION ET CONSTANTES GLOBALES ---

// Email utilisé pour le formulaire de contact [cite: 1198]
const BUSINESS_EMAIL = "maboitealocangevine@gmail.com"; 
// Message affiché en cas de demande de livraison [cite: 1198]
const DELIVERY_INFO_MESSAGE = "Coût à déterminer (sur devis)";

// Catégories du catalogue [cite: 1199]
const CATEGORIES = {
    'all': 'Tous les produits',
    'evenementiel': 'Événementiel',
    'outillage': 'Outillage'
};

// --- VARIABLES GLOBALES (Initialisées ici, modifiées dans les autres modules) ---
let allProductsData = []; // Stocke tous les produits CSV
let carouselImagesData = []; // Stocke les URLs pour le carrousel
let slideIndex = 0;
let totalSlides = 0;
let carouselInterval;
let selectedProductForModal = null;
// Charger le panier depuis le stockage local [cite: 1198]
let panier = JSON.parse(localStorage.getItem('panier')) || [];