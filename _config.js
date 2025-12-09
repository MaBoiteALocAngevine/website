// --- _config.js ---
// Variables globales et configuration

// Panier (chargé depuis le localStorage si existant)
const initialCart = JSON.parse(localStorage.getItem('panier') || '[]');
let panier = initialCart;

// Données des produits chargées depuis le CSV
let allProductsData = []; 

// État temporaire pour la modale
let selectedProductForModal = null; 

// Variables pour le carrousel
let currentSlide = 0;
let totalSlides = 0;
let carouselInterval; 

const CAROUSEL_INTERVAL_MS = 5000; // Intervalle de 5 secondes