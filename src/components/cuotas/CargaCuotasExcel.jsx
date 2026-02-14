import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

export default function CargaCuotasExcel({ periodo }) {
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState([]);

  const normalizarRut = (rut) =>
    String(rut || "").replace(/[.\-]/g, "").trim();

  const parseMonto = (valor) => {
    if (valor === null || valor === undefined) return NaN;
    const limpio = String(valor).replace(/[^\d]/g, "");
    return Number(limpio);
  };

  const getField = (row, posibles) => {
    for (const key of posibles) {
      if (row[key] !== undefined) return row[key];
    }
    return undefined;
  };

  const procesarExcel = async (e) => {
    const file = e.target.files[0];

    if (!periodo) {
      alert("Debe seleccionar el período antes de cargar el Excel");
      e.target.value = "";
      return;
    }

    if (!file) return;

    setLoading(true);
    setErrores([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        alert("El archivo Excel no contiene datos");
        return;
      }

      const vistos = new Set();
      const registros = [];
      const erroresLocales = [];

      // 🔎 Duplicados históricos para el mismo período
      const { data: existentes, error: errorExistentes } = await supabase
        .from("cuotas_importacion")
        .select("rut, periodo")
        .eq("periodo", periodo);

      if (errorExistentes) throw errorExistentes;

      const historicos = new Set(
        (existentes || []).map((r) => `${r.rut}_${r.periodo}`)
      );

      rows.forEach((row, index) => {
        const rutRaw = getField(row, ["rut", "Rut", "RUT"]);
        const tipoRaw = getField(row, ["tipo", "Tipo"]);
        const montoRaw = getField(row, [
          "valor_pagado",
          "Valor_Pagado",
          "monto",
          "Monto",
        ]);

        const rut = normalizarRut(rutRaw);
        const tipo = String(tipoRaw || "").toUpperCase();
        const monto = parseMonto(montoRaw);

        const key = `${rut}_${periodo}`;
        let mensajeError = null;

        if (!rut) mensajeError = "RUT vacío";
        else if (!["SOCIO", "APORTANTE"].includes(tipo))
          mensajeError = "Tipo inválido";
        else if (!Number.isFinite(monto) || monto <= 0)
          mensajeError = "Monto inválido";
        else if (vistos.has(key))
          mensajeError = "Duplicado dentro del Excel";
        else if (historicos.has(key))
          mensajeError = "Ya existe carga para este período";

        vistos.add(key);

        registros.push({
          periodo, // 🔴 PERÍODO FORZADO DESDE UI
          rut,
          nombre: getField(row, ["nombre", "Nombre"]) || "",
          tipo,
          valor_pagado: Number.isFinite(monto) ? monto : 0,
          estado: "pendiente",
          estado_validacion: mensajeError ? "error" : "ok",
          mensaje_error: mensajeError,
        });

        if (mensajeError) {
          erroresLocales.push(`Fila ${index + 2}: ${mensajeError}`);
        }
      });

      const { error: insertError } = await supabase
        .from("cuotas_importacion")
        .insert(registros);

      if (insertError) throw insertError;

      setErrores(erroresLocales);
      e.target.value = "";
    } catch (err) {
      console.error("ERROR PROCESANDO EXCEL:", err);
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
        onChange={procesarExcel}
        disabled={!periodo || loading}
      />

      {loading && <p>Procesando Excel...</p>}

      {errores.length > 0 && (
        <div style={{ color: "red", marginTop: 12 }}>
          <h4>Errores detectados</h4>
          <ul>
            {errores.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
