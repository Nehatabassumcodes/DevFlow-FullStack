'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-2">
      <Sun
        className={`h-4 w-4 transition-all duration-300 ${
          mounted && !isDark
            ? 'rotate-0 scale-100 opacity-100 text-accent-cyan'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />
      <Switch
        checked={mounted && isDark}
        onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
        className="focus-ring"
      />
      <Moon
        className={`h-4 w-4 transition-all duration-300 ${
          mounted && isDark
            ? 'rotate-0 scale-100 opacity-100 text-accent-cyan'
            : '-rotate-90 scale-0 opacity-0'
        }`}
      />
    </div>
  );
}
