import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      console.log('AuthProvider: init start');

      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('AuthProvider: getSession result:', data, error);

        const session = data?.session;

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('AuthProvider: init error', e);
        setUser(null);
      } finally {
        console.log('AuthProvider: setting loading false');
        setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthProvider: auth state changed', session);

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
