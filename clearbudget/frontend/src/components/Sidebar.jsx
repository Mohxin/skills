import { NavLink } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

const nav = [
  { section: 'Overview', items: [
    { path: '/', label: 'Home', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
    { path: '/budget', label: 'Budget', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
  ]},
  { section: 'Activity', items: [
    { path: '/transactions', label: 'Transactions', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
    { path: '/recurring', label: 'Recurring', icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182' },
  ]},
  { section: 'Management', items: [
    { path: '/accounts', label: 'Accounts', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
    { path: '/goals', label: 'Goals', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    { path: '/insights', label: 'Insights', icon: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' },
    { path: '/reports', label: 'Reports', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
  ]},
];

function Sidebar({ open, onClose }) {
  const { currency, currencies, changeCurrency } = useCurrency();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col bg-[#fafafa] dark:bg-[#0c0c0e] border-r border-neutral-200/60 dark:border-neutral-800/60 transition-transform duration-300 ease-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[52px] px-4 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-[8px] bg-[#09090b] dark:bg-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white dark:text-[#09090b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v12" /><path d="M17 9.5H7" />
              </svg>
            </div>
          </div>
          <div>
            <span className="text-[13px] font-bold tracking-[-0.02em] text-[#09090b] dark:text-[#fafafa]">ClearBudget</span>
          </div>
        </div>
        <button className="lg:hidden p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={onClose} aria-label="Close">
          <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map((group) => (
          <div key={group.section} className="mb-4 last:mb-0">
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-600">{group.section}</p>
            <ul role="list" className="space-y-[1px]">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 px-2 py-[6px] rounded-[7px] text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-neutral-100 dark:bg-neutral-800/80 text-[#09090b] dark:text-[#fafafa]'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-[#09090b] dark:hover:text-[#fafafa] hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <svg className={`w-[15px] h-[15px] shrink-0 transition-colors ${isActive ? 'text-[#09090b] dark:text-[#fafafa]' : 'text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d={item.icon} />
                        </svg>
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 p-2 space-y-1.5">
        <select
          value={currency.code}
          onChange={(e) => changeCurrency(e.target.value)}
          className="w-full px-2 py-1.5 text-[11px] font-medium rounded-[6px] bg-neutral-100/60 dark:bg-neutral-800/50 border-0 text-neutral-600 dark:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
          aria-label="Currency"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code} className="bg-white dark:bg-[#18181b]">{c.code} — {c.name}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}

export default Sidebar;
