import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from '@sentry/react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./context/AuthContextPostgreSQL";
import { CookieConsent } from "./components/common/CookieConsent";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import Support from "@/pages/support/Support";

// Lazy load components
const Index = lazy(() => import("@/pages/Index"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Profile = lazy(() => import("@/pages/dashboard/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const Booking = lazy(() => import("@/pages/booking/Booking"));
const EditBooking = lazy(() => import("@/pages/booking/EditBooking"));
const EditProfile = lazy(() => import("@/pages/profile/EditProfile"));
const SpacesPage = lazy(() => import("@/pages/spaces/SpacesPage"));
const Legal = lazy(() => import("@/pages/legal/Legal"));
const Privacy = lazy(() => import("@/pages/legal/Privacy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const PaymentSuccess = lazy(() => import("@/pages/payment/PaymentSuccess"));
const PaymentCancel = lazy(() => import("@/pages/payment/PaymentCancel"));
const StripeSimulator = lazy(() => import("@/pages/payment/StripeSimulator"));
const Callback = lazy(() => import("@/pages/auth/Callback"));
const TestHomepage = lazy(() => import("@/pages/TestHomepage"));
const TestNavigation = lazy(() => import("@/pages/TestNavigation"));

// Create a client
const queryClient = new QueryClient();

// AppRoutes component that uses useAuth
const AppRoutes = () => {
  return (
    <Suspense fallback={<div><script>console.log('Suspense fallback affiché');</script><LoadingSpinner /></div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<Callback />} />
        <Route path="/stripe-simulator" element={<StripeSimulator />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />
        <Route path="/support" element={<Support />} />
        <Route path="/test-homepage" element={<TestHomepage />} />
        <Route path="/test" element={<TestNavigation />} />

        {/* Legal pages */}
        <Route path="/legal" element={<Legal />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/terms" element={<Terms />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/booking/:spaceId" element={<Booking />} />
          <Route path="/booking/edit/:id" element={<EditBooking />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/spaces" element={<SpacesPage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/payment/simulator" element={<StripeSimulator />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-lg font-semibold text-red-800">Une erreur est survenue</h2>
      <p className="text-red-800">Veuillez rafraîchir la page ou contacter le support.</p>
      <div className="error-message">Une erreur est survenue</div>
    </div>} showDialog>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/" >
            <AuthProvider>
              <AppRoutes />
              <Toaster position="top-center" />
              <CookieConsent />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
