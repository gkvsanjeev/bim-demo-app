import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { CallbackPage } from '../features/auth/CallbackPage'
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { SubmissionForm } from '../features/dashboard/SubmissionForm'
import App from '../App'

export const router = createBrowserRouter([
  // ─── Public routes ─────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <CallbackPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // ─── Dashboard (all authenticated roles) ───────────────────────────────────
  // public_user → PublicDashboard; caas_io / adp_ao → CaasDashboard
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute roles={['public_user', 'caas_io', 'adp_ao']}>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },

  // ─── New submission form (public_user only) ─────────────────────────────────
  // US-01…US-08: BIM submission flow
  {
    path: '/submit',
    element: (
      <ProtectedRoute roles={['public_user']}>
        <SubmissionForm />
      </ProtectedRoute>
    ),
  },

  // ─── Map viewer (CAAS officers and ADP approvers) ───────────────────────────
  // US-21…US-25: 3D visualisation; applicationId comes from dashboard click
  {
    path: '/map/:applicationId',
    element: (
      <ProtectedRoute roles={['caas_io', 'adp_ao']}>
        <App />
      </ProtectedRoute>
    ),
  },

  // ─── Root redirect ──────────────────────────────────────────────────────────
  { path: '/', element: <Navigate to="/dashboard" replace /> },
])
