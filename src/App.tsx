import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { PrivacyModal } from './components/PrivacyModal';
import { DataImportPage } from './pages/DataImportPage';
import { DataCleaningPage } from './pages/DataCleaningPage';
import { DashboardPage } from './pages/DashboardPage';
import { AlertsPage } from './pages/AlertsPage';
import { InsightsPage } from './pages/InsightsPage';
import { ChatAgentPage } from './pages/ChatAgentPage';
import { ReportsPage } from './pages/ReportsPage';
import { useBIStore } from './store/useBIStore';
import { Menu, X } from 'lucide-react';

export default function App() {
  const { activeTab, darkMode } = useBIStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      {/* Mobile Sidebar Toggle Button */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden bg-slate-900/50 flex">
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4">
              <Sidebar />
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'import' && <DataImportPage />}
          {activeTab === 'cleaning' && <DataCleaningPage />}
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'insights' && <InsightsPage />}
          {activeTab === 'chat' && <ChatAgentPage />}
          {activeTab === 'reports' && (
            <ReportsPage onOpenSettings={() => setIsSettingsOpen(true)} />
          )}
        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
    </div>
  );
}
