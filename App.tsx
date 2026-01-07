import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Layout from './components/Layout'; // Import Layout component
import Dashboard from './components/Dashboard';
import Integrantes from './components/Integrantes';
import Convocacao from './components/Convocacao';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import Login from './components/Login'; // Import Login component
import { ViewState } from './types';
import { INITIAL_PROFILE } from './constants';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Auth State
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [userProfile, setUserProfile] = useState(INITIAL_PROFILE);
  const [openConvocationModal, setOpenConvocationModal] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(prev => ({
          ...prev,
          name: data.nome || prev.name,
          email: data.email || prev.email,
          systemRole: data.role as 'admin' | 'user'
        }));
      } else {
        // User authenticated in Supabase Auth but not in 'usuarios' table
        console.warn('Access Denied: User record not found.');
        alert('Acesso Negado: Seu usuário não possui permissão de acesso ou foi removido.');
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) fetchUserProfile(session.user.id);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentView('dashboard');
        setUserProfile(INITIAL_PROFILE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login Handler (can be empty now as auto-detected, but kept for props)
  const handleLogin = () => {
    // State is handled by onAuthStateChange
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // setIsAuthenticated(false); // handled by subscription
  };

  // If not authenticated, show Login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const getHeaderProps = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Visão Geral', subtitle: undefined };
      case 'members':
        return { title: 'Gerenciamento de Integrantes', subtitle: undefined };
      case 'convocation':
        return { title: 'Convocação', subtitle: undefined };
      case 'settings':
        return { title: 'Configurações', subtitle: 'Gerencie as preferências e configurações do sistema' };
      case 'notifications':
        return { title: 'Notificações', subtitle: 'Histórico de atividades e alertas do sistema' };
      default:
        return { title: 'Dashboard', subtitle: undefined };
    }
  };

  const headerProps = getHeaderProps();

  const handleOpenConvocation = () => {
    setCurrentView('convocation');
    setOpenConvocationModal(true);
  };

  return (
    <Layout
      currentView={currentView}
      onChangeView={setCurrentView}
      userProfile={userProfile}
      onOpenConvocation={handleOpenConvocation}
      onLogout={handleLogout}
      headerTitle={headerProps.title}
      headerSubtitle={headerProps.subtitle}
      onNotificationsClick={() => setCurrentView('notifications')}
    >
      {currentView === 'dashboard' && <Dashboard onChangeView={setCurrentView} />}
      {currentView === 'members' && <Integrantes />}
      {currentView === 'convocation' && (
        <Convocacao
          startWithModalOpen={openConvocationModal}
          onModalOpenHandled={() => setOpenConvocationModal(false)}
        />
      )}
      {currentView === 'settings' && <Settings userProfile={userProfile} />}
      {currentView === 'notifications' && <Notifications />}
    </Layout>
  );
}

export default App;