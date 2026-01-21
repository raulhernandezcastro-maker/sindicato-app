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

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!mounted) return

        if (data?.session?.user) {
          setUser(data.session.user)
          await loadUserProfile(data.session.user.id)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error('Auth init error:', err)
        clearAuth()
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            setUser(session.user)
            await loadUserProfile(session.user.id)
          } else {
            clearAuth()
          }
        } catch (err) {
          console.error('Auth state error:', err)
          clearAuth()
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const clearAuth = () => {
    setUser(null)
    setProfile(null)
    setRoles([])
  }

  const loadUserProfile = async (userId) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      const { data: rolesData } = await supabase
        .from('roles')
        .select('role_name')
        .eq('user_id', userId)

      if (rolesData) {
        setRoles(rolesData.map(r => r.role_name))
      } else {
        setRoles([])
      }
    } catch (err) {
      console.error('Error loading profile/roles:', err)
      setProfile(null)
      setRoles([])
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAuth()
  }

  const hasRole = (role) => roles.includes(role)

  const value = {
    user,
    profile,
    roles,
    loading,
    signIn,
    signOut,
    hasRole,
    isAdministrador: roles.includes('administrador'),
    isDirector: roles.includes('director'),
    isSocio: roles.length > 0,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
