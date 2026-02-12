import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'

export default function CargaCuotasExcel({ onFinish }) {
  const [periodo, setPeriodo] = useState('')
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const normalizarMonto = (valor) => {
    if (!valor) return 0
    return Number(
      String(valor)
        .replace(/\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '')
        .trim()
    )
  }

  const handleProcess = async () => {
    if (!file || !periodo) {
      setError('Debe seleccionar período y archivo')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)

      if (!rows.length) {
        throw new Error('El archivo no tiene registros')
      }

      // 🔹 Limpiar importación previa del mismo período
      await supabase
        .from('cuotas_importacion')
        .delete()
        .eq('periodo', `${periodo}-01`)

      const registros = rows.map(r => ({
        periodo: `${periodo}-01`,
        rut: String(r.rut).trim(),
        nombre: String(r.nombre).trim(),
        tipo: String(r.tipo).toUpperCase(),
        valor_pagado: normalizarMonto(r.valor_pagado),
        estado: 'pendiente',
        estado_validacion: 'pendiente'
      }))

      // 🔹 Validar duplicados dentro del mismo archivo
      const keys = new Set()
      for (const r of registros) {
        const key = `${r.rut}-${r.periodo}`
        if (keys.has(key)) {
          throw new Error(`Duplicado en Excel: RUT ${r.rut}`)
        }
        keys.add(key)
      }

      const { error: insertError } = await supabase
        .from('cuotas_importacion')
        .insert(registros)

      if (insertError) throw insertError

      setSuccess(`Se importaron ${registros.length} registros correctamente`)
      setPeriodo('')
      setFile(null)

      if (onFinish) onFinish()

    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al procesar archivo')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga masiva de cuotas (Excel)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        <Input
          type="month"
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
        />

        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={e => setFile(e.target.files[0])}
        />

        <Button onClick={handleProcess} disabled={processing}>
          {processing ? 'Procesando...' : 'Procesar Excel'}
        </Button>
      </CardContent>
    </Card>
  )
}
