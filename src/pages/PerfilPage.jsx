import React, { useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import {
  Card, CardHeader, CardTitle, CardContent
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Alert } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'

export function PerfilPage() {
  const { profile, refreshProfile, roles, user } = useAuth()

  const [formData, setFormData] = useState({ nombre: '', telefono: '' })
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || '',
        telefono: profile.telefono || ''
      })
    }
  }, [profile])

  /* ================= PERFIL ================= */

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSavingProfile(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: formData.nombre,
          telefono: formData.telefono
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setSuccess('Perfil actualizado correctamente')
    } catch (err) {
      console.error(err)
      setError('Error al actualizar el perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  /* ================= CONTRASEÑA ================= */

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSavingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      setPasswordData({ newPassword: '', confirmPassword: '' })
      setSuccess('Contraseña actualizada correctamente')
    } catch (err) {
      console.error(err)
      setError('Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  /* ================= FOTO ================= */

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setSavingPhoto(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: path })
        .eq('id', user.id)

      if (updateError) throw updateError

      await refreshProfile()
      setSuccess('Foto de perfil actualizada correctamente')
    } catch (err) {
      console.error(err)
      setError('Error al subir la foto')
    } finally {
      setSavingPhoto(false)
    }
  }

  const getInitials = (nombre) =>
    nombre ? nombre.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'

  const getRoleLabel = (r) =>
    r === 'administrador' ? 'Administrador' :
    r === 'director' ? 'Director' : 'Socio'

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>

        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert>{success}</Alert>}

        {/* FOTO */}
        <Card>
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={
                  profile?.foto_url
                    ? supabase.storage.from('avatars').getPublicUrl(profile.foto_url).data.publicUrl
                    : undefined
                }
              />
              <AvatarFallback>{getInitials(profile?.nombre)}</AvatarFallback>
            </Avatar>

            <Label htmlFor="photo" className="cursor-pointer">
              <Button disabled={savingPhoto} asChild>
                <span><Camera className="w-4 h-4 mr-2" /> Cambiar Foto</span>
              </Button>
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoUpload}
            />
          </CardContent>
        </Card>

        {/* DATOS */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                placeholder="Nombre"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
              />
              <Input
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
              />
              <Button disabled={savingProfile}>
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* CONTRASEÑA */}
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                type="password"
                placeholder="Nueva contraseña"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
              <Button disabled={savingPassword}>
                {savingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {roles.map(r => <Badge key={r}>{getRoleLabel(r)}</Badge>)}
        </div>
      </div>
    </AppLayout>
  )
}
