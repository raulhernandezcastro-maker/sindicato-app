import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'

export default function CargaCuotasExcel() {
  const [periodo, setPeriodo] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleProcess = async () => {
    setError('')
    setSuccess('')

    if (!periodo) {
      setError('Debes ingresar un periodo')
      return
    }

    if (!file) {
      setError('Debes seleccionar un archivo Excel')
      return
    }

    setLoading(true)

    try {
      // 🔹 Convertir YYYY-MM a YYYY-MM-01
      const periodoDate = `${periodo}-01`

      // 🔹 Leer archivo correctamente (sin FileReader)
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(sheet)

      if (!jsonData.length) {
        setError('El archivo está vacío')
        setLoading(false)
        return
      }

      const rows = jsonData.map((row) => ({
        periodo: periodoDate,
        rut: String(row.Rut || '').replace(/\D/g, ''), // limpia puntos y guión
        nombre: row.Nombre || '',
        tipo: row.Tipo || '',
        valor_pagado: Number(row['Valor Pagado'] || 0),
        estado: 'pendiente',
        estado_validacion: 'pendiente'
      }))

      console.log('Insertando filas:', rows)

      const { error: insertError } = await supabase
        .from('cuotas_importacion')
        .insert(rows)

      if (insertError) {
        console.error(insertError)
        setError(insertError.message)
        setLoading(false)
        return
      }

      setSuccess(`Se importaron ${rows.length} registros correctamente`)
      setFile(null)
    } catch (err) {
      console.error(err)
      setError('Error procesando archivo: ' + err.message)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga masiva de cuotas (Excel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        <div>
          <label className="block text-sm mb-1">Periodo (YYYY-MM)</label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Archivo Excel</label>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <Button onClick={handleProcess} disabled={loading}>
          {loading ? 'Procesando...' : 'Procesar Excel'}
        </Button>

      </CardContent>
    </Card>
  )
}
