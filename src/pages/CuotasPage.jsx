import { useState } from "react";

import ResumenCuotas from "../components/cuotas/ResumenCuotas";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  // ⚠️ Por ahora estos valores pueden ser fijos o venir de estado.
  // En el siguiente paso los conectamos a Supabase.
  const pendientes = 12;
  const conError = 3;
  const confirmadas = 0;

  return (
    <div className="space-y-6">

      {/* 🔢 RESUMEN SUPERIOR */}
      <ResumenCuotas
        pendientes={pendientes}
        conError={conError}
        confirmadas={confirmadas}
      />

      {/* 📌 TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold">Gestión de Cuotas</h1>
        <p className="text-muted-foreground">
          Carga, validación y confirmación de cuotas
        </p>
      </div>

      {/* 📅 PERÍODO */}
      <div>
        <label className="font-medium">
          Período a cargar:
        </label>
        <div className="mt-2">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* 📥 CARGA EXCEL */}
      <CargaCuotasExcel periodo={periodo} />

      {/* 👀 PREVIEW */}
      <PreviewCuotas periodo={periodo} />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas periodo={periodo} />

    </div>
  );
}
