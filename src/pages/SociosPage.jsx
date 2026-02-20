import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { Badge } from '../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

export default function SociosPage() {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        email,
        roles (
          role_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando socios:', error)
      setSocios([])
    } else {
      setSocios(data || [])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Socios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {socios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {s.roles.map((r) => (
                      <Badge key={r.role_name} className="mr-1">
                        {r.role_name}
                      </Badge>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {socios.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              No hay socios para mostrar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
