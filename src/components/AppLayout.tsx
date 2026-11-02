import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LayoutDashboard, Library, FolderLock, User, FlaskConical, Sun, Moon, LogOut, Shield, MessageSquare, LayoutGrid, ClipboardList, Info, ShieldCheck, Users, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/library', icon: Library, label: 'Library' },
  { to: '/app/tests', icon: FlaskConical, label: 'AI Tests', highlight: true },
  { to: '/app/apps', icon: LayoutGrid, label: 'Study Apps', highlight: true },
  { to: '/app/community', icon: Users, label: 'Community', highlight: true },
  { to: '/app/store', icon: ShoppingBag, label: 'Store' },
  { to: '/app/test-series', icon: ClipboardList, label: 'Test Series' },
  { to: '/app/vault', icon: FolderLock, label: 'Vault' },
  { to: '/app/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/app/profile', icon: User, label: 'Profile' },
  { to: '/app/about', icon: Info, label: 'About' },
];

const mono = "font-['Space_Mono',monospace]";

export default function AppLayout() {
  const { profile, isAdmin, isModerator, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-lg pt-2 pb-1 px-2 sm:px-4">
        <div className="container mx-auto rv-pill flex h-14 items-center justify-between px-4">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2.5" aria-label="Go to dashboard">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-card)]">
              <Star className="h-4 w-4 fill-current" />
            </span>
            <span className={`rv-label text-foreground text-sm`}>RANKERS STAR</span>
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--highlight))]" />
          </button>
          <div className="flex items-center gap-1">
            <span className={`rv-note text-sm text-muted-foreground hidden sm:block mr-1`}>hey, {profile?.display_name || 'student'} ↓</span>
            <NotificationBell />
            <Button variant="ghost" size="icon" aria-label="Toggle dark mode" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {isModerator && !isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/moderator')} title="Moderator Panel" aria-label="Open moderator panel">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/admin')} title="Admin Panel" aria-label="Open admin panel">
                <Shield className="w-4 h-4 text-primary" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate('/'); }} title="Sign out" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className={`sticky bottom-0 z-50 bg-background/85 backdrop-blur-lg px-2 pb-2 ${mono}`}>
        <div className="container mx-auto rv-pill flex justify-around py-1.5 overflow-x-auto">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'}
              className={({ isActive }) => `flex flex-col items-center rounded-full py-1.5 px-2 text-[10px] sm:text-[11px] tracking-[0.06em] uppercase shrink-0 transition-all ${isActive ? 'bg-foreground text-background font-bold shadow-sm' : item.highlight ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <item.icon className={`w-4 h-4 mb-0.5 ${!isActive && item.highlight ? 'drop-shadow-[0_0_5px_hsl(var(--primary))]' : ''}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
