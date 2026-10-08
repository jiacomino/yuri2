import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Mode sombre HeroUI (classe `.dark`) calé sur la préférence de Windows.
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const applyTheme = () =>
  document.documentElement.classList.toggle("dark", darkQuery.matches);
applyTheme();
darkQuery.addEventListener("change", applyTheme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
