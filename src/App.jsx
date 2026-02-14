import { BrowserRouter, Routes, Route } from "react-router-dom";

// DashboardPage ES named export (confirmado por tu código)
import { DashboardPage } from "./pages/DashboardPage";

// CuotasPage NO es named export (confirmado por el error)
// → se importa como default
import CuotasPage from "./pages/CuotasPage";

// Si SociosPage da error después, se ajusta igual que CuotasPage
import { SociosPage } from "./pages/SociosPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cuotas" element={<CuotasPage />} />
        <Route path="/socios" element={<SociosPage />} />
      </Routes>
    </BrowserRouter>
  );
}
