import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, onChildRemoved, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTLsji9XOlgHK-YUPrQYSfLPB5NoerVWY",
  authDomain: "dog-walk-reg.firebaseapp.com",
  databaseURL: "https://dog-walk-reg-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dog-walk-reg",
  storageBucket: "dog-walk-reg.appspot.com",
  messagingSenderId: "806193788108",
  appId: "1:806193788108:web:ac6df92dd5800bd74a3e69",
  measurementId: "G-9Y7PYSP8NP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const statusListRef = query(ref(database, 'narberthDogWalkStatuses'), orderByChild('timestamp'));

// Global variables
let map, selectionMap, geocoder, selectionMarker, autocomplete;
let markers = [];
let currentFilter = 'all';
const NARBERTH_CENTER = { lat: 51.7978, lng: -4.7427 };
const DEFAULT_ZOOM = 15;

// DOM elements
const statusListEl = document.getElementById('statusList');
const emptyStateEl = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const mapContainer = document.getElementById('mapContainer');
const mapSelectionContainer = document.getElementById('mapSelectionContainer');
const selectOnMapBtn = document.getElementById('selectOnMapBtn');
const locationInput = document.getElementById('location');
const walkForm = document.getElementById('walkForm');

// Event Listeners Initialization
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkGeolocation();
  loadMapLibrary();
  loadInitialData();
  initializeDarkMode();
});

function initEventListeners() {
  walkForm.addEventListener('submit', handleFormSubmit);
  document.getElementById('toggleModeCheckbox').addEventListener('change', toggleDarkMode);
  filterButtons.forEach(btn => btn.addEventListener('click', handleFilterButtonClick));
  selectOnMapBtn.addEventListener('click', showMapSelection);
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

function initializeDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('toggleModeCheckbox').checked = true;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  // Handle form submission logic here
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function handleFilterButtonClick(event) {
  filterButtons.forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');
  currentFilter = event.currentTarget.dataset.filter;
  filterStatuses();
}

function handleHashChange() {
  const hash = window.location.hash;
  const sideMenuLinks = document.querySelectorAll('#sideMenu a');
  
  sideMenuLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === hash) {
      link.classList.add('active');
    }
  });

  if (hash === '#map-view') {
    showMapView();
  } else if (hash === '#submit-status') {
    document.getElementById('walkForm').scrollIntoView({ behavior: 'smooth' });
  } else if (hash === '#view-status') {
    document.querySelector('h2').scrollIntoView({ behavior: 'smooth' });
  }
}

function showMapView() {
  mapContainer.style.display = 'block';
  statusListEl.style.display = 'none';
  if (typeof google !== 'undefined' && !map) {
    initMainMap();
  }
}

function showListView() {
  mapContainer.style.display = 'none';
  statusListEl.style.display = 'grid';
}

function loadMapLibrary() {
  if (typeof google === 'undefined') {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${firebaseConfig.apiKey}&libraries=places&callback=initMaps`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}

function initMaps() {
  initMainMap();
  initSelectionMap();
  initAutocomplete();
}

function initMainMap() {
  if (typeof google === 'undefined') return;

  navigator.geolocation.getCurrentPosition(
    position => centerMap(position.coords.latitude, position.coords.longitude),
    () => centerMap(NARBERTH_CENTER.lat, NARBERTH_CENTER.lng),
    { timeout: 10000, enableHighAccuracy: true }
  );
}

function centerMap(lat, lng) {
  const userLocation = { lat, lng };
  const distance = getDistanceFromNarberth(userLocation);
  const center = distance < 20 ? userLocation : NARBERTH_CENTER;
  
  map = new google.maps.Map(mapContainer, {
    center,
    zoom: DEFAULT_ZOOM,
    styles: getMapStyle()
  });

  geocoder = new google.maps.Geocoder();
  addExistingMarkers();
}

function getDistanceFromNarberth(location) {
  const R = 6371; // Earth's radius in km
  const dLat = (location.lat - NARBERTH_CENTER.lat) * Math.PI / 180;
  const dLon = (location.lng - NARBERTH_CENTER.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(NARBERTH_CENTER.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function initSelectionMap() {
  if (typeof google === 'undefined') return;

  selectionMap = new google.maps.Map(mapSelectionContainer, {
    center: NARBERTH_CENTER,
    zoom: DEFAULT_ZOOM,
    styles: getMapStyle()
  });

  selectionMap.addListener('click', e => {
    placeSelectionMarker(e.latLng);
    reverseGeocode(e.latLng);
  });
}

function initAutocomplete() {
  if (typeof google === 'undefined') return;

  const defaultBounds = {
    north: NARBERTH_CENTER.lat + 0.05,
    south: NARBERTH_CENTER.lat - 0.05,
    east: NARBERTH_CENTER.lng + 0.05,
    west: NARBERTH_CENTER.lng - 0.05
  };

  autocomplete = new google.maps.places.Autocomplete(locationInput, {
    bounds: defaultBounds,
    strictBounds: true
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;

    const location = place.geometry.location;
    map.setCenter(location);
    map.setZoom(DEFAULT_ZOOM);
    addMarker(location, place.name);
  });
}

function placeSelectionMarker(location) {
  if (selectionMarker) {
    selectionMarker.setPosition(location);
  } else {
    selectionMarker = new google.maps.Marker({
      position: location,
      map: selectionMap
    });
  }
}

function reverseGeocode(location) {
  geocoder.geocode({ location }, (results, status) => {
    if (status === 'OK' && results[0]) {
      locationInput.value = results[0].formatted_address;
    }
  });
}

function addExistingMarkers() {
  // Fetch existing markers from Firebase and add to the map
}

function addMarker(location, title) {
  const marker = new google.maps.Marker({
    position: location,
    map,
    title
  });
  markers.push(marker);
}

function checkGeolocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => centerMap(position.coords.latitude, position.coords.longitude),
      () => centerMap(NARBERTH_CENTER.lat, NARBERTH_CENTER.lng),
      { timeout: 10000, enableHighAccuracy: true }
    );
  } else {
    centerMap(NARBERTH_CENTER.lat, NARBERTH_CENTER.lng);
  }
}

function loadInitialData() {
  // Data will be loaded via the onChildAdded listener
}

function filterStatuses() {
  // Filter statuses based on currentFilter
}

function toggleMenu() {
  document.getElementById('sideMenu').classList.toggle('open');
  document.getElementById('hamburgerMenu').classList.toggle('open');
}
