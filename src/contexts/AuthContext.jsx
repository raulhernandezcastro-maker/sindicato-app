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
        // Perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError
        if (isMounted) setProfile(profileData)

        // Roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('role_name')
          .eq('user_id', userId)

        if (rolesError) throw rolesError

        const roleNames = (rolesData || []).map(r => r.role_name)
        if (isMounted) setRoles(roleNames)

        // 🔎 LOGS SEGUROS (NO ROMPEN LA APP)
        console.log('[AUTH] UID:', userId)
        console.log('[AUTH] ROLES:', roleNames)
      } catch (err) {
        console.error('[AUTH] Error loading profile/roles:', err)
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
        console.error('[AUTH] Init error:', err)
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
     Un usuario puede tener múltiples roles.
     isAdministrador y isDirector pueden ser true al mismo tiempo
     si el usuario tiene ambos roles, pero para efectos de permisos
     el administrador tiene la máxima prioridad.
     ========================= */

  const isAdministrador = roles.includes('administrador')
  const isDirector = roles.includes('director')
  const isSocio = roles.includes('socio')

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

  const signOut = async () => {
    try {
      setLoading(true)

      await supabase.auth.signOut()

      clearTimeout(() => {}) // evita micro race en algunos navegadores

      setUser(null)
      setProfile(null)
      setRoles([])

      // 🔑 salida real, sin sesión pegada
      window.location.replace('/login')
    } catch (err) {
      console.error('[AUTH] SignOut error:', err)
    }
  }

  const value = {
    user,
    profile,
    roles,
    loading,

    signIn,
    signOut,

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
