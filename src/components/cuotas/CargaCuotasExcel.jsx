import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Alert } from '../../components/ui/alert'

export default function CargaCuotasExcel() {
  const [file, setFile] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleProcess = async () => {
    if (!file) {
      setError('Debes seleccionar un archivo Excel')
      return
    }

    if (!periodo) {
      setError('Debes seleccionar un período')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData.length) {
        throw new Error('El archivo no contiene datos')
      }

      const periodoDate = new Date(periodo + '-01')

      const rows = jsonData.map((row) => {
        const tipoRaw = String(row.Tipo || '').trim().toUpperCase()

        let tipoNormalizado = null
        if (tipoRaw === 'SOCIO') tipoNormalizado = 'SOCIO'
        if (tipoRaw === 'APORTANTE') tipoNormalizado = 'APORTANTE'

        return {
          periodo: periodoDate,
          rut: String(row.Rut || '').replace(/\D/g, ''),
          nombre: row.Nombre || '',
          tipo: tipoNormalizado,
          valor_pagado: Number(row['Valor Pagado'] || 0),
          estado: 'pendiente',
          estado_validacion: 'pendiente'
        }
      })

      const { error: insertError } = await supabase
        .from('cuotas_importacion')
        .insert(rows)

      if (insertError) throw insertError

      setSuccess('Archivo procesado correctamente')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error procesando el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Masiva de Cuotas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        <div>
          <label className="block mb-2 font-medium">
            Período (YYYY-MM)
          </label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Archivo Excel
          </label>
          <Input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
          />
        </div>

        <Button onClick={handleProcess} disabled={loading}>
          {loading ? 'Procesando...' : 'Procesar Excel'}
        </Button>
      </CardContent>
    </Card>
  )
}
