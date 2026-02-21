import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  const initialized = useRef(false)

  useEffect(() => {
    let isMounted = true

    const clearAuth = () => {
      if (!isMounted) return
      setUser(null)
      setProfile(null)
      setRoles([])
    }

    const loadUserData = async (userId) => {
      try {
        // 🔹 Perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError
        if (isMounted) setProfile(profileData)

        // 🔹 Roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('role_name')
          .eq('user_id', userId)

        if (rolesError) throw rolesError

        const roleNames = (rolesData || []).map(r => r.role_name)
        if (isMounted) setRoles(roleNames)
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
        if (isMounted) setLoading(false)
        initialized.current = true
      }
    }

    init()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!initialized.current) return

        if (session?.user) {
          setUser(session.user)
          await loadUserData(session.user.id)
        } else {
          clearAuth()
        }

        if (isMounted) setLoading(false)
      }
    )

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  /* =========================
     PRIORIDAD REAL DE ROLES
     administrador > director > socio
     ========================= */

  const isAdministrador = roles.includes('administrador')
  const isDirector = !isAdministrador && roles.includes('director')
  const isSocio =
    !isAdministrador && !isDirector && roles.includes('socio')

  /* =========================
     AUTH ACTIONS
     ========================= */

  const signIn = async (email, password) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    if (error) throw error
    return data
  }

  // 🔥 SIGN OUT CORRECTO (rompe cache y sesión)
  const signOut = async () => {
    try {
      setLoading(true)

      await supabase.auth.signOut()

      // limpieza dura de estado
      setUser(null)
      setProfile(null)
      setRoles([])

      // 🔑 FORZAR salida REAL (evita sesión pegada)
      window.location.href = '/login'
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const value = {
    user,
    profile,
    roles,
    loading,

    signIn,
    signOut,

    // flags claros
    isAdministrador,
    isDirector,
    isSocio
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
