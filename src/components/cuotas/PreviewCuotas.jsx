import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import { guardarCuotasDesdeExcel } from '../../services/guardarCuotasDesdeExcel'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Alert } from '../ui/alert'

export default function CargaCuotasExcel() {
  const [archivo, setArchivo] = useState(null)
  const [periodo, setPeriodo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const leerExcel = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)
        resolve(json)
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleProcesar = async () => {
    if (!archivo || !periodo) {
      setError('Debes seleccionar archivo y período')
      return
    }

    setError('')
    setLoading(true)
    setResultado(null)

    try {
      const filas = await leerExcel(archivo)
      const res = await guardarCuotasDesdeExcel(filas, periodo)
      setResultado(res)
    } catch (err) {
      console.error(err)
      setError('Error procesando el archivo')
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

        <div>
          <label className="text-sm font-medium">Período (YYYY-MM)</label>
          <Input
            placeholder="2025-01"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Archivo Excel</label>
          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArchivo(e.target.files[0])}
          />
        </div>

        <Button onClick={handleProcesar} disabled={loading}>
          {loading ? 'Procesando…' : 'Procesar Excel'}
        </Button>

        {resultado && (
          <div className="space-y-2 text-sm mt-4">
            <p>✅ Guardadas: {resultado.guardadas.length}</p>
            <p>⚠️ RUT no existe: {resultado.rutNoExiste.length}</p>
            <p>⛔ RUT inactivo: {resultado.rutInactivo.length}</p>
            <p>❌ Errores: {resultado.errores.length}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
