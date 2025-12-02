import { Link, useNavigate } from 'react-router-dom';
import { Menu, Plus, User, LogOut, Users } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Left Section - Desktop */}
        <div className="hidden md:flex items-center gap-3 flex-1">
          <Button asChild variant="default">
            <Link to="/vistoria/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Vistoria
            </Link>
          </Button>
        </div>

        {/* Left Section - Mobile (Menu) */}
        <div className="flex md:hidden items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="flex flex-col gap-6 mt-6">
                <div className="border-b border-border pb-4">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {user?.role === 'gerente' ? 'Administrador' : 'Vendedor'}
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
                  {user?.role === 'gerente' && (
                    <Button asChild variant="ghost" className="justify-start">
                      <Link to="/usuarios">
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Usuários
                      </Link>
                    </Button>
                  )}
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

        {/* Center Section - Logo */}
        <div className="flex-1 flex justify-center md:flex-initial">
          <Link to="/dashboard" className="flex items-center">
            <Logo size="sm" showText={false} className="md:hidden" />
            <Logo size="sm" className="hidden md:flex" />
          </Link>
        </div>

        {/* Right Section - Desktop */}
        <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {user?.role === 'gerente' ? 'Administrador' : 'Vendedor'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  Minha Conta
                </Link>
              </DropdownMenuItem>
              {user?.role === 'gerente' && (
                <DropdownMenuItem asChild>
                  <Link to="/usuarios" className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Usuários
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right Section - Mobile (New Inspection) */}
        <div className="flex md:hidden items-center">
          <Button asChild size="icon" variant="default">
            <Link to="/vistoria/nova">
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
