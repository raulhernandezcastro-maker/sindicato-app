import { useState } from "react";

import ResumenCuotas from "../components/cuotas/ResumenCuotas";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";
import TablaCuotasConfirmadas from "../components/cuotas/TablaCuotasConfirmadas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  return (
    <div className="space-y-8">

      {/* 🔢 RESUMEN DE CUOTAS */}
      <ResumenCuotas />

      {/* 📌 TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold">Gestión de Cuotas</h1>
        <p className="text-muted-foreground">
          Carga, validación y confirmación de cuotas
        </p>
      </div>

      {/* 📅 PERÍODO (solo para carga) */}
      <div>
        <label className="font-medium">
          Período a cargar
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

      {/* 👀 PREVIEW DE PENDIENTES */}
      <PreviewCuotas />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas />

      {/* 📊 HISTÓRICO DE CUOTAS CONFIRMADAS */}
      <TablaCuotasConfirmadas />

    </div>
  );
}
