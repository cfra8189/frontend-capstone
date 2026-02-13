import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { FolderProvider } from "./context/FolderContext";
import { CollaborationProvider } from "./context/CollaborationContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FolderProvider>
          <CollaborationProvider>
            <App />
          </CollaborationProvider>
        </FolderProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
