import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Header } from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createUser } from '@/lib/supabase-queries';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function CreateUser() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'vendedor' as 'vendedor' | 'gerente',
  });

  if (user?.role !== 'gerente') {
    navigate('/dashboard');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await createUser(formData);
      
      toast({
        title: 'Usuário criado',
        description: `${formData.name} foi adicionado ao sistema`,
      });

      navigate('/usuarios');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = 'Não foi possível criar o usuário';
      if (error.message?.includes('already registered')) {
        errorMessage = 'Este e-mail já está cadastrado';
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'E-mail inválido';
      }

      toast({
        title: 'Erro ao criar usuário',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Novo Usuário - SR Caminhões</title>
      </Helmet>

      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="container px-4 py-6 max-w-2xl">
          <button
            onClick={() => navigate('/usuarios')}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>

          <div className="bg-card border border-border rounded-lg p-6">
            <h1 className="text-2xl font-bold text-foreground mb-6">Adicionar Novo Usuário</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  A senha deve ter no mínimo 8 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Cargo</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'vendedor' | 'gerente') =>
                    setFormData({ ...formData, role: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="gerente">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/usuarios')}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
