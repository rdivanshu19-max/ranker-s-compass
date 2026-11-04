import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LayoutDashboard, Library, FolderLock, User, FlaskConical, Sun, Moon, LogOut, Shield, MessageSquare, LayoutGrid, ClipboardList, Info, ShieldCheck, Users, ShoppingBag, Star, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import NotificationBell from '@/components/NotificationBell';

// First 4 are the primary mobile tabs; the rest live in the "More" sheet on mobile.
const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', short: 'Home', end: true },
  { to: '/app/library', icon: Library, label: 'Library', short: 'Library' },
  { to: '/app/tests', icon: FlaskConical, label: 'AI Tests', short: 'Tests', highlight: true },
  { to: '/app/community', icon: Users, label: 'Community', short: 'Community', highlight: true },
  { to: '/app/apps', icon: LayoutGrid, label: 'Study Apps', short: 'Apps', highlight: true },
  { to: '/app/test-series', icon: ClipboardList, label: 'Test Series', short: 'Series' },
  { to: '/app/store', icon: ShoppingBag, label: 'Store', short: 'Store' },
  { to: '/app/vault', icon: FolderLock, label: 'Vault', short: 'Vault' },
  { to: '/app/feedback', icon: MessageSquare, label: 'Feedback', short: 'Feedback' },
  { to: '/app/profile', icon: User, label: 'Profile', short: 'Profile' },
  { to: '/app/about', icon: Info, label: 'About', short: 'About' },
];

const MOBILE_TABS = navItems.slice(0, 4);
const MORE_ITEMS = navItems.slice(4);

const mono = "font-['Space_Mono',monospace]";

export default function AppLayout() {
  const { profile, isAdmin, isModerator, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = MORE_ITEMS.some(item => location.pathname === item.to || (item.to !== '/app' && location.pathname.startsWith(item.to)));

  const linkClass = (isActive: boolean, item: typeof navItems[number], extra = '') =>
    `flex ${extra} flex-col items-center rounded-full py-1.5 px-2 sm:px-3 text-[10px] sm:text-[11px] tracking-[0.06em] uppercase shrink-0 transition-all ${
      isActive ? 'bg-foreground text-background font-bold shadow-sm' : item.highlight ? 'text-primary hover:text-primary' : 'text-muted-foreground hover:text-foreground'
    }`;

  const renderLabel = (text: string) => (
    <span className="max-w-[64px] truncate sm:max-w-none">{text}</span>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-lg pt-2 pb-1 px-2 sm:px-4">
        <div className="container mx-auto rv-pill flex h-14 items-center justify-between px-3 sm:px-4">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 min-w-0" aria-label="Go to dashboard">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-card)]">
              <Star className="h-4 w-4 fill-current" />
            </span>
            <span className={`rv-label text-foreground text-xs sm:text-sm truncate`}>RANKERS STAR</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[hsl(var(--highlight))]" />
          </button>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className={`rv-note text-sm text-muted-foreground hidden lg:block mr-1`}>hey, {profile?.display_name || 'student'} ↓</span>
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

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      <nav className={`sticky bottom-0 z-50 bg-background/85 backdrop-blur-lg px-2 pb-2 ${mono}`}>
        {/* Mobile: fixed 5-tab bar, no scrolling, no overlap */}
        <div className="container mx-auto rv-pill grid grid-cols-5 py-1.5 sm:hidden">
          {MOBILE_TABS.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'} className="flex justify-center">
              {({ isActive }) => (
                <span className={linkClass(isActive, item)}>
                  <item.icon className={`w-[18px] h-[18px] mb-0.5 ${!isActive && item.highlight ? 'drop-shadow-[0_0_5px_hsl(var(--primary))]' : ''}`} />
                  {renderLabel(item.short)}
                </span>
              )}
            </NavLink>
          ))}
          <button onClick={() => setMoreOpen(true)} className="flex justify-center" aria-label="More sections">
            <span className={`flex flex-col items-center rounded-full py-1.5 px-2 text-[10px] tracking-[0.06em] uppercase shrink-0 transition-all ${isMoreActive ? 'bg-foreground text-background font-bold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Menu className="w-[18px] h-[18px] mb-0.5" />
              {renderLabel('More')}
            </span>
          </button>
        </div>

        {/* Desktop: full list, wraps instead of overlapping */}
        <div className="container mx-auto rv-pill hidden sm:flex flex-wrap justify-center gap-x-1 gap-y-1 py-1.5">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/app'}>
              {({ isActive }) => (
                <span className={linkClass(isActive, item)}>
                  <item.icon className={`w-4 h-4 mb-0.5 ${!isActive && item.highlight ? 'drop-shadow-[0_0_5px_hsl(var(--primary))]' : ''}`} />
                  <span className="max-w-[80px] truncate">{item.label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-6">
          <SheetHeader className="items-start">
            <SheetTitle className="text-left">All sections</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            {MORE_ITEMS.map(item => (
              <SheetClose asChild key={item.to}>
                <NavLink to={item.to} className="rv-card flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center text-[11px] font-semibold uppercase tracking-wide">
                  <item.icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : 'text-foreground'}`} />
                  {item.label}
                </NavLink>
              </SheetClose>
            ))}
          </div>
          <div className="mt-4 px-4">
            <SheetClose asChild>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => { signOut(); navigate('/'); }}>
                <LogOut className="w-4 h-4" /> Sign out
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
