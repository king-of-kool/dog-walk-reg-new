import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, query, orderByChild } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

// Initialize variables
let map;
let selectionMap;
let markers = [];
let currentFilter = 'all';
let geocoder;
let selectionMarker;
let autocomplete;
let isThrottled = false;

// DOM elements
const statusListEl = document.getElementById('statusList');
const emptyStateEl = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const mapContainer = document.getElementById('mapContainer');
const mapSelectionContainer = document.getElementById('mapSelectionContainer');
const selectOnMapBtn = document.getElementById('selectOnMapBtn');
const locationInput = document.getElementById('location');
const walkForm = document.getElementById('walkForm');

// Narberth coordinates (latitude, longitude)
const NARBERTH_CENTER = { lat: 51.7978, lng: -4.7427 };
const DEFAULT_ZOOM = 15;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkGeolocation();
  loadMapLibrary();
  loadInitialData();
  
  // Initialize dark mode from localStorage
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('toggleModeCheckbox').checked = true;
  }
});

function initEventListeners() {
  // Form submission
  walkForm.addEventListener('submit', handleFormSubmit);
  
  // Dark mode toggle
  document.getElementById('toggleModeCheckbox').addEventListener('change', toggleDarkMode);
  
  // Filter buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterStatuses();
    });
  });
  
  // Map selection button
  selectOnMapBtn.addEventListener('click', showMapSelection);
  
  // Hash-based navigation
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

function loadInitialData() {
  // Data will be loaded via the onChildAdded listener
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
  
  // Scroll to appropriate section
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
  // Only load if not already loaded
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
  
  // Try to center map on user's location or default to Narberth center
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      // Check if user is within reasonable distance of Narberth
      const distance = getDistanceFromNarberth(userLocation);
      const center = distance < 20 ? userLocation : NARBERTH_CENTER;
      
      map = new google.maps.Map(mapContainer, {
        center: center,
        zoom: DEFAULT_ZOOM,
        styles: getMapStyle()
      });
      
      geocoder = new google.maps.Geocoder();
      addExistingMarkers();
    },
    () => {
      // Default to Narberth center if geolocation fails
      map = new google.maps.Map(mapContainer, {
        center: NARBERTH_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: getMapStyle()
      });
      
      geocoder = new google.maps.Geocoder();
      addExistingMarkers();
    },
    { 
      timeout: 10000,
      enableHighAccuracy: true 
    }
  );
}

function getDistanceFromNarberth(location) {
  // Simple distance calculation (in km) between two coordinates
  const R = 6371; // Earth's radius in km
  const dLat = (location.lat - NARBERTH_CENTER.lat) * Math.PI / 180;
  const dLon = (location.lng - NARBERTH_CENTER.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(NARBERTH_CENTER.lat * Math.PI / 180) * 
    Math.cos(location.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function initSelectionMap() {
  if (typeof google === 'undefined') return;
  
  selectionMap = new google.maps.Map(mapSelectionContainer, {
    center: NARBERTH_CENTER,
    zoom: DEFAULT_ZOOM,
    styles: getMapStyle()
  });
  
  // Add click listener for marker placement
  selectionMap.addListener('click', (e) => {
    placeSelectionMarker(e.latLng);
    reverseGeocode(e.latLng);
  });
}

function initAutocomplete() {
  if (typeof google === 'undefined') return;
  
  // Set bounds to Narberth area
  const defaultBounds = {
    north: NARBERTH_CENTER.lat + 0.05,
    south: NARBERTH_CENTER.lat - 0.05,
    east: NARBERTH_CENTER.lng + 0.05,
    west: NARBERTH_CENTER.lng - 0.05
  };
  
  autocomplete = new google.maps.places.Autocomplete(locationInput, {
    bounds: defaultBounds,
    types: ['establishment', 'geocode'],
    fields: ['formatted_address', 'geometry']
  });
  
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }
    
    if (selectionMap) {
      selectionMap.setCenter(place.geometry.location);
      selectionMap.setZoom(17);
      placeSelectionMarker(place.geometry.location);
    }
  });
}

function placeSelectionMarker(location) {
  if (selectionMarker) {
    selectionMarker.setPosition(location);
  } else {
    selectionMarker = new google.maps.Marker({
      position: location,
      map: selectionMap,
      draggable: true,
      title: "Selected Location in Narberth"
    });
    
    selectionMarker.addListener('dragend', () => {
      reverseGeocode(selectionMarker.getPosition());
    });
  }
}

function reverseGeocode(latLng) {
  if (!geocoder) return;
  
  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === 'OK' && results[0]) {
      // Simplify the address for Narberth locations
      const address = results[0].formatted_address;
      const simplifiedAddress = address.replace(/, UK$/, '')
                                     .replace(/Narberth, Pembrokeshire/i, 'Narberth');
      locationInput.value = simplifiedAddress;
    }
  });
}

function showMapSelection() {
  mapSelectionContainer.style.display = 'block';
  
  // Center map on current location if available and near Narberth
  if (map) {
    const center = getDistanceFromNarberth(map.getCenter()) < 20 ? map.getCenter() : NARBERTH_CENTER;
    selectionMap.setCenter(center);
  }
  
  // Close any other views
  mapContainer.style.display = 'none';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  const statusData = {
    location: locationInput.value,
    timestamp: Date.now(),
    status: document.querySelector('[name="status"]:checked').value
  };
  
  push(statusListRef, statusData).then(() => {
    // Reset form and update list
    walkForm.reset();
    loadStatuses();
  });
}

function loadStatuses() {
  if (isThrottled) return;
  isThrottled = true;
  
  setTimeout(() => {
    const statusList = [];
    const statuses = statusListEl.children;
    for (let status of statuses) {
      statusList.push(status);
    }
    statusList.sort((a, b) => b.timestamp - a.timestamp);
    
    statusListEl.innerHTML = '';
    statusList.forEach(status => statusListEl.appendChild(status));
    emptyStateEl.style.display = statusList.length ? 'none' : 'block';
    isThrottled = false;
  }, 1000);
}

function addExistingMarkers() {
  // Fetch and add any existing markers from Firebase to the map
}
