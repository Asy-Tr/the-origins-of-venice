# The Origins of Venice

This project aims to produce an interactive cartography covering the 12th and 14th centuries based on OCR processed historical data.
The OCR-processed historical data was provided by Dr. Schnürer and is stored in the `entities` directory.

## How to Run Locally

### Prerequisites

- **Python** installed on your computer.
- If you have **pip** installed, you can install the required dependencies by running the following command:

  ```bash
  pip install -r service/requirements.txt
    ```
  
- Otherwise, you can install corresponding dependencies manually.

### Steps

1 **Run the Backend**
   - Open a terminal.
   - Navigate to the `service` directory:

     ```bash
     cd service
     ```
     
   - Start the backend server:

     ```bash
     python app.py
     ```
     
   - The server will run on http://localhost:5000/.

2 **Run the Frontend**
   - Open another terminal.
   - Navigate to the project’s root directory.
   - Start the frontend server:

     ```bash
     python -m http.server
     ```
     
   - The frontend will be available at http://localhost:8000/.

3 **Access the Application**
   - Open your web browser and enter URL http://localhost:8000/.
   - To view the map, navigate to the `visualization` directory.
   - Have fun exploring the map!