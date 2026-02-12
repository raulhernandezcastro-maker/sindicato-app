import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'
import { Spinner } from '../ui/spinner'

export default function CargaCuotasExcel() {
  const [file, setFile] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState([])
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)

  /* =============================
     LIMPIAR MONTO CORRECTAMENTE
  ============================= */

  const cleanMonto = (value) => {
    if (!value) return 0

    return Number(
      String(value)
        .replace(/\./g, '')   // elimina separador miles
        .replace(',', '.')   // cambia coma decimal
        .trim()
    )
  }

  /* =============================
     CARGAR PREVIEW DESDE BD
  ============================= */

  const loadPreview = async () => {
    const { data } = await supabase
      .from('cuotas_importacion')
      .select('*')
      .order('created_at', { ascending: false })

    setPreview(data || [])
  }

  /* =============================
     PROCESAR EXCEL
  ============================= */

  const handleProcess = async () => {
    if (!file || !periodo) {
      setError('Debes seleccionar archivo y período')
      return
    }

    setError(null)
    setProcessing(true)

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)

        if (!json.length) {
          setError('El archivo está vacío')
          setProcessing(false)
          return
        }

        const rowsToInsert = json.map(row => ({
          periodo: `${periodo}-01`,
          rut: String(row.Rut || '').trim(),
          nombre: row.Nombre || '',
          tipo: String(row.Tipo || '').toUpperCase(),
          valor_pagado: cleanMonto(row['Valor Pagado']),
          estado: 'pendiente',
          estado_validacion: 'pendiente'
        }))

        const { error: insertError } = await supabase
          .from('cuotas_importacion')
          .insert(rowsToInsert)

        if (insertError) {
          console.error(insertError)
          setError(insertError.message)
          setProcessing(false)
          return
        }

        // 🔄 Recargar preview
        await loadPreview()

        // 🧹 Limpiar formulario
        setFile(null)
        setPeriodo('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        setProcessing(false)
      }

      reader.readAsArrayBuffer(file)

    } catch (err) {
      console.error(err)
      setError('Error procesando archivo')
      setProcessing(false)
    }
  }

  /* =============================
     RENDER
  ============================= */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Masiva de Cuotas</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {error && <Alert variant="destructive">{error}</Alert>}

        <div>
          <label className="text-sm font-medium">
            Período (YYYY-MM)
          </label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Archivo Excel
          </label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <Button
          onClick={handleProcess}
          disabled={processing}
        >
          {processing ? 'Procesando...' : 'Procesar Excel'}
        </Button>

        {/* PREVIEW */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Vista previa de cuotas importadas
          </h3>

          {processing && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {!processing && preview.length === 0 && (
            <p className="text-muted-foreground">
              No hay cuotas importadas
            </p>
          )}

          {!processing && preview.length > 0 && (
            <table className="w-full text-sm border">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-2">RUT</th>
                  <th className="p-2">Nombre</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Periodo</th>
                  <th className="p-2">Monto</th>
                  <th className="p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.map(row => (
                  <tr key={row.id} className="border-b">
                    <td className="p-2">{row.rut}</td>
                    <td className="p-2">{row.nombre}</td>
                    <td className="p-2">{row.tipo}</td>
                    <td className="p-2">{row.periodo}</td>
                    <td className="p-2">
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP'
                      }).format(row.valor_pagado)}
                    </td>
                    <td className="p-2">{row.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
