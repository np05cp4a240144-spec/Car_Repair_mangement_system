import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import {
  LandingPage,
  FeaturesPage,
  RolesPage,
  AboutPage,
  StoriesPage,
  ReleaseNotesPage,
  HelpCenterPage,
  CustomerLayout,
  CustomerHome,
  CustomerTracking,
  CustomerBooking,
  CustomerHistory,
  CustomerChat,
  CustomerPayment,
  CustomerProfile,
  CustomerInventory,
  CustomerCart,
  PaymentSuccess,
  CustomerRating,
  MechanicLayout,
  MechanicJobs,
  MechanicSchedule,
  MechanicChat,
  MechanicParts,
  MechanicProfile
} from './pages';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Dashboard from './pages/core/Dashboard';
import AdminLayout from './pages/admin/layout/AdminLayout';
import AdminOverview from './pages/admin/overview/AdminOverview';
import AdminAppointments from './pages/admin/appointments/AdminAppointments';
import AdminCustomers from './pages/admin/customers/AdminCustomers';
import AdminRevenue from './pages/admin/revenue/AdminRevenue';
import AdminMechanics from './pages/admin/mechanics/AdminMechanics';
import AdminInventory from './pages/admin/inventory/AdminInventory';
import AdminSettings from './pages/admin/settings/AdminSettings';
import AdminSupportChat from './pages/admin/support/AdminSupportChat';
import AdminRatings from './pages/admin/ratings/AdminRatings';


function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/stories" element={<StoriesPage />} />
            <Route path="/release-notes" element={<ReleaseNotesPage />} />
            <Route path="/help-center" element={<HelpCenterPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="mechanics" element={<AdminMechanics />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="support" element={<AdminSupportChat />} />
              <Route path="ratings" element={<AdminRatings />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="setting" element={<Navigate to="/admin/settings" replace />} />
            </Route>
            <Route path="/customer" element={<CustomerLayout />}>
              <Route index element={<CustomerHome />} />
              <Route path="tracking" element={<CustomerTracking />} />
              <Route path="book" element={<CustomerBooking />} />
              <Route path="history" element={<CustomerHistory />} />
              <Route path="history/:bookingId" element={<CustomerHistory />} />
              <Route path="chat" element={<CustomerChat />} />
              <Route path="inventory" element={<CustomerInventory />} />
              <Route path="cart" element={<CustomerCart />} />
              <Route path="payment" element={<CustomerPayment />} />
              <Route path="profile" element={<CustomerProfile />} />
              <Route path="rating" element={<CustomerRating />} />
            </Route>
            <Route path="/mechanic" element={<MechanicLayout />}>
              <Route index element={<MechanicJobs />} />
              <Route path="schedule" element={<MechanicSchedule />} />
              <Route path="chat" element={<MechanicChat />} />
              <Route path="parts" element={<MechanicParts />} />
              <Route path="profile" element={<MechanicProfile />} />
            </Route>
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
