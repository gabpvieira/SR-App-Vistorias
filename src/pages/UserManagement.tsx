import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Mail, User as UserIcon, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, deleteUser } from '@/lib/supabase-queries';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDeleteUser(userId: string, userName: string) {
    if (userId === user?.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode deletar sua própria conta',
        variant: 'destructive',
      });
      return;
    }

    try {
      setDeletingId(userId);
      await deleteUser(userId);
      toast({
        title: 'Usuário deletado',
        description: `${userName} foi removido do sistema`,
      });
      await loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: 'Erro ao deletar',
        description: 'Não foi possível deletar o usuário',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (user?.role !== 'gerente') {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Usuários - SR Caminhões</title>
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-6xl">
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
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingId === u.id || u.id === user?.id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar o usuário <strong>{u.name}</strong>?
                                    Esta ação não pode ser desfeita e o usuário perderá imediatamente o acesso ao sistema.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Deletar Usuário
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
                      </div>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            disabled={deletingId === u.id || u.id === user?.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja deletar o usuário <strong>{u.name}</strong>?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="m-0">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 m-0"
                            >
                              Deletar
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
