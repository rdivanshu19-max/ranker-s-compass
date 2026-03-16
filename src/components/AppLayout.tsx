import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LayoutDashboard, Library, FolderLock, User, Info, Heart, FlaskConical, Sun, Moon, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/library', icon: Library, label: 'Library' },
  { to: '/app/vault', icon: FolderLock, label: 'Study Vault' },
  { to: '/app/tests', icon: FlaskConical, label: 'AI Tests' },
  { to: '/app/profile', icon: User, label: 'Profile' },
  { to: '/app/about', icon: Info, label: 'About' },
  { to: '/app/contribute', icon: Heart, label: 'Contribute' },
];

export default function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold font-display">
            <span className="text-foreground">Rankers </span><span className="text-gradient">Star</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">Hi, {profile?.display_name || 'Student'}</span>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin')} title="Admin Panel">
                <Shield className="w-4 h-4 text-primary" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/'); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom nav (mobile-friendly) */}
      <nav className="sticky bottom-0 z-50 border-t border-border bg-card/90 backdrop-blur-lg">
        <div className="container mx-auto px-2 flex justify-around py-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'}
              className={({ isActive }) => `flex flex-col items-center py-2 px-2 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="hidden sm:block">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
