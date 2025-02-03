import { useEffect } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  [key: string]: {
    handler: ShortcutHandler;
    description: string;
  };
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Check if the key combination matches any of our shortcuts
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      for (const [key, config] of Object.entries(shortcuts)) {
        const parts = key.toLowerCase().split('+');
        const lastKey = parts[parts.length - 1];
        
        // Check if all modifiers are pressed
        const hasShift = parts.includes('shift') === event.shiftKey;
        const hasModifier = parts.includes('mod') === modifier;
        const matchesKey = event.key.toLowerCase() === lastKey.toLowerCase();

        if (matchesKey && hasShift && hasModifier) {
          event.preventDefault();
          config.handler();
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
