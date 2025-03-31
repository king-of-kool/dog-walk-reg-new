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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.getDatabase(app);
const statusListRef = firebase.query(firebase.ref(database, 'narberthDogWalkStatuses'), firebase.orderByChild('timestamp'));

// Map Variables
const NARBERTH_CENTER = { lat: 51.7978, lng: -4.7427 };
const DEFAULT_ZOOM = 15;
let map, selectionMap, geocoder, autocomplete, selectionMarker;
let mapsApiLoaded = false;
let mapsApiLoading = false;
let markers = [];
let currentFilter = 'all';

// DOM Elements
const statusListEl = document.getElementById('statusList');
const emptyStateEl = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn');
const mapContainer = document.getElementById('mapContainer');
const mapSelectionContainer = document.getElementById('mapSelectionContainer');
const selectOnMapBtn = document.getElementById('selectOnMapBtn');
const locationInput = document.getElementById('location');
const walkForm = document.getElementById('walkForm');
const retryMapBtn = document.getElementById('retryMap');
const retrySelectionMapBtn = document.getElementById('retrySelectionMap');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkGeolocation();
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
  
  // Retry buttons
  retryMapBtn?.addEventListener('click', initMaps);
  retrySelectionMapBtn?.addEventListener('click', initMaps);
  
  // Hash-based navigation
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

function loadInitialData() {
  // Listen to new data in Realtime Database
  firebase.database().ref('narberthDogWalkStatuses').on('child_added', function(snapshot) {
    const status = snapshot.val();
    displayStatus(status);
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = new FormData(walkForm);
  const walkData = {
    status: formData.get('status'),
    location: formData.get('location'),
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  };
  
  // Save data to Realtime Database
  const statusRef = firebase.database().ref('narberthDogWalkStatuses');
  statusRef.push(walkData)
    .then(() => {
      console.log("Data added to Realtime Database successfully");
      alert("Status submitted successfully to Realtime Database");
      walkForm.reset();
    })
    .catch(error => {
      console.error("Error adding to Realtime Database: ", error);
      alert("Failed to submit to Realtime Database");
    });
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
  initMaps();
}

function showListView() {
  mapContainer.style.display = 'none';
  statusListEl.style.display = 'grid';
}

// Map Functions
function initMaps() {
  if (mapsApiLoaded) {
    createMaps();
    return;
  }

  if (mapsApiLoading) return;
  
  showMapLoading();
  mapsApiLoading = true;

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCTLsji9XOlgHK-YUPrQYSfLPB5NoerVWY&libraries=places&callback=handleMapsLoaded`;
  script.async = true;
  script.defer = true;
  script.onerror = handleMapsError;
  document.head.appendChild(script);
}

function handleMapsLoaded() {
  mapsApiLoaded = true;
  mapsApiLoading = false;
  hideMapLoading();
  createMaps();
}

function handleMapsError() {
  mapsApiLoading = false;
  showMapError();
  console.error("Failed to load Google Maps API");
}

function createMaps() {
  try {
    // Main Map
    map = new google.maps.Map(document.getElementById('map'), {
      center: NARBERTH_CENTER,
      zoom: DEFAULT_ZOOM,
      styles: getMapStyle()
    });
    
    // Selection Map
    selectionMap = new google.maps.Map(document.getElementById('selectionMap'), {
      center: NARBERTH_CENTER,
      zoom: DEFAULT_ZOOM,
      styles: getMapStyle()
    });
    
    geocoder = new google.maps.Geocoder();
    initAutocomplete();
    
    // Add map event listeners
    selectionMap.addListener('click', (e) => {
      placeSelectionMarker(e.latLng);
      reverseGeocode(e.latLng);
    });

    // Add existing markers if any
    addExistingMarkers();

  } catch (error) {
    console.error("Map creation error:", error);
    showMapError();
  }
}

function showMapLoading() {
  document.getElementById('mapLoading')?.classList.remove('hidden');
  document.getElementById('mapError')?.classList.add('hidden');
}

function hideMapLoading() {
  document.getElementById('mapLoading')?.classList.add('hidden');
}

function showMapError() {
  document.getElementById('mapError')?.classList.remove('hidden');
  document.getElementById('mapLoading')?.classList.add('hidden');
}

function showSelectionMapError() {
  document.getElementById('selectionMapError')?.classList.remove('hidden');
}

function hideSelectionMapError() {
  document.getElementById('selectionMapError')?.classList.add('hidden');
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
  mapSelectionContainer.classList.remove('hidden');
  
  // Center map on current location if available and near Narberth
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        if (selectionMap) {
          // Only use if within 20km of Narberth
          if (getDistanceFromNarberth(userLocation) < 20) {
            selectionMap.setCenter(userLocation);
          } else {
            selectionMap.setCenter(NARBERTH_CENTER);
          }
          selectionMap.setZoom(DEFAULT_ZOOM);
        }
      },
      () => {
        // Default to Narberth center if geolocation fails
        if (selectionMap) {
          selectionMap.setCenter(NARBERTH_CENTER);
          selectionMap.setZoom(DEFAULT_ZOOM);
        }
      },
      { 
        timeout: 10000,
        enableHighAccuracy: true 
      }
    );
  }
}

function getMapStyle() {
  return document.body.classList.contains('dark-mode') ? [
    { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#93c5fd" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#93c5fd" }]
