import { useState } from "react";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  return (
    <div>
      <h1>Gestión de Cuotas</h1>
      <p>Carga, validación y confirmación de cuotas</p>

      {/* 🔴 SELECTOR DE PERÍODO (OBLIGATORIO) */}
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

      {/* 👀 PREVIEW */}
      <PreviewCuotas periodo={periodo} />

      <hr />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas periodo={periodo} />
    </div>
  );
}
