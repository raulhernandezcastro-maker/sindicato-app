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

      // 🔎 Buscar duplicados históricos para el período
      const { data: existentes, error: selectError } = await supabase
        .from("cuotas_importacion")
        .select("rut, periodo")
        .eq("periodo", periodo);

      if (selectError) throw selectError;

      const historicos = new Set(
        (existentes || []).map((r) => `${r.rut}_${r.periodo}`)
      );

      const vistosExcel = new Set();
      const registros = [];

      rows.forEach((row) => {
        const rut = normalizarRut(row.Rut || row.rut);
        const tipo = String(row.Tipo || row.tipo || "").toUpperCase();
        const monto = parseMonto(row.Valor_Pagado || row.valor_pagado);

        const key = `${rut}_${periodo}`;

        let estadoValidacion = "ok";
        let mensajeError = null;

        if (!rut) {
          estadoValidacion = "error";
          mensajeError = "RUT vacío";
        } else if (!["SOCIO", "APORTANTE"].includes(tipo)) {
          estadoValidacion = "error";
          mensajeError = "Tipo inválido";
        } else if (!Number.isFinite(monto) || monto <= 0) {
          estadoValidacion = "error";
          mensajeError = "Monto inválido";
        } else if (vistosExcel.has(key)) {
          estadoValidacion = "error";
          mensajeError = "Duplicado dentro del Excel";
        } else if (historicos.has(key)) {
          estadoValidacion = "error";
          mensajeError = "Ya existe cuota para este período";
        }

        vistosExcel.add(key);

        registros.push({
          periodo, // ⚠️ lo dejamos TAL CUAL, no lo tocamos aún
          rut,
          nombre: row.Nombre || row.nombre || "",
          tipo,
          valor_pagado: Number.isFinite(monto) ? monto : 0,
          estado: "pendiente",
          estado_validacion: estadoValidacion,
          mensaje_error: mensajeError,
        });
      });

      const { error: insertError } = await supabase
        .from("cuotas_importacion")
        .insert(registros);

      if (insertError) throw insertError;

      if (onProcesado) onProcesado();
      setArchivo(null);

      alert("Excel procesado correctamente");
    } catch (err) {
      console.error("❌ ERROR REAL PROCESANDO EXCEL:", err);

      if (err?.message) {
        alert("Error procesando Excel:\n" + err.message);
      } else if (err?.error?.message) {
        alert("Error procesando Excel:\n" + err.error.message);
      } else {
        alert("Error procesando Excel (ver consola)");
      }
    } finally {
      setLoading(false); // 🔑 evita botón colgado
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
