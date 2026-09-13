import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { Navbar } from './components/Navbar'
import { GraceAscensionOverlay } from './components/GraceAscensionOverlay'
import { ProtectedRoute } from './components/ProtectedRoute'

import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { QuestsPage } from './pages/QuestsPage'
import { ShopPage } from './pages/ShopPage'
import { InventoryPage } from './pages/InventoryPage'
import { MapPage } from './pages/MapPage'
import { BossArenaPage } from './pages/BossArenaPage'
import { BadgesPage } from './pages/BadgesPage'
import { SettingsPage } from './pages/SettingsPage'

const AppContent = () => {
  const location = useLocation()
  
  let bgImage = ''
  if (location.pathname.startsWith('/dashboard')) bgImage = '/dashboard_bg.jpg'
  else if (location.pathname.startsWith('/quests')) bgImage = '/quests_bg.jpg'
  else if (location.pathname.startsWith('/shop')) bgImage = '/shop_bg.jpg'
  else if (location.pathname.startsWith('/inventory')) bgImage = '/pouch_bg.jpg'
  else if (location.pathname.startsWith('/boss')) bgImage = '/boss_bg.jpg'
  else if (location.pathname.startsWith('/badges')) bgImage = '/badges_bg.jpg'
  else if (location.pathname.startsWith('/settings')) bgImage = '/settings_bg.jpg'

  return (
    <div className="app-shell" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundImage: bgImage ? `url(${bgImage})` : 'none',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      backgroundPosition: 'center',
    }}>
      <Navbar />
      <div style={{ flex: 1, backgroundColor: bgImage ? 'rgba(11, 12, 16, 0.4)' : 'transparent' }}>
        <Routes>
          {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Gameplay Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quests"
                  element={
                    <ProtectedRoute>
                      <QuestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/shop"
                  element={
                    <ProtectedRoute>
                      <ShopPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/map"
                  element={
                    <ProtectedRoute>
                      <MapPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/boss/:bossId"
                  element={
                    <ProtectedRoute>
                      <BossArenaPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/badges"
                  element={
                    <ProtectedRoute>
                      <BadgesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <GraceAscensionOverlay />
          </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
