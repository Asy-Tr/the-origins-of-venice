# The Origins of Venice

This project aims to produce an interactive cartography covering the 12th and 14th centuries based on OCR processed historical data.

## How to Run Locally

### Prerequisites

- **Python** installed on your computer.

### Steps

1 **Run the Frontend**
   - Open a terminal.
   - Navigate to the project’s root directory.
   - Start the frontend server:
     ```bash
     python -m http.server
     ```
   - The frontend will be available at http://localhost:8000/.

2 **Run the Backend**
   - Open another terminal.
   - Navigate to the `service` folder:
     ```bash
     cd service
     ```
   - Install the required dependencies (Flask, Flask-Cors, etc.)
   - Start the backend server:
     ```bash
     python app.py
     ```
   - The backend will run on http://localhost:5000/.

3 **Access the Application**
   - Open your web browser.
   - Go to http://localhost:8000/.
   - To view the map, navigate to the `visualization` directory within the application.


