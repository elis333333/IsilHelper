import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./theme/app.css";

// retry:false a propósito. Los reintentos con espera creciente viven en la
// capa de API (src/api/client.ts); apilar los de Query encima multiplicaría
// las peticiones justo contra un WAF que castiga las ráfagas.
// `gcTime: Infinity` porque las pestañas se montan y desmontan: con los cinco
// minutos por defecto, lo que trajo una pantalla desaparece de la caché al
// rato y el buscador —que promete buscar en lo cargado— empezaría a mentir.
// La página vive lo que dure abierta, así que no hay nada que liberar.
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, gcTime: Infinity },
  },
});

const root = document.getElementById("raiz");
if (!root) throw new Error("Falta el nodo #raiz en index.html");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <Home />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
