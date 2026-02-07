import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'

export default function CargaCuotasExcel({ onProcessed }) {
  const [file, setFile] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleProcess = async () => {
    if (!file || !periodo) {
      setError('Debes seleccionar archivo y período')
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      const filas = rows.map(r => ({
        rut: String(r.Rut).trim(),
        nombre: r.Nombre || '',
        tipo: r.Tipo || 'SOCIO',
        valor_pagado: Number(r['Valor pagado']) || 0,
        estado: 'PENDIENTE'
      }))

      const { error: insertError } = await supabase
        .from('cuotas_importacion')
        .insert({
          periodo,
          estado: 'pendiente',
          filas
        })

      if (insertError) throw insertError

      setSuccess('Archivo procesado correctamente')
      setFile(null)
      onProcessed?.()

    } catch (err) {
      console.error(err)
      setError('Error al procesar el Excel')
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

        <Input
          placeholder="Periodo (YYYY-MM)"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
        />

        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={e => setFile(e.target.files[0])}
        />

        <Button onClick={handleProcess} disabled={loading}>
          {loading ? 'Procesando...' : 'Procesar Excel'}
        </Button>
      </CardContent>
    </Card>
  )
}
