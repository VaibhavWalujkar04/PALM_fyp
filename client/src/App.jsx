import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { ErrorBoundary } from 'react-error-boundary'

const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Session = lazy(() => import('./pages/Session'))
const Progress = lazy(() => import('./pages/Progress'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--palm-bg)' }}>
      <div className="w-16 h-16 rounded-2xl palm-gradient-sky flex items-center justify-center animate-palm-float">
        <span className="text-2xl">🌟</span>
      </div>
      <p className="text-lg font-semibold" style={{ color: 'var(--palm-text-muted)' }}>Loading PALM...</p>
    </div>
  )
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: 'var(--palm-bg)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--palm-coral-light)' }}>
        😕
      </div>
      <h2 className="text-xl font-bold" style={{ color: 'var(--palm-text)' }}>
        Oops! Something went wrong
      </h2>
      <p style={{ color: 'var(--palm-text-muted)' }}>
        Don't worry, it's not your fault. Let's try again!
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-3 rounded-full font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'var(--palm-sky)' }}
      >
        Try Again 🔄
      </button>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <TooltipProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--palm-card)',
              border: '1px solid var(--palm-border)',
              color: 'var(--palm-text)',
              fontFamily: "'Nunito Variable', sans-serif",
              borderRadius: '1rem',
              fontSize: '0.95rem',
            },
          }}
        />
      </TooltipProvider>
    </ErrorBoundary>
  )
}