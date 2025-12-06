import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CollaborationProvider } from "@/context/CollaborationContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CollaborationProvider>
      <App />
    </CollaborationProvider>
  </StrictMode>
);
