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
    let cancelled = false

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error
        if (cancelled) return

        if (data?.session?.user) {
          setUser(data.session.user)
          await loadUserProfile(data.session.user.id)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error('AUTH INIT ERROR:', err)
        clearAuth()
      } finally {
        if (!cancelled) setLoading(false)
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
          console.error('AUTH STATE ERROR:', err)
          clearAuth()
        } finally {
          setLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_name')
        .eq('user_id', userId)

      if (rolesError) throw rolesError
      setRoles(rolesData.map(r => r.role_name))
    } catch (err) {
      console.error('PROFILE/ROLE LOAD ERROR:', err)
      clearAuth()
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
