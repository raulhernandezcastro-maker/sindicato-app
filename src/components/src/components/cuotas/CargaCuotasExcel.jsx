import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'

export function CargaCuotasExcel({ onDataLoaded }) {
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])

  const handleFile = async (e) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      // Normalización básica
      const parsed = json.map(row => ({
        rut: String(row.rut || '').trim(),
        nombre: String(row.nombre || '').trim(),
        tipo: String(row.tipo || '').toUpperCase().trim(),
        valor_pagado: Number(row.valor_pagado || 0)
      }))

      setRows(parsed)
      onDataLoaded(parsed)
    } catch (err) {
      console.error(err)
      setError('Error al leer el archivo Excel')
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}

      <Input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
      />

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {rows.length} registros cargados desde el Excel
        </p>
      )}
    </div>
  )
}
