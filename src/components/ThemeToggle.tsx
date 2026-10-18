import { Icon } from './Icon';
import { useTheme } from '../lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
    </button>
  );
}
