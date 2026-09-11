'use client';

import React, { useState, useEffect } from 'react';
import { GastronomyProvider, useGastronomy } from '../context/GastronomyContext';
import { Header } from '../components/Header';
import { Navigation, TabType, COLAB_ALLOWED_TABS } from '../components/Navigation';
import { DashboardView } from '../components/DashboardView';
import { SalesView } from '../components/SalesView';
import { SuppliersView } from '../components/SuppliersView';
import { ExpensesView } from '../components/ExpensesView';
import { BudgetView } from '../components/BudgetView';
import { ChecksView } from '../components/ChecksView';
import { BankAccountsView } from '../components/BankAccountsView';
import { EmployeesView } from '../components/EmployeesView';
import { SociosView } from '../components/SociosView';
import { DishesView } from '../components/DishesView';
import { AiChatView } from '../components/AiChatView';
import { MakeIntegrationView } from '../components/MakeIntegrationView';
import { FudoLiveDashboard } from '../components/FudoLiveDashboard';
import { AdminPinModal as EmployeesPinModal } from '../components/AdminPinModal';
import { PinLoginModal } from '../components/PinLoginModal';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const { isEmployeesUnlocked } = useGastronomy();
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'empleados' && !isEmployeesUnlocked) {
      setShowEmployeesModal(true);
    }
  }, [activeTab, isEmployeesUnlocked]);

  const handleTabChange = (tab: TabType) => {
    if (tab === 'empleados' && !isEmployeesUnlocked) {
      setShowEmployeesModal(true);
      setActiveTab('empleados');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <PinLoginModal />
      <EmployeesPinModal
        isOpen={showEmployeesModal && !isEmployeesUnlocked}
        onClose={() => {
          setShowEmployeesModal(false);
          if (!isEmployeesUnlocked) setActiveTab('dashboard');
        }}
      />
      <Header onOpenAiChat={() => handleTabChange('ia')} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Navigation activeTab={activeTab} setActiveTab={handleTabChange} />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => handleTabChange(tab)} />}
          {activeTab === 'fudo' && <FudoLiveDashboard />}
          {activeTab === 'ventas' && <SalesView />}
          {activeTab === 'compras' && <SuppliersView />}
          {activeTab === 'gastos' && <ExpensesView />}
          {activeTab === 'presupuesto' && <BudgetView />}
          {activeTab === 'cheques' && <ChecksView />}
          {activeTab === 'bancos' && <BankAccountsView />}
          {activeTab === 'empleados' && (
            isEmployeesUnlocked ? <EmployeesView /> : null
          )}
          {activeTab === 'socios' && <SociosView />}
          {activeTab === 'ia' && <AiChatView />}
          {activeTab === 'make' && <MakeIntegrationView />}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <GastronomyProvider>
      <MainAppContent />
    </GastronomyProvider>
  );
}
