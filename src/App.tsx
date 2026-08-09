import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LibraryPage from "./pages/LibraryPage";
import StudyVaultPage from "./pages/StudyVaultPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import ModeratorPage from "./pages/ModeratorPage";
import AboutPage from "./pages/AboutPage";
import ContributePage from "./pages/ContributePage";
import AITestPage from "./pages/AITestPage";
import AIChatWidget from "./components/AIChatWidget";

import FeedbackPage from "./pages/FeedbackPage";
import StudyAppsPage from "./pages/StudyAppsPage";
import AppDetailsPage from "./pages/AppDetailsPage";
import PortalViewPage from "./pages/PortalViewPage";
import TestSeriesPage from "./pages/TestSeriesPage";
import TestSeriesDetailsPage from "./pages/TestSeriesDetailsPage";
import TestViewPage from "./pages/TestViewPage";
import PracticeViewPage from "./pages/PracticeViewPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdSensePage from "./pages/AdSensePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/adsense" element={<AdSensePage />} />
              <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<><DashboardPage /><AIChatWidget /></>} />
                <Route path="library" element={<><LibraryPage /><AIChatWidget /></>} />
                <Route path="vault" element={<><StudyVaultPage /><AIChatWidget /></>} />
                <Route path="tests" element={<><AITestPage /><AIChatWidget /></>} />
                <Route path="apps" element={<><StudyAppsPage /><AIChatWidget /></>} />
                <Route path="apps/:appId" element={<><AppDetailsPage /><AIChatWidget /></>} />
                <Route path="test-series" element={<><TestSeriesPage /><AIChatWidget /></>} />
                <Route path="test-series/:seriesId" element={<><TestSeriesDetailsPage /><AIChatWidget /></>} />
                <Route path="test/:testId" element={<TestViewPage />} />
                <Route path="practice/:slug" element={<PracticeViewPage />} />
                <Route path="portal/:portalId" element={<PortalViewPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="feedback" element={<><FeedbackPage /><AIChatWidget /></>} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="moderator" element={<ModeratorPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contribute" element={<ContributePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
