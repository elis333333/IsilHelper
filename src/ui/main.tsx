import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "./pages/Home";
import "./theme/app.css";

// retry:false a propósito. Los reintentos con espera creciente viven en la
// capa de API (src/api/client.ts); apilar los de Query encima multiplicaría
// las peticiones justo contra un WAF que castiga las ráfagas.
const cliente = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Falta el nodo #raiz en index.html");

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={cliente}>
      <Home />
    </QueryClientProvider>
  </StrictMode>,
);
