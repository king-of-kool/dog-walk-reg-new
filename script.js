// Import Firebase components
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtpIJvKHY3x_8x7_m-0QtUMIQ0Gj2blRQ",
  authDomain: "dog-walk-reg.firebaseapp.com",
  databaseURL: "https://dog-walk-reg-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "dog-walk-reg",
  storageBucket: "dog-walk-reg.firebasestorage.app",
  messagingSenderId: "806193788108",
  appId: "1:806193788108:web:ac6df92dd5800bd74a3e69",
  measurementId: "G-9Y7PYSP8NP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to save status to Firebase
function saveWalkStatus(statusData) {
  const statusRef = ref(database, 'dogWalkStatuses/' + Date.now());
  set(statusRef, statusData)
    .then(() => {
      console.log("Status saved successfully!");
      getWalkStatuses(); // Fetch the updated statuses
    })
    .catch((error) => {
      console.error("Error saving status: ", error);
    });
}

// Function to get and display statuses from Firebase
function getWalkStatuses() {
  const statusRef = ref(database, 'dogWalkStatuses');
  get(statusRef).then(snapshot => {
    if (snapshot.exists()) {
      const statuses = snapshot.val();
      const statusList = document.getElementById('statusList');
      statusList.innerHTML = ''; // Clear previous statuses
      
      for (let id in statuses) {
        const status = statuses[id];
        const statusCard = document.createElement('div');
        statusCard.classList.add('status-card');
        statusCard.innerHTML = `
          <h3>Walking: ${status.walkingStatus}</h3>
          <p><strong>Location:</strong> ${status.location}</p>
          <p><strong>Time:</strong> ${status.walkTime}</p>
          <p><strong>Dog Status:</strong> ${status.dogStatus}</p>
          <p><strong>Safety:</strong> ${status.safetyStatus}</p>
          <p><strong>Notes:</strong> ${status.otherNotes || 'None'}</p>
        `;
        statusList.appendChild(statusCard);
      }
    } else {
      document.getElementById('emptyState').classList.remove('hidden');
    }
  }).catch((error) => {
    console.error("Error getting data: ", error);
  });
}

// Google Maps Initialization
function initMaps() {
  const map = new google.maps.Map(document.getElementById("mapContainer"), {
    center: { lat: 51.795, lng: -4.705 },
    zoom: 15,
  });
}
