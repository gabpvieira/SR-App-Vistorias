import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Shield, CheckCircle2, FileCheck, UserCircle } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading enquanto verifica sessão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-red-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Acesso ao Sistema</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="description" content="Acesso restrito" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" style={{ backgroundColor: '#ffffff' }}>
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
            <Button asChild className="gap-2">
              <Link to="/login">
                <UserCircle className="h-4 w-4" />
                Fazer Login
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
          <div className="w-full max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Conteúdo Principal */}
              <div className="text-center lg:text-left space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="flex justify-center lg:justify-start">
                    <img 
                      src="/logo SR.png" 
                      alt="SR Caminhões" 
                      className="h-24 md:h-32 object-contain"
                    />
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Sistema de Vistorias
                    <span className="block text-red-600">
                      SR Caminhões
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    Plataforma completa para gestão de vistorias. 
                    Controle total, precisão e eficiência em cada inspeção.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg" className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Link to="/login" className="gap-2">
                      <UserCircle className="h-5 w-5" />
                      Acessar Sistema
                    </Link>
                  </Button>
                </div>

                {/* Mockup Image - Mobile */}
                <div className="lg:hidden relative w-full max-w-md mx-auto">
                  <img 
                    src="/MOCKUP-LP.png" 
                    alt="SR Caminhões - Sistema de Vistorias" 
                    className="w-full h-auto object-contain animate-fade-in"
                  />
                </div>

                {/* Features em destaque */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                      <FileCheck className="h-5 w-5 text-white dark:text-slate-900" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Vistorias Completas
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Registro detalhado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white dark:text-slate-900" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Controle Total
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Gestão centralizada
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white dark:text-slate-900" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Acesso Seguro
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Apenas autorizados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual/Imagem lado direito - Desktop */}
              <div className="hidden lg:block relative">
                <div className="relative w-full">
                  {/* Mockup Image */}
                  <img 
                    src="/MOCKUP-LP.png" 
                    alt="SR Caminhões - Sistema de Vistorias" 
                    className="w-full h-auto object-contain animate-fade-in"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 px-6 border-t border-slate-200" style={{ backgroundColor: '#ffffff' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-slate-600">
                SR CAMINHÕES LTDA
              </p>
              <p className="text-xs text-slate-500">
                CNPJ 19.944.530/0001-16
              </p>
              <p className="text-xs text-slate-500">
                © 2025 Todos os direitos reservados
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
