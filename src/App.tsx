import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { InspectionProvider } from "@/contexts/InspectionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginGerente from "./pages/LoginGerente";
import LoginVendedor from "./pages/LoginVendedor";
import Dashboard from "./pages/Dashboard";
import NewInspection from "./pages/NewInspection";
import GuidedInspection from "./pages/GuidedInspection";
import InspectionDetail from "./pages/InspectionDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InspectionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/gerente" element={<LoginGerente />} />
                <Route path="/login/vendedor" element={<LoginVendedor />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vistoria/nova"
                  element={
                    <ProtectedRoute>
                      <NewInspection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vistoria/guiada"
                  element={
                    <ProtectedRoute>
                      <GuidedInspection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vistoria/:id"
                  element={
                    <ProtectedRoute>
                      <InspectionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </InspectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
