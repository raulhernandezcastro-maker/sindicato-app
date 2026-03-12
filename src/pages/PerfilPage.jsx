import React, { useState, useEffect } from 'react'
import { Camera, User, Lock, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Alert } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-t-lg"
       style={{ backgroundColor: '#2d7a4f' }}>
    <Icon className="w-4 h-4 text-white" />
    <span className="font-semibold text-white text-sm">{title}</span>
  </div>
)

export default function PerfilPage() {
  const { profile, roles, user, refreshProfile } = useAuth()

  const [formData, setFormData] = useState({ nombre: '', telefono: '' })
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })

  const [savingProfile, setSavingProfile]   = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPhoto, setSavingPhoto]       = useState(false)

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({ nombre: profile.nombre || '', telefono: profile.telefono || '' })
    }
  }, [profile])

  const clearMessages = () => { setError(''); setSuccess('') }

  /* ── Perfil ── */
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    clearMessages()
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nombre: formData.nombre, telefono: formData.telefono })
        .eq('id', user.id)
      if (error) {
        setError('Error al actualizar el perfil: ' + error.message)
      } else {
        setSuccess('Perfil actualizado correctamente')
        // Recargar perfil en contexto sin cerrar sesión
        if (refreshProfile) await refreshProfile()
      }
    } catch (err) {
      setError('Error inesperado al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  /* ── Contraseña ── */
  const handlePasswordUpdate = async (e) => {
    e.preventDefault(); clearMessages(); setSavingPassword(true)
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden'); setSavingPassword(false); return
    }
    const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword })
    if (error) { setError('Error al cambiar la contraseña') }
    else { setPasswordData({ newPassword: '', confirmPassword: '' }); setSuccess('Contraseña actualizada correctamente') }
    setSavingPassword(false)
  }

  /* ── Foto ── */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    clearMessages(); setSavingPhoto(true)
    const ext  = file.name.split('.').pop()
    const path = `${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { setError('Error al subir la foto'); setSavingPhoto(false); return }
    const { error: updateError } = await supabase.from('profiles').update({ foto_url: path }).eq('id', user.id)
    if (updateError) { setError('Error al guardar la foto') }
    else { setSuccess('Foto actualizada correctamente'); refreshProfile?.().catch(() => {}) }
    setSavingPhoto(false)
  }

  const getInitials = (nombre) =>
    nombre ? nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'

  const getRoleLabel = (r) =>
    r === 'administrador' ? 'Administrador' : r === 'director' ? 'Director' : 'Socio'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Título ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg"
           style={{ backgroundColor: '#2d7a4f' }}>
        <User className="w-5 h-5 text-white" />
        <h1 className="text-xl font-bold text-white">Mi Perfil</h1>
      </div>

      {error   && <Alert variant="destructive">{error}</Alert>}
      {success && <Alert>{success}</Alert>}

      {/* ── Foto ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={Camera} title="Foto de Perfil" />
        <div className="p-5 flex items-center gap-6" style={{ backgroundColor: '#f0f9f2' }}>
          <Avatar className="w-20 h-20 border-2" style={{ borderColor: '#2d7a4f' }}>
            <AvatarImage
              src={
                profile?.foto_url
                  ? supabase.storage.from('avatars').getPublicUrl(profile.foto_url).data.publicUrl
                  : undefined
              }
            />
            <AvatarFallback style={{ backgroundColor: '#7CBE80', color: '#003d18', fontSize: 22, fontWeight: 700 }}>
              {getInitials(profile?.nombre)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm mb-1">{profile?.nombre}</p>
            <div className="flex gap-1 flex-wrap mb-3">
              {roles.map(r => (
                <Badge key={r} style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
                  {getRoleLabel(r)}
                </Badge>
              ))}
            </div>
            <Label htmlFor="photo" className="cursor-pointer">
              <Button disabled={savingPhoto} asChild size="sm"
                      style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  {savingPhoto ? 'Subiendo...' : 'Cambiar Foto'}
                </span>
              </Button>
            </Label>
            <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
      </div>

      {/* ── Datos personales ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={User} title="Datos Personales" />
        <div className="p-5" style={{ backgroundColor: '#f0f9f2' }}>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+56912345678"
              />
            </div>
            <Button disabled={savingProfile} style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
              {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </div>
      </div>

      {/* ── Cambiar contraseña ── */}
      <div className="rounded-lg border overflow-hidden">
        <SectionHeader icon={Lock} title="Cambiar Contraseña" />
        <div className="p-5" style={{ backgroundColor: '#f0f9f2' }}>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordData.newPassword}
                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirmar contraseña</Label>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              />
            </div>
            <Button disabled={savingPassword} style={{ backgroundColor: '#2d7a4f', color: 'white' }}>
              {savingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </form>
        </div>
      </div>

    </div>
  )
}
