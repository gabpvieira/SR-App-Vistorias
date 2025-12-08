import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserX, UserCheck, Mail, User as UserIcon, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, deactivateUser, activateUser } from '@/lib/supabase-queries';
import { User } from '@/lib/supabase';
import { formatDateTime } from '@/lib/date-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function UserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'gerente') {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleUserStatus(userId: string, userName: string, currentStatus: boolean) {
    if (userId === user?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode desativar sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingId(userId);
      
      if (currentStatus) {
        // Desativar usuário
        await deactivateUser(userId);
        toast({
          title: 'Usuário desativado',
          description: `${userName} foi desativado. O histórico de vistorias foi preservado.`,
        });
      } else {
        // Ativar usuário
        await activateUser(userId);
        toast({
          title: 'Usuário reativado',
          description: `${userName} foi reativado e pode acessar o sistema novamente.`,
        });
      }
      
      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  }

  if (user?.role !== 'gerente') {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Usuários</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione, edite ou remova usuários do sistema
              </p>
            </div>
            
            <Button onClick={() => navigate('/usuarios/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>

          {loading ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground mb-4">Nenhum usuário cadastrado</p>
              <Button onClick={() => navigate('/usuarios/novo')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeiro usuário
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Nome</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">E-mail</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Cargo</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-foreground hidden lg:table-cell">Criado em</th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="h-5 w-5 text-primary" />
                              </div>
                              <p className="font-medium text-foreground">{u.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className={`text-sm font-medium ${
                                u.role === 'gerente' ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {u.role === 'gerente' ? 'Administrador' : 'Vendedor'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              u.is_active 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {u.is_active ? (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Ativo
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Inativo
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span className="text-sm">{formatDateTime(u.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={u.is_active ? "ghost" : "outline"}
                                  size="sm"
                                  disabled={processingId === u.id || u.id === user?.id}
                                >
                                  {u.is_active ? (
                                    <>
                                      <UserX className="h-4 w-4 text-destructive" />
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 text-green-600" />
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {u.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.is_active ? (
                                      <>
                                        Tem certeza que deseja desativar <strong>{u.name}</strong>?
                                        O usuário não poderá mais acessar o sistema, mas todo o histórico de vistorias será preservado.
                                      </>
                                    ) : (
                                      <>
                                        Tem certeza que deseja reativar <strong>{u.name}</strong>?
                                        O usuário poderá acessar o sistema novamente.
                                      </>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleToggleUserStatus(u.id, u.name, u.is_active)}
                                    className={u.is_active 
                                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      : "bg-green-600 text-white hover:bg-green-700"
                                    }
                                  >
                                    {u.is_active ? 'Desativar' : 'Reativar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="bg-card border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">{u.name}</p>
                          {u.role === 'gerente' && (
                            <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.is_active 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3" />
                              Inativo
                            </>
                          )}
                        </span>
                      </div>

                      {/* Toggle Status Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={u.is_active ? "ghost" : "outline"}
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            disabled={processingId === u.id || u.id === user?.id}
                          >
                            {u.is_active ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {u.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {u.is_active ? (
                                <>
                                  Tem certeza que deseja desativar <strong>{u.name}</strong>?
                                  O histórico de vistorias será preservado.
                                </>
                              ) : (
                                <>
                                  Tem certeza que deseja reativar <strong>{u.name}</strong>?
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="m-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleUserStatus(u.id, u.name, u.is_active)}
                              className={`m-0 ${u.is_active 
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {u.is_active ? 'Desativar' : 'Reativar'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
