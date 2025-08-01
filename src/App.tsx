import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import LeadsPage from './pages/LeadsPage';
import AddLeadPage from './pages/AddLeadPage';
import EditLeadPage from './pages/EditLeadPage';
import ViewLeadPage from './pages/ViewLeadPage';
import TasksPage from './pages/TasksPage';
import TelegramSubscriptionsPage from './pages/TelegramSubscriptionsPage';
import EbookAccessPage from './pages/EbookAccessPage';
import TelegramCampaignPage from './pages/TelegramCampaignPage';
import PaymentSubscriptionComparisonPage from './pages/PaymentSubscriptionComparisonPage';
import StudentSessionPage from './pages/StudentSessionPage';
import SessionSlotsPage from './pages/SessionSlotsPage';
import StudentBookingsPage from './pages/StudentBookingsPage';
import StudentBookingDetailsPage from './pages/StudentBookingDetailsPage';
import InstructorsPage from './pages/InstructorsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/leads/new" element={<AddLeadPage />} />
            <Route path="/leads/edit/:id" element={<EditLeadPage />} />
            <Route path="/leads/view/:id" element={<ViewLeadPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/telegram" element={<TelegramSubscriptionsPage />} />
            <Route path="/telegram/campaign" element={<TelegramCampaignPage />} />
            <Route path="/telegram/payment-comparison" element={<PaymentSubscriptionComparisonPage />} />
            <Route path="/ebooks" element={<EbookAccessPage />} />
            <Route path="/sessions" element={<StudentSessionPage />} />
                        <Route path="/session-slots" element={<SessionSlotsPage />} />
            <Route path="/instructors" element={<InstructorsPage />} />
            <Route path="/bookings" element={<StudentBookingsPage />} />
            <Route path="/bookings/:id" element={<StudentBookingDetailsPage />} />
            <Route path="/reports" element={<Dashboard />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;