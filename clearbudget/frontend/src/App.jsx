import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { CurrencyProvider } from './context/CurrencyContext';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
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
    const s = localStorage.getItem('darkMode');
    return s !== null ? s === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', String(dark));
  }, [dark]);
  return [dark, useCallback(() => setDark((d) => !d), [])];
}

const pageTitles = {
  '/': 'Home',
  '/budget': 'Budget',
  '/transactions': 'Transactions',
  '/recurring': 'Recurring Bills',
  '/accounts': 'Accounts',
  '/goals': 'Goals',
  '/insights': 'Insights',
  '/reports': 'Reports',
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setSidebarOpen(false), [location]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const title = pageTitles[location.pathname] || '';

  return (
    <CurrencyProvider>
      <ToastProvider>
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b]">
          {sidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <div className="lg:pl-[256px]">
            {/* Top bar */}
            <header className="sticky top-0 z-30 flex items-center h-[52px] px-4 lg:px-6 bg-[#fafafa]/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800/60">
              <button className="lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 mr-2" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              </button>

              <h1 className="text-[13px] font-semibold text-[#09090b] dark:text-[#fafafa] tracking-[-0.01em]">{title}</h1>

              <div className="flex-1" />

              {/* Search */}
              <button
                className="hidden md:flex items-center gap-2 px-3 py-1 text-[12px] text-neutral-400 dark:text-neutral-500 bg-neutral-100/60 dark:bg-neutral-800/40 rounded-lg border border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                <span className="font-medium">Search...</span>
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 font-mono">⌘K</kbd>
              </button>

              <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-3 hidden md:block" />

              {/* Theme toggle */}
              <button onClick={toggleDark} className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Toggle theme">
                {dark
                  ? <svg className="w-[15px] h-[15px] text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                  : <svg className="w-[15px] h-[15px] text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                }
              </button>

              {/* Avatar */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold ml-2 ring-1 ring-neutral-200/60 dark:ring-neutral-800">
                M
              </div>
            </header>

            <main className="p-4 lg:p-6 max-w-[1440px] page-enter">
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

        {/* Command Palette */}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} toggleDark={toggleDark} />
      </ToastProvider>
    </CurrencyProvider>
  );
}

export default App;
