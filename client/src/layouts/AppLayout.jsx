import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

// Map paths to page titles for the topbar
const PAGE_TITLES = {
  '/dashboard':   'Dashboard',
  '/tickets':     'Tickets',
  '/tickets/assigned': 'My Assigned Tickets',
  '/tickets/new': 'Create Ticket',
  '/assets':      'Assets',
  '/employees':   'Employees',
  '/departments': 'Departments',
  '/reports':     'Reports',
  '/audit-logs':  'Audit Logs',
  '/settings':    'Settings',
  '/profile':     'My Profile',
};

const AppLayout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get page title — check for exact match first, then prefix match
  const getPageTitle = () => {
    const exact = PAGE_TITLES[location.pathname];
    if (exact) return exact;
    // Handle dynamic routes like /tickets/INC-2026-0001
    const prefix = Object.keys(PAGE_TITLES).find((key) =>
      location.pathname.startsWith(key) && key !== '/'
    );
    return prefix ? PAGE_TITLES[prefix] : '';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="main-content flex-1">
        <Topbar
          onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          pageTitle={getPageTitle()}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
