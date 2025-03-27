Dog Walk Status Web Application
This is a simple web application designed to allow users to mark and share their dog walking status. It helps users avoid potential accidents by sharing whether a dog is being walked, the dog's status, safety information, and the walking location. It also includes a dark mode toggle and tracks the number of characters remaining in the location input.

Features
Submit Dog Walk Status: Users can mark whether they are walking their dog, specify the location, set the time of the walk, and provide the dog's behavior status (e.g., friendly, nervous, service dog).

Safety Information: Users can mark the safety status of the walk, whether it's safe, unsafe, or unknown.

Live Updates: The status list dynamically updates to display new walk statuses submitted by others in real-time.

Inappropriate Language Filter: Any submission containing offensive language in the location input will be rejected with an alert.

Character Count: The location input field displays the remaining number of characters allowed for the location description.

Dark Mode: The app features a toggle for dark mode to provide a better user experience in different lighting conditions.

Responsive Design: The app is mobile-friendly and adapts to smaller screen sizes.

Technologies Used
HTML5: The structure and content of the web page.

CSS3: Styling and layout of the web page, including animations and dark mode.

JavaScript: Adds interactivity to the web page, including form handling, Firebase database interaction, and live updates.

Firebase Realtime Database: Used to store and retrieve dog walk statuses in real-time.

Google Fonts (Roboto): Used to style the text content of the page.

Firebase Setup
To use this app, you must have a Firebase project with the Firebase Realtime Database enabled. You will need to replace the Firebase configuration object with your own Firebase project credentials.

Go to the Firebase Console.

Create a new project or use an existing one.

Enable Firebase Realtime Database in your project.

Replace the Firebase configuration in the JavaScript section of this code (firebaseConfig) with your own project credentials.

How to Run the Application
Clone this repository to your local machine.

Open the index.html file in a web browser to see the application in action.

bash
Copy
git clone <repository-url>
cd <project-folder>
open index.html
Alternatively, you can upload the files to any web hosting service that supports static HTML pages.

Customizing the Application
Change Bad Words List: If you need to update or extend the list of offensive words, modify the badWords array in the JavaScript section.

Customize Appearance: Modify the CSS for different layout and color adjustments.

Dark Mode Toggle: The dark mode toggle can be controlled by clicking the switch in the top right corner of the screen.

Add More Fields: You can extend the form by adding more input fields for additional dog walk status information.

Contributing
If you would like to contribute to this project, feel free to fork the repository and submit a pull request with your changes.

License
This project is open-source and available under the MIT License.

Enjoy using the Dog Walk Status app and help keep dog walkers and pets safe!
