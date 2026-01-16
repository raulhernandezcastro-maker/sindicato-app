import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('getSession error:', error);
          clearAuth();
        } else if (data?.session?.user) {
          setUser(data.session.user);
          await loadUserProfile(data.session.user.id);
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error('Auth init failed:', err);
        clearAuth();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            setUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            clearAuth();
          }
        } catch (err) {
          console.error('onAuthStateChange error:', err);
          clearAuth();
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const clearAuth = () => {
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const loadUserProfile = async (userId) => {
    try {
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
      console.error('loadUserProfile failed:', err);
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
    refreshProfile: () => loadUserProfile(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
