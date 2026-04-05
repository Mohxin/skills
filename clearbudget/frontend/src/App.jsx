import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { CurrencyProvider } from './context/CurrencyContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Accounts from './pages/Accounts';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Recurring from './pages/Recurring';
import Insights from './pages/Insights';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);
  return [dark, useCallback(() => setDark((d) => !d), [])];
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const location = useLocation();
  useEffect(() => setSidebarOpen(false), [location]);

  const pageTitle = location.pathname === '/' ? 'Dashboard'
    : location.pathname.split('/').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  return (
    <CurrencyProvider>
      <ToastProvider>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="lg:pl-sidebar">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex items-center h-topbar px-4 lg:px-6 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800">
              <button className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>

              <div className="flex items-center gap-2 mr-4">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" d="M12 6v12M17 9.5H7" /></svg>
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white hidden sm:inline">{pageTitle}</span>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-sm hidden md:block">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <input type="text" placeholder="Search transactions..." className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 border-0 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30" aria-label="Search" />
                </div>
              </div>

              <div className="flex items-center gap-1 ml-auto">
                {/* Notification */}
                <button className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative" aria-label="Notifications">
                  <svg className="w-[18px] h-[18px] text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                </button>

                {/* Dark mode */}
                <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Toggle theme">
                  {dark
                    ? <svg className="w-[18px] h-[18px] text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                    : <svg className="w-[18px] h-[18px] text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                  }
                </button>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold ml-2 ring-2 ring-white dark:ring-neutral-900">
                  M
                </div>
              </div>
            </header>

            <main className="p-4 lg:p-8 max-w-[1400px]">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </main>
          </div>
        </div>
      </ToastProvider>
    </CurrencyProvider>
  );
}

export default App;
