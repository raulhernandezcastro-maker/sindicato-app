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

  const procesarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrores([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const vistos = new Set();
      const registros = [];
      const erroresLocales = [];

      // 🔎 Obtener duplicados históricos
      const { data: existentes } = await supabase
        .from("cuotas_importacion")
        .select("rut, periodo")
        .eq("periodo", periodo);

      const historicos = new Set(
        existentes?.map((r) => `${r.rut}_${r.periodo}`) || []
      );

      rows.forEach((row, index) => {
        const rut = normalizarRut(row.rut);
        const tipo = String(row.tipo || "").toUpperCase();
        const monto = parseMonto(row.valor_pagado);

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
          periodo,
          rut,
          nombre: row.nombre || "",
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

      const { error } = await supabase
        .from("cuotas_importacion")
        .insert(registros);

      if (error) throw error;

      setErrores(erroresLocales);
      e.target.value = ""; // limpiar input
    } catch (err) {
      console.error(err);
      alert("Error procesando Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx" onChange={procesarExcel} />
      {loading && <p>Procesando Excel...</p>}
      {errores.length > 0 && (
        <div style={{ color: "red" }}>
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
