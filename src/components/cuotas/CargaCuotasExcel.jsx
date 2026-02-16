import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

export default function CargaCuotasExcel({ periodo, onProcesado }) {
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const normalizarRut = (rut) =>
    String(rut || "").replace(/[.\-]/g, "").trim();

  const parseMonto = (valor) => {
    if (valor === null || valor === undefined) return NaN;
    const limpio = String(valor).replace(/[^\d]/g, "");
    return Number(limpio);
  };

  const procesarExcel = async () => {
    if (!archivo) {
      alert("Debe seleccionar un archivo Excel");
      return;
    }

    if (!periodo) {
      alert("Debe seleccionar un período");
      return;
    }

    setLoading(true);

    try {
      const data = await archivo.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) {
        alert("El Excel no contiene datos");
        return;
      }

      // 🔎 buscar duplicados históricos por período
      const { data: existentes, error } = await supabase
        .from("cuotas_importacion")
        .select("rut, periodo")
        .eq("periodo", periodo);

      if (error) throw error;

      const historicos = new Set(
        (existentes || []).map((r) => `${r.rut}_${r.periodo}`)
      );

      const vistosExcel = new Set();
      const registrosValidos = [];

      rows.forEach((row) => {
        const rut = normalizarRut(row.Rut || row.rut);
        const tipo = String(row.Tipo || row.tipo || "").toUpperCase();
        const monto = parseMonto(row.Valor_Pagado || row.valor_pagado);
        const key = `${rut}_${periodo}`;

        if (!rut) return;
        if (!["SOCIO", "APORTANTE"].includes(tipo)) return;
        if (!Number.isFinite(monto) || monto <= 0) return;
        if (vistosExcel.has(key)) return;
        if (historicos.has(key)) return;

        vistosExcel.add(key);

        registrosValidos.push({
          periodo,
          rut,
          nombre: row.Nombre || row.nombre || "",
          tipo,
          valor_pagado: monto,
          estado: "pendiente",
          estado_validacion: "ok",
          mensaje_error: null,
        });
      });

      if (!registrosValidos.length) {
        alert("No hay registros válidos para importar");
        return;
      }

      const { error: insertError } = await supabase
        .from("cuotas_importacion")
        .insert(registrosValidos);

      if (insertError) throw insertError;

      setArchivo(null);
      if (onProcesado) onProcesado();

      alert(`Se importaron ${registrosValidos.length} cuotas correctamente`);
    } catch (err) {
      console.error("Error procesando Excel:", err);
      alert("Error procesando Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".xlsx"
        onChange={(e) => setArchivo(e.target.files[0])}
      />

      <button onClick={procesarExcel} disabled={loading}>
        {loading ? "Procesando..." : "Procesar Excel"}
      </button>
    </div>
  );
}
