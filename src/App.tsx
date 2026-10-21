import './App.css'
import LoginPage from './pages/loginPage'
import { VerifyCode } from './pages/verifyCode'
import { ForgotPassword } from './pages/forgotPassword'
import { ResetPassword } from './pages/resetPassword'
import { AcceptInvitation } from './pages/acceptInvitation'
import { InvitationExpired } from './pages/invitationExpired'
import { SessionExpired } from './pages/sessionExpired'
import { Home } from './pages/home'
import { DashboardLayout } from './components/layout/dashboardLayout'
import { BusinessIntelligence } from './pages/businessIntelligence'
import { Subscriptions } from './pages/subscriptions'
import { CollectibleFees } from './pages/collectibleFees'
import { Users } from './pages/users'
import { UserProfile } from './pages/userProfile'
import { CulturalIntelligence } from './pages/culturalIntelligence'
import { BadgeRecord } from './pages/badgeRecord'
import { CommunityRecord } from './pages/communityRecord'
import { ReviewQueue } from './pages/reviewQueue'
import { LensAi } from './pages/lensAi'
import { LensLanguage } from './pages/lensLanguage'
import { TrustAndSafety } from './pages/trustAndSafety'
import { ReportsQueue } from './pages/reportsQueue'
import { KycVerification } from './pages/kycVerification'
import { Transactions } from './pages/transactions'
import { Ownership, OwnershipDispute } from './pages/ownership'
import { Notifications } from './pages/notifications'
import { Settings } from './pages/settings'
import { RequirePermission, RequireSuperAdmin, ComingSoon } from './components/layout/requirePermission'
import { InviteManagement } from './pages/inviteManagement'
import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/verify" element={<VerifyCode />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite" element={<AcceptInvitation />} />
      <Route path="/invite/expired" element={<InvitationExpired />} />
      <Route path="/session-expired" element={<SessionExpired />} />

      {/* Dashboard mounted under /app so root can be the login page */}
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<RequirePermission permission="home" pageName="Home"><Home /></RequirePermission>} />
        <Route path="business" element={<RequirePermission permission="business" pageName="Business Intelligence"><BusinessIntelligence /></RequirePermission>} />
        <Route path="business/vault" element={<RequirePermission permission="business" pageName="Business Intelligence"><Subscriptions kind="vault" /></RequirePermission>} />
        <Route path="business/community" element={<RequirePermission permission="business" pageName="Business Intelligence"><Subscriptions kind="community" /></RequirePermission>} />
        <Route path="business/collectibles" element={<RequirePermission permission="business" pageName="Business Intelligence"><CollectibleFees /></RequirePermission>} />
        <Route path="culture" element={<RequirePermission permission="culture" pageName="Cultural Intelligence"><CulturalIntelligence /></RequirePermission>} />
        <Route path="culture/review" element={<RequirePermission permission="culture" pageName="Cultural Intelligence"><ReviewQueue /></RequirePermission>} />
        <Route path="culture/badges/:badgeId" element={<RequirePermission permission="culture" pageName="Cultural Intelligence"><BadgeRecord /></RequirePermission>} />
        <Route path="culture/communities/:communityId" element={<RequirePermission permission="culture" pageName="Cultural Intelligence"><CommunityRecord /></RequirePermission>} />
        <Route path="users" element={<RequirePermission permission="users" pageName="Users"><Users /></RequirePermission>} />
        <Route path="users/:userId" element={<RequirePermission permission="users" pageName="Users"><UserProfile /></RequirePermission>} />
        <Route path="transactions" element={<RequirePermission permission="transactions" pageName="Transactions"><Transactions /></RequirePermission>} />
        {/* Placeholder so claim links resolve until the Transactions rebuild lands */}
        <Route path="transactions/:txId" element={<RequirePermission permission="transactions" pageName="Transactions"><ComingSoon pageName="Transaction details" /></RequirePermission>} />
        <Route path="ownership/disputes/:disputeId" element={<RequirePermission permission="ownership" pageName="Ownership"><OwnershipDispute /></RequirePermission>} />
        <Route path="ownership" element={<RequirePermission permission="ownership" pageName="Ownership"><Ownership /></RequirePermission>} />
        <Route path="safety" element={<RequirePermission permission="safety" pageName="Trust and Safety"><TrustAndSafety /></RequirePermission>} />
        <Route path="safety/reports" element={<RequirePermission permission="safety" pageName="Trust and Safety"><ReportsQueue /></RequirePermission>} />
        <Route path="safety/kyc" element={<RequirePermission permission="safety" pageName="Trust and Safety"><KycVerification /></RequirePermission>} />
        <Route path="lens" element={<RequirePermission permission="lens" pageName="Lens AI"><LensAi /></RequirePermission>} />
        <Route path="lens/languages/:code" element={<RequirePermission permission="lens" pageName="Lens AI"><LensLanguage /></RequirePermission>} />
        <Route path="invites" element={<RequireSuperAdmin pageName="Invite Management"><InviteManagement /></RequireSuperAdmin>} />
        <Route path="notifications" element={<RequirePermission permission="notifications" pageName="Notifications"><Notifications /></RequirePermission>} />
        <Route path="settings" element={<RequirePermission permission="settings" pageName="Settings"><Settings /></RequirePermission>} />

        {/* Retired pages fold into their new sections */}
        <Route path="vault" element={<Navigate to="/app/business/vault" replace />} />
        <Route path="communities" element={<Navigate to="/app/culture" replace />} />
        <Route path="badges" element={<Navigate to="/app/culture" replace />} />
        <Route path="help" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App