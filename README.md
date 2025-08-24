# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running Locally

To run this application on your own machine, you'll need to have Node.js and npm installed. Then, follow these steps:

1.  **Install Dependencies**:
    Open your terminal in the project directory and run the following command to install the necessary packages:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    To start the main web application, run:
    ```bash
    npm run dev
    ```
    This will start the Next.js development server, typically available at `http://localhost:9002`.

3.  **Run the Genkit AI Server (Optional)**:
    This application uses Genkit for its AI-powered features. To enable these, you'll need to run the Genkit server in a separate terminal window.
    ```bash
    npm run genkit:watch
    ```
    This command watches for changes in your AI-related files and keeps the server up to date.

You should now have both the web application and the AI services running locally.
