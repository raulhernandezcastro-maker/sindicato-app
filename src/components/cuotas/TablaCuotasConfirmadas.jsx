import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../ui/card";

export default function TablaCuotasConfirmadas() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🎛️ filtros
  const [periodo, setPeriodo] = useState("");
  const [tipo, setTipo] = useState("");
  const [busqueda, setBusqueda] = useState(""); // RUT o Nombre

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, tipo]);

  const cargar = async () => {
    setLoading(true);

    let query = supabase
      .from("cuotas_importacion")
      .select("*")
      .eq("estado", "confirmado")
      .order("created_at", { ascending: false });

    if (periodo) {
      query = query.eq("periodo", `${periodo}-01`);
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando cuotas confirmadas:", error);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  };

  const limpiarFiltros = () => {
    setPeriodo("");
    setTipo("");
    setBusqueda("");
  };

  // Filtro local por RUT o Nombre
  const rowsFiltradas = busqueda.trim()
    ? rows.filter(r => {
        const q = busqueda.toLowerCase().trim();
        return (
          (r.rut && r.rut.toLowerCase().includes(q)) ||
          (r.nombre && r.nombre.toLowerCase().includes(q))
        );
      })
    : rows;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Cuotas Confirmadas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* 🎛️ FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
          <div>
            <label className="text-sm font-medium">Período</label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="mt-1 block border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 block border rounded px-3 py-2"
            >
              <option value="">Todos</option>
              <option value="SOCIO">Socio</option>
              <option value="APORTANTE">Aportante</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Buscar por RUT o Nombre</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: 12345678 o Juan"
              className="mt-1 block border rounded px-3 py-2 w-52"
            />
          </div>

          <button
            onClick={limpiarFiltros}
            className="border rounded px-4 py-2 text-sm"
          >
            Limpiar filtros
          </button>
        </div>

        {/* 📊 TABLA */}
        {loading ? (
          <div className="py-6 text-center">
            Cargando cuotas confirmadas...
          </div>
        ) : !rowsFiltradas.length ? (
          <div className="py-6 text-center text-muted-foreground">
            No hay cuotas confirmadas para los filtros seleccionados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rowsFiltradas.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.rut}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.tipo}</TableCell>
                  <TableCell>{r.periodo}</TableCell>
                  <TableCell>
                    ${Number(r.valor_pagado).toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("es-CL")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
