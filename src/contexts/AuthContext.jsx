import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      setLoading(true)

      const { data } = await supabase.auth.getSession()

      if (data?.session?.user) {
        const u = data.session.user
        setUser(u)

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single()

        const { data: rolesData } = await supabase
          .from('roles')
          .select('role_name')
          .eq('user_id', u.id)

        setProfile(profileData || null)
        setRoles((rolesData || []).map(r => r.role_name))
      } else {
        clearAuth()
      }

      setLoading(false)
    }

    init()
  }, [])

  // ================= HELPERS =================
  const clearAuth = () => {
    setUser(null)
    setProfile(null)
    setRoles([])
  }

  // ================= AUTH =================
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    // 🔥 CIERRE DURO Y DEFINITIVO
    await supabase.auth.signOut()
    clearAuth()

    // 🔑 REINICIO TOTAL DE LA APP
    window.location.reload()
  }

  const value = {
    user,
    profile,
    roles,
    loading,
    signIn,
    signOut,
    isAdministrador: roles.includes('administrador'),
    isDirector: roles.includes('director'),
    isSocio: roles.includes('socio'),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
