import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./styles/Themecontext";
import MuiTheme from "./styles/MuiTheme";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <MuiTheme>
        <App />
      </MuiTheme>
    </ThemeProvider>
  </StrictMode>,
);
