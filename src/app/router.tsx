import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '../features/auth/LoginPage'
import { CallbackPage } from '../features/auth/CallbackPage'
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage'
import App from '../App'

export const router = createBrowserRouter([
  // ─── Public routes ─────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <CallbackPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // ─── Protected routes ───────────────────────────────────────────────────────
  // ASSUMPTION(US-21): All authenticated roles share the map viewer for the demo.
  // Future role-specific routes:
  //   /submit          → public_user        → SubmissionFlow (US-01…US-08)
  //   /review/:id      → caas_io + adp_ao   → MapViewer (US-26…US-34)
  //   /approve/:id     → adp_ao             → LocGeneration (US-42…US-45)
  {
    path: '/',
    element: (
      <ProtectedRoute roles={['public_user', 'caas_io', 'adp_ao']}>
        <App />
      </ProtectedRoute>
    ),
  },
])
