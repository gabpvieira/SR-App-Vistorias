import { Link, useNavigate } from 'react-router-dom';
import { Menu, Plus, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const panelTitle = user?.role === 'gerente' ? 'Painel do Administrador' : 'Painel do Vendedor';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center">
            <Logo size="sm" showText={false} className="md:hidden" />
            <Logo size="sm" className="hidden md:flex" />
          </Link>
          <div className="hidden lg:block border-l border-border pl-4 h-8 flex items-center">
            <span className="text-sm font-medium text-muted-foreground">{panelTitle}</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Button asChild>
            <Link to="/vistoria/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Vistoria
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Minha Conta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <Button asChild size="icon">
            <Link to="/vistoria/nova">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 mt-6">
                <div className="border-b border-border pb-4">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role}
                  </p>
                </div>

                <nav className="flex flex-col gap-2">
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/vistoria/nova">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Vistoria
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start">
                    <Link to="/perfil">
                      <User className="h-4 w-4 mr-2" />
                      Minha Conta
                    </Link>
                  </Button>
                </nav>

                <Button variant="outline" onClick={handleLogout} className="mt-auto">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
