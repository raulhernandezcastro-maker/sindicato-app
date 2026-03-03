import { useState } from "react";

import ResumenCuotas from "../components/cuotas/ResumenCuotas";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";
import TablaCuotasConfirmadas from "../components/cuotas/TablaCuotasConfirmadas";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProcesado = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-8">

      {/* 🔢 RESUMEN DE CUOTAS */}
      <ResumenCuotas key={refreshKey} />

      {/* 📌 TÍTULO */}
      <div>
        <h1 className="text-2xl font-bold">Gestión de Cuotas</h1>
        <p className="text-muted-foreground">
          Carga, validación y confirmación de cuotas
        </p>
      </div>

      {/* 📅 PERÍODO (para carga y preview) */}
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
      <CargaCuotasExcel periodo={periodo} onProcesado={handleProcesado} />

      {/* 👀 PREVIEW DE PENDIENTES — recibe periodo */}
      <PreviewCuotas periodo={periodo} key={`preview-${refreshKey}`} />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas onFinish={handleProcesado} />

      {/* 📊 HISTÓRICO DE CUOTAS CONFIRMADAS */}
      <TablaCuotasConfirmadas key={`tabla-${refreshKey}`} />

    </div>
  );
}
