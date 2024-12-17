import React from "react";
import { createRoot } from "react-dom/client"; // Use createRoot from react-dom/client
import Layout from "./app/layout"; // Adjust path as needed
import Page from "./app/page";    // Adjust path as needed

// Get the root DOM node
const rootElement = document.getElementById("root");

// Create a root instance
const root = createRoot(rootElement);

// Render the application
root.render(
	<React.StrictMode>
		<Layout>
			<Page />
		</Layout>
	</React.StrictMode>
);