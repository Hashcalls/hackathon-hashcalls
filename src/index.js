import React from "react";
import ReactDOM from "react-dom";
import Layout from "./app/layout"; // Adjust path as needed
import Page from "./app/page";    // Adjust path as needed

ReactDOM.render(
	<React.StrictMode>
		<Layout>
			<Page />
		</Layout>
	</React.StrictMode>,
	document.getElementById("root")
);