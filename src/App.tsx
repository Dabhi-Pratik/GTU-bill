import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GenerateBill from './pages/GenerateBill';
import PreviousBills from './pages/PreviousBills';
import Settings from './pages/Settings';
import { GraduationCap } from 'lucide-react';

type AuthPage = 'login' | 'register' | 'forgot-password';
type AppPage = 'dashboard' | 'generate' | 'bills' | 'settings';

function AuthRouter() {
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const navigate = (page: string) => setAuthPage(page as AuthPage);

  if (authPage === 'register') return <Register onNavigate={navigate} />;
  if (authPage === 'forgot-password') return <ForgotPassword onNavigate={navigate} />;
  return <Login onNavigate={navigate} />;
}

function AppRouter() {
  const [page, setPage] = useState<AppPage>('dashboard');
  const navigate = (p: string) => setPage(p as AppPage);

  return (
    <Layout currentPage={page} onNavigate={navigate}>
      {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
      {page === 'generate' && <GenerateBill />}
      {page === 'bills' && <PreviousBills />}
      {page === 'settings' && <Settings />}
    </Layout>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <AppRouter /> : <AuthRouter />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
