import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { Shield, CheckCircle2, FileCheck, ShieldCheck, UserCircle } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>SR Caminhões - Sistema de Vistorias</title>
        <meta name="description" content="Sistema interno da SR Caminhões para gestão de vistorias de veículos seminovos. Acesso exclusivo para colaboradores autorizados." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/login/vendedor">
                <UserCircle className="h-4 w-4" />
                Vendedor
              </Link>
            </Button>
            <Button asChild className="gap-2">
              <Link to="/login/gerente">
                <ShieldCheck className="h-4 w-4" />
                Gerente
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
                      src="/midia/logo SR.png" 
                      alt="SR Caminhões" 
                      className="h-24 md:h-32 object-contain"
                    />
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                    Sistema de
                    <span className="block bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                      Vistorias Premium
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    Plataforma profissional para gestão completa de vistorias de veículos seminovos. 
                    Controle total, precisão e eficiência em cada inspeção.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Link to="/login/vendedor" className="gap-2">
                      <UserCircle className="h-5 w-5" />
                      Acesso Vendedor
                    </Link>
                  </Button>
                  <Button asChild size="lg" className="h-14 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                    <Link to="/login/gerente" className="gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      Acesso Gerente
                    </Link>
                  </Button>
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

              {/* Visual/Imagem lado direito */}
              <div className="hidden lg:block relative">
                <div className="relative w-full aspect-square">
                  {/* Decorative elements */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5 dark:from-white/5 dark:to-slate-400/5 rounded-3xl rotate-6 scale-105"></div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-600/5 to-slate-900/5 dark:from-slate-400/5 dark:to-white/5 rounded-3xl -rotate-6 scale-105"></div>
                  
                  {/* Main card */}
                  <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          Dashboard
                        </h3>
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                            <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2024 SR Caminhões. Uso exclusivo interno.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Acesso Restrito
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
