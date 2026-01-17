import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.user) {
        setUser(data.session.user);
        await loadUserData(data.session.user.id);
      } else {
        clearAuth();
      }

      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id);
        } else {
          clearAuth();
        }
        setLoading(false);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const clearAuth = () => {
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const loadUserData = async (userId) => {
    try {
      // Perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }

      setProfile(profileData);

      // Roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('role_name')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Roles error:', rolesError);
        return;
      }

      setRoles(rolesData.map(r => r.role_name));
    } catch (err) {
      console.error('loadUserData error:', err);
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
    clearAuth();
  };

  const resetPassword = async (email) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  const hasRole = (roleName) => roles.includes(roleName);

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
    refreshProfile: () => loadUserData(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
