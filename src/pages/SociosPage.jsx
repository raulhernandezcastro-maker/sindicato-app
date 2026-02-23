import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Spinner } from '../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'

export default function SociosPage() {
  const { isAdministrador } = useAuth()

  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSocios()
  }, [])

  const loadSocios = async () => {
    setLoading(true)

    // 1️⃣ Traer perfiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, email, rut')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error profiles:', profilesError)
      setSocios([])
      setLoading(false)
      return
    }

    // 2️⃣ Traer roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('user_id, role_name')

    if (rolesError) {
      console.error('❌ Error roles:', rolesError)
      setSocios([])
      setLoading(false)
      return
    }

    // 3️⃣ Unir en memoria (ROBUSTO)
    const rolesByUser = rolesData.reduce((acc, r) => {
      if (!acc[r.user_id]) acc[r.user_id] = []
      acc[r.user_id].push(r.role_name)
      return acc
    }, {})

    const combined = profiles.map(p => ({
      ...p,
      roles: rolesByUser[p.id] || []
    }))

    setSocios(combined)
    setLoading(false)
  }

  const handleNuevoSocio = () => {
    alert('Formulario Nuevo Socio se implementa a continuación')
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Socios</CardTitle>

          {isAdministrador && (
            <Button onClick={handleNuevoSocio}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Socio
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {socios.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.rut || '-'}</TableCell>
                  <TableCell>
                    {s.roles.map(r => (
                      <Badge key={r} className="mr-1">
                        {r}
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
