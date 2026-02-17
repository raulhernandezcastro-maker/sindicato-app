import { useState } from "react";

import ResumenCuotas from "../components/cuotas/ResumenCuotas";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  return (
    <div>
      <h1>Gestión de Cuotas</h1>
      <p>Carga, validación y confirmación de cuotas</p>

      {/* 📊 RESUMEN */}
      <ResumenCuotas />

      {/* 🔴 SELECTOR DE PERÍODO (solo para CARGA) */}
      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Período a cargar:</strong>
        </label>
        <br />
        <input
          type="month"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
        />
      </div>

      {/* 📥 CARGA EXCEL */}
      <CargaCuotasExcel periodo={periodo} />

      <hr />

      {/* 👀 PREVIEW (pendientes, sin filtrar por período) */}
      <PreviewCuotas />

      <hr />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas />
    </div>
  );
}
