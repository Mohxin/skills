import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      // Ctrl/Cmd + K — Search/Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handlers?.onCommandPalette?.();
      }

      // N — New transaction
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers?.onNewTransaction?.();
      }

      // D — Toggle dark mode
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        // Only if no other handler is registered
      }

      // Escape — Close modals (handled by Modal component)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

export default useKeyboardShortcuts;
