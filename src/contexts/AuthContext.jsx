import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
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

  // 🔒 evita loops y estados colgados
  const initialized = useRef(false)

  useEffect(() => {
    let isMounted = true

    const safeSetLoadingFalse = () => {
      if (isMounted) setLoading(false)
    }

    const clearAuth = () => {
      if (!isMounted) return
      setUser(null)
      setProfile(null)
      setRoles([])
    }

    const loadUserData = async (userId) => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (isMounted) setProfile(profileData ?? null)

        const { data: rolesData } = await supabase
          .from('roles')
          .select('role_name')
          .eq('user_id', userId)

        if (isMounted) {
          setRoles((rolesData ?? []).map(r => r.role_name))
        }
      } catch (err) {
        console.error('Error loading profile/roles:', err)
        clearAuth()
      }
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        if (!isMounted) return

        if (data?.session?.user) {
          setUser(data.session.user)
          await loadUserData(data.session.user.id)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error('Auth init error:', err)
        clearAuth()
      } finally {
        safeSetLoadingFalse()
        initialized.current = true
      }
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!initialized.current) return

        try {
          if (session?.user) {
            setUser(session.user)
            await loadUserData(session.user.id)
          } else {
            clearAuth()
          }
        } catch (err) {
          console.error('Auth state change error:', err)
          clearAuth()
        } finally {
          safeSetLoadingFalse()
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setRoles([])
    setLoading(false)
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
