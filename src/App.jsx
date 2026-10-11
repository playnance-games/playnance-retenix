import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ModeProvider } from '@/lib/ModeContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Players from '@/pages/Players';
import PlayerCard from '@/pages/PlayerCard';
import Cases from '@/pages/Cases';
import Segments from '@/pages/Segments';
import SettingsPage from '@/pages/Settings';
import LiveBoard from '@/pages/LiveBoard';
import Results from '@/pages/Results';
import Brain from '@/pages/Brain';
import ABTests from '@/pages/ABTests';
import Examples from '@/pages/Examples';
import Bosses from '@/pages/Bosses';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/" replace />} />
      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Brain />} />
        <Route path="/live" element={<LiveBoard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerCard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/segments" element={<Segments />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/results" element={<Results />} />
        <Route path="/brain" element={<Navigate to="/" replace />} />
        <Route path="/ab-tests" element={<ABTests />} />
        <Route path="/examples" element={<Examples />} />
        <Route path="/bosses" element={<Bosses />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ModeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ModeProvider>
    </AuthProvider>
  )
}

export default App