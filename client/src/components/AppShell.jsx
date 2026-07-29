import { useState } from 'react';
import { BriefcaseBusiness, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { baseApi } from '../api/baseApi';
import { logout } from '../features/auth/authSlice';
import { Button, cn } from './ui';

export const AppShell = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isCasesListPage = pathname === '/cases' || pathname === '/cases/new';
  const isDashboardPage = pathname === '/dashboard';

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases', path: '/cases', icon: BriefcaseBusiness }
  ];

  const goTo = (to) => {
    navigate(to);
    setOpen(false);
  };

  const signOut = () => {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate('/login');
    setOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="icon-btn mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>
        <div className="brand">
          <div className="avatar">{user?.name?.[0] || 'M'}</div>
          <div style={{ minWidth: 0 }}>
            <h1 className="brand-title">Mini Case Tracker</h1>
            <p className="brand-subtitle">
              {user?.name} / {user?.role}
            </p>
          </div>
        </div>
        <nav className="nav-actions" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button key={item.path} variant="ghost" onClick={() => goTo(item.path)}>
                <Icon size={20} />
                {item.label}
              </Button>
            );
          })}
          <Button variant="ghost" onClick={signOut}>
            <LogOut size={20} />
            Sign out
          </Button>
        </nav>
      </header>

      {open && (
        <aside className="dialog-backdrop" onMouseDown={() => setOpen(false)}>
          <div className="dialog" style={{ width: 300, marginLeft: 0, justifySelf: 'start', height: '100%' }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="dialog-header">
              <div>
                <h2>Mini Case Tracker</h2>
                <p className="drawer-subtitle">{user?.email}</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="dialog-body">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
                return (
                  <Button key={item.path} variant={active ? 'primary' : 'ghost'} onClick={() => goTo(item.path)} className="drawer-btn">
                    <Icon size={20} />
                    {item.label}
                  </Button>
                );
              })}
              <Button variant="ghost" onClick={signOut} className="drawer-btn">
                <LogOut size={20} />
                Sign out
              </Button>
            </div>
          </div>
        </aside>
      )}

      <main className={cn('page-shell', isCasesListPage && 'cases-lock', isDashboardPage && 'dashboard-lock')}>{children}</main>
    </div>
  );
};
