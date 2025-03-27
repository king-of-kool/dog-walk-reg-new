# Dog Walk Status Web Application

This web application allows users to mark and share their dog walking status to help others avoid potential accidents. It includes features such as location and dog status, safety information, and real-time updates. It also supports a dark mode toggle and tracks character count for location input.

## Features

- Submit Dog Walk Status: Users can indicate whether they are walking their dog, provide the location, set the time of the walk, and specify the dog's behavior (e.g., friendly, nervous, service dog).
- Safety Information: Users can specify the safety status of the walk (safe, unsafe, or unknown).
- Live Updates: The status list dynamically updates with new statuses submitted by users in real-time.
- Inappropriate Language Filter: The app rejects any submission containing offensive language in the location input.
- Character Count: Displays the remaining number of characters allowed in the location input.
- Dark Mode: Users can toggle between light and dark modes for a better user experience.
- Mobile Responsive: The app is designed to be responsive and works well on both desktop and mobile devices.

## Technologies Used

- **HTML5**: Structure and content of the web page.
- **CSS3**: Styling, layout, and animations (including dark mode).
- **JavaScript**: Interactivity, form handling, Firebase integration, and live status updates.
- **Firebase Realtime Database**: Stores and retrieves dog walk statuses in real-time.
- **Google Fonts (Roboto)**: Used for typography.

## Running the Application

1. Clone this repository.
2. Open the `index.html` file in a web browser.
3. Alternatively, you can upload the files to a web hosting service.

## Customization

- Modify the `badWords` array to change or add words to the inappropriate language filter.
- Adjust the CSS for layout and color scheme changes.
- Extend the form with additional fields for more information.
- Enable or disable dark mode using the toggle in the top right corner.

## Contributing

Feel free to fork this repository and submit a pull request with improvements or new features.

## License

This project is open-source and available under the MIT License.
