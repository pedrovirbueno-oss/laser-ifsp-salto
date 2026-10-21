import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QRCodeModal } from './components/QRCodeModal';
import { ProjectApprovalModal } from './components/ProjectApprovalModal';
import { LiveToastNotifications } from './components/LiveToastNotifications';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { MachinesView } from './views/MachinesView';
import { WorkOrdersView } from './views/WorkOrdersView';
import { ProductionPlanView } from './views/ProductionPlanView';
import { MaintenanceView } from './views/MaintenanceView';
import { AlertsView } from './views/AlertsView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { StudentPortalView } from './views/StudentPortalView';
import { OsPublicVerifyView } from './views/OsPublicVerifyView';

const MainContent = () => {
  const { activeTab, isAuthenticated, portalMode, setPortalMode } = useApp();
  const [scannedOsCode, setScannedOsCode] = useState(null);

  // Check URL query parameters:
  // 1) ?os=OS-2026-XXXX -> Opens the scanned Work Order directly!
  // 2) ?mode=student -> Opens the standalone Student Portal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const osParam = params.get('os');
    if (osParam) {
      setScannedOsCode(osParam);
      return;
    }
    const isAlunoDomain = window.location.hostname.startsWith('aluno.') || window.location.hostname.includes('aluno');
    if (params.get('mode') === 'student' || params.get('portal') === 'student' || isAlunoDomain) {
      setPortalMode('STUDENT');
    }
  }, [setPortalMode]);

  // If user scanned a real QR Code (?os=OS-2026-XXXX), open the official OS page directly
  if (scannedOsCode) {
    return (
      <>
        <LiveToastNotifications />
        <OsPublicVerifyView
          osCodeParam={scannedOsCode}
          onBack={() => {
            window.history.replaceState({}, '', window.location.pathname);
            setScannedOsCode(null);
          }}
        />
      </>
    );
  }

  // If in Student Portal Mode
  if (portalMode === 'STUDENT') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased p-4 sm:p-6 max-w-[1400px] mx-auto">
        <LiveToastNotifications />
        <StudentPortalView />
        <ProjectApprovalModal />
        <QRCodeModal />
      </div>
    );
  }

  // If user is not authenticated for Management view
  if (!isAuthenticated) {
    return (
      <>
        <LiveToastNotifications />
        <LoginView />
      </>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'machines':
        return <MachinesView />;
      case 'workorders':
        return <WorkOrdersView />;
      case 'production':
        return <ProductionPlanView />;
      case 'maintenance':
        return <MaintenanceView />;
      case 'alerts':
        return <AlertsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Real-time Pop-up Toasts */}
      <LiveToastNotifications />

      {/* Top Navigation Bar with Logo */}
      <Header />

      {/* Main Body Layout */}
      <div className="flex grow max-w-[1600px] w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Tab View Container */}
        <main className="grow p-6 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      {/* Global Modals */}
      <QRCodeModal />
      <ProjectApprovalModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
