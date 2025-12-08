import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Briefcase, BarChart3, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useInspections } from '@/contexts/InspectionContext';
import { formatDateTime } from '@/lib/date-utils';
import { Helmet } from 'react-helmet-async';

export default function Profile() {
  const { user, logout } = useAuth();
  const { getUserInspectionStats } = useInspections();
  const navigate = useNavigate();

  const stats = getUserInspectionStats();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>Minha Conta</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-lg">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>

          <h1 className="text-2xl font-bold mb-6">Minha Conta</h1>

          {/* User Info */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{user.role}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-lg p-6 mb-6 animate-fade-in">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Estatísticas
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vistorias realizadas</span>
                <span className="font-semibold text-lg">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Este mês</span>
                <span className="font-semibold text-lg">{stats.thisMonth}</span>
              </div>
              {stats.lastInspection && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Última vistoria
                  </span>
                  <span className="text-sm">{formatDateTime(stats.lastInspection)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="outline" className="w-full" disabled>
              Alterar Senha
            </Button>
            
            <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sair da Conta
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
