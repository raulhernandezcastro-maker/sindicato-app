import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Alert } from '../ui/alert'
import { Spinner } from '../ui/spinner'

export function CargaCuotasExcel() {
  const [periodo, setPeriodo] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const normalizarRut = (rut) =>
    String(rut).replace(/\D/g, '')

  const handleProcesarExcel = async () => {
    if (!file || !periodo) {
      setError('Debes seleccionar un período y un archivo Excel')
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

      if (rows.length === 0) {
        throw new Error('El archivo Excel está vacío')
      }

      const filasProcesadas = []

      for (const row of rows) {
        const rut = normalizarRut(row.Rut)
        const nombre = row.Nombre || ''
        const tipo = row.Tipo || ''
        const valor = Number(row['Valor pagado'] || 0)

        if (!rut || !valor) continue

        // Buscar en socios
        const { data: socio } = await supabase
          .from('socios')
          .select('id, activo')
          .eq('rut', rut)
          .maybeSingle()

        // Buscar en aportantes
        const { data: aportante } = await supabase
          .from('aportantes')
          .select('id')
          .eq('rut', rut)
          .maybeSingle()

        let estado = 'NO EXISTE'
        let entidad = null

        if (socio) {
          estado = socio.activo ? 'SOCIO ACTIVO' : 'SOCIO INACTIVO'
          entidad = 'socio'
        } else if (aportante) {
          estado = 'APORTANTE'
          entidad = 'aportante'
        }

        filasProcesadas.push({
          rut,
          nombre,
          tipo,
          valor_pagado: valor,
          estado,
          entidad
        })
      }

      // Guardar importación (PERSISTENTE)
      const { error: insertError } = await supabase
        .from('cuotas_importacion')
        .insert({
          periodo,
          estado: 'pendiente',
          filas: filasProcesadas
        })

      if (insertError) throw insertError

      setSuccess(
        `Carga realizada correctamente (${filasProcesadas.length} registros). 
         Quedó guardada como PENDIENTE.`
      )
      setFile(null)
      setPeriodo('')
    } catch (err) {
      console.error(err)
      setError('Error procesando el Excel')
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
          <Label>Período (YYYY-MM)</Label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>

        <div>
          <Label>Archivo Excel</Label>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <Button onClick={handleProcesarExcel} disabled={loading}>
          {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
          Procesar Excel
        </Button>
      </CardContent>
    </Card>
  )
}
