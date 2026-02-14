import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";

import { DashboardPage } from "./pages/DashboardPage";
import CuotasPage from "./pages/CuotasPage";
import { SociosPage } from "./pages/SociosPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Layout principal */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/cuotas" element={<CuotasPage />} />
            <Route path="/socios" element={<SociosPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
