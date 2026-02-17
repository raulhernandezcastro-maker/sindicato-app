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

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("cuotas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error cargando cuotas confirmadas:", error);
      setRows([]);
    } else {
      setRows(data || []);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          Cargando cuotas confirmadas...
        </CardContent>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No hay cuotas confirmadas aún
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Cuotas Confirmadas</CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUT</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha Confirmación</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((r) => (
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
      </CardContent>
    </Card>
  );
}
