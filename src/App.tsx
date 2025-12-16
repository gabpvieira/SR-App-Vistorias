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
import Dashboard from "./pages/Dashboard";
import NewInspection from "./pages/NewInspection";
import GuidedInspection from "./pages/GuidedInspection";
import InspectionDetail from "./pages/InspectionDetail";
import ActivityFreeInspection from "./pages/ActivityFreeInspection";
import ActivityGuidedInspection from "./pages/ActivityGuidedInspection";
import ActivityView from "./pages/ActivityView";
import Profile from "./pages/Profile";
import UserManagement from "./pages/UserManagement";
import CreateUser from "./pages/CreateUser";
import Performance from "./pages/Performance";
import FeedbackPanel from "./pages/FeedbackPanel";
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
                  path="/inspection/:id"
                  element={
                    <ProtectedRoute>
                      <InspectionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inspection-activity/:activityId/free"
                  element={
                    <ProtectedRoute>
                      <ActivityFreeInspection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inspection-activity/:activityId/guided"
                  element={
                    <ProtectedRoute>
                      <ActivityGuidedInspection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inspection-activity/:activityId/view"
                  element={
                    <ProtectedRoute>
                      <ActivityView />
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
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios/novo"
                  element={
                    <ProtectedRoute>
                      <CreateUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/desempenho"
                  element={
                    <ProtectedRoute>
                      <Performance />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/feedback"
                  element={
                    <ProtectedRoute>
                      <FeedbackPanel />
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
