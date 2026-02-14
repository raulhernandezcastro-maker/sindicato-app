import DashboardPage from "./pages/DashboardPage";
import CuotasPage from "./pages/CuotasPage";
import SociosPage from "./pages/SociosPage";

import { BrowserRouter, Routes, Route } from "react-router-dom";

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
