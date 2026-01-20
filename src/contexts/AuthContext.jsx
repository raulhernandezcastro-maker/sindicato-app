import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  const clearAuth = () => {
    setUser(null)
    setProfile(null)
    setRoles([])
  }

  const loadProfileAndRoles = async (userId) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
      } else {
        setProfile(profileData)
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_name')
        .eq('user_id', userId)

      if (rolesError) {
        console.error('Error loading roles:', rolesError)
      } else {
        const roleNames = rolesData.map(r => r.role_name)
        setRoles(roleNames)
      }

    } catch (err) {
      console.error('Unexpected error loading profile/roles:', err)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await loadProfileAndRoles(session.user.id)
        } else {
          clearAuth()
        }
      } catch (err) {
        console.error('Init auth error:', err)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true)

        if (session?.user) {
          setUser(session.user)
          await loadProfileAndRoles(session.user.id)
        } else {
          clearAuth()
        }

        setLoading(false)
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    clearAuth()
  }

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email)
  }

  const hasRole = (roleName) => roles.includes(roleName)

  const value = {
    user,
    profile,
    roles,
    loading,
    signIn,
    signOut,
    resetPassword,
    hasRole,
    isAdministrador: roles.includes('administrador'),
    isDirector: roles.includes('director'),
    isSocio: roles.length > 0,
    refreshProfile: () => user && loadProfileAndRoles(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
