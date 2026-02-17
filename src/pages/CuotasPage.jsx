import { useState } from "react";
import CargaCuotasExcel from "../components/cuotas/CargaCuotasExcel";
import PreviewCuotas from "../components/cuotas/PreviewCuotas";
import ConfirmarCuotas from "../components/cuotas/ConfirmarCuotas";
import CuotasConfirmadas from "../components/cuotas/CuotasConfirmadas";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function CuotasPage() {
  const [periodo, setPeriodo] = useState("");

  return (
    <div className="space-y-6">

      {/* 🔢 RECUADROS RESUMEN (ya existentes) */}
      {/* ⬆️ estos ya los tienes arriba, NO los tocamos */}

      {/* 📌 TÍTULO PRINCIPAL */}
      <div>
        <h1 className="text-2xl font-bold">Gestión de Cuotas</h1>
        <p className="text-muted-foreground">
          Carga, validación y confirmación de cuotas
        </p>
      </div>

      {/* 📥 CARGA DE CUOTAS */}
      <Card>
        <CardHeader>
          <CardTitle>Carga de cuotas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="font-medium">Período a cargar</label>
            <br />
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="mt-1"
            />
          </div>

          <CargaCuotasExcel periodo={periodo} />
        </CardContent>
      </Card>

      {/* 👀 PREVIEW */}
      <PreviewCuotas periodo={periodo} />

      {/* ✅ CONFIRMACIÓN */}
      <ConfirmarCuotas periodo={periodo} />

      {/* 📊 CUOTAS CONFIRMADAS */}
      <CuotasConfirmadas />
    </div>
  );
}
