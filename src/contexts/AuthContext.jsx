import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔐 LOGIN TEMPORAL ADMIN (solo mientras no exista BD visible)
    const tempAdmin = localStorage.getItem('tempAdmin');
    if (tempAdmin) {
      const parsed = JSON.parse(tempAdmin);
      setUser(parsed);
      setRoles(parsed.roles || ['socio', 'administrador']);
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
      } catch (error) {
        console.error('AuthProvider: Error checking session', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      // 1️⃣ Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      setProfile(profileData);

      // 2️⃣ Roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_name')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error loading roles:', rolesError);
        return;
      }

      // 3️⃣ Si NO tiene roles → crearlos automáticamente
      if (!rolesData || rolesData.length === 0) {
        const newRoles = [{ user_id: userId, role_name: 'socio' }];

        if (profileData.email === 'admin@sindicato.cl') {
          newRoles.push({ user_id: userId, role_name: 'administrador' });
        }

        await supabase.from('roles').insert(newRoles);
        setRoles(newRoles.map(r => r.role_name));
        return;
      }

      // 4️⃣ Roles existentes
      setRoles(rolesData.map(r => r.role_name));

    } catch (error) {
      console.error('AuthProvider: Error in loadUserProfile', error);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoles([]);
    localStorage.removeItem('tempAdmin');
  };

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  // ✅ ROLES CLAROS Y SIMPLES
  const isAdministrador = roles.includes('administrador');
  const isDirector = roles.includes('director');
  const isSocio = roles.length > 0;

  // ✅ Función auxiliar para verificar roles
  const hasRole = (roleName) => {
    return roles.includes(roleName);
  };

  const value = {
    user,
    profile,
    roles,
    loading,
    signIn,
    signOut,
    resetPassword,
    isAdministrador,
    isDirector,
    isSocio,
    hasRole,
    refreshProfile: () => loadUserProfile(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
