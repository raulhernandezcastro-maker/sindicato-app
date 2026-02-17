import { useState } from "react";

import ResumenCuotas from "../components/cuotas/ResumenCuotas";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";
import CuotasConfirmadas from "../components/cuotas/CuotasConfirmadas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  return (
    <div>
      <h1>Gestión de Cuotas</h1>

      {/* 📊 RESUMEN */}
      <ResumenCuotas />

      {/* 🧾 DESCRIPCIÓN */}
      <p style={{ marginTop: 12 }}>
        Carga, validación y confirmación de cuotas
      </p>

      {/* 🔴 SELECTOR DE PERÍODO (solo para carga) */}
      <div style={{ marginBottom: 20, marginTop: 16 }}>
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

      {/* 👀 PREVIEW (pendientes globales) */}
      <PreviewCuotas />

      <hr />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas />

      <hr />

      <CuotasConfirmadas />
    </div>
  );
}
