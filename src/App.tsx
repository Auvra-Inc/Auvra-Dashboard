import './App.css'
import LoginPage from './pages/loginPage'
import { Home } from './pages/home'
import { DashboardLayout } from './components/layout/dashboardLayout'
import { BusinessIntelligence } from './pages/BusinessIntelligence'
import { Users } from './pages/users'
import { CulturalIntelligence } from './pages/culturalIntelligence'
import { TrustAndSafety } from './pages/trustAndSafety'
import { Vault } from './pages/vault'
import { Communities } from './pages/communities'
import { Badges } from './pages/Badges'
import { Transactions } from './pages/transactions'
import { Settings } from './pages/settings'
import { HelpCenter } from './pages/helpCenter'
import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* 2. The Parent: The TV and Console stay glued here */}
      <Route path="/" element={<DashboardLayout />}>
        
        {/* 3. The Child: This injects into the <Outlet /> inside DashboardLayout */}
        <Route index element={<Home />} />
        
        <Route path="business" element={<BusinessIntelligence />} />
        <Route path="culture" element={<CulturalIntelligence />} />
        <Route path="users" element={<Users />} />
        <Route path="vault" element={<Vault />} />
        <Route path="safety" element={<TrustAndSafety />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="communities" element={<Communities />} />
        <Route path="badges" element={<Badges />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<HelpCenter />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App