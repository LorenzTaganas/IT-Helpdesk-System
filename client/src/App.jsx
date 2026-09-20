import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketListPage from './pages/tickets/TicketListPage';
import CreateTicketPage from './pages/tickets/CreateTicketPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';
import AssetsPage from './pages/assets/AssetsPage';
import AssetDetailPage from './pages/assets/AssetDetailPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';

// Placeholder pages — will be replaced in later phases
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-64 text-center">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
      style={{ background: '#f1f5f9' }}>
      <span className="text-2xl">🚧</span>
    </div>
    <h2 className="text-xl font-bold mb-2" style={{ color: '#0f172a' }}>{title}</h2>
    <p style={{ color: '#64748b' }} className="text-sm">This section is coming in a future phase.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications — positioned top-right */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — all roles */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketListPage />} />
              <Route path="/tickets/new" element={<CreateTicketPage />} />
              <Route path="/tickets/assigned" element={<TicketListPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/assets/new" element={<AssetDetailPage />} />
              <Route path="/assets/:id" element={<AssetDetailPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/new" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/reports" element={<ComingSoon title="Reports" />} />
              <Route path="/audit-logs" element={<ComingSoon title="Audit Logs" />} />
              <Route path="/settings" element={<ComingSoon title="Settings" />} />
              <Route path="/profile" element={<ComingSoon title="My Profile" />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
