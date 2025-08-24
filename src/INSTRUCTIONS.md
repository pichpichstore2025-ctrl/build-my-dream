# Running Your Application Locally

This guide provides step-by-step instructions to get your Next.js application up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (which includes npm)

## Step 1: Install Dependencies

First, you need to install all the project's dependencies listed in the `package.json` file.

1.  Open your terminal or command prompt.
2.  Navigate to the root directory of your project.
3.  Run the following command:

    ```bash
    npm install
    ```

    This command will download and install all the required packages into a `node_modules` folder in your project.

## Step 2: Run the Main Web Application

Next, start the Next.js development server to run your web application.

1.  In the same terminal, run the following command:

    ```bash
    npm run dev
    ```

2.  Once it's running, you can open your web browser and navigate to the following address to see your app:

    [http://localhost:9002](http://localhost:9002)

The web application should now be running.

## Step 3: Run the Genkit AI Server (Optional)

This application uses Genkit for its AI-powered features. To enable these, you must run the Genkit server in a separate terminal.

1.  Open a **new** terminal window or tab.
2.  Navigate to the root directory of your project.
3.  Run the following command:

    ```bash
    npm run genkit:watch
    ```

This command starts the Genkit server and will automatically restart it if you make any changes to the AI-related files (located in the `src/ai` directory).

You should now have both the web application and the AI services running locally. You can start developing!
