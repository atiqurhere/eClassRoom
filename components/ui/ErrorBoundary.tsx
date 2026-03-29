'use client'

import { ErrorBoundary } from 'react-error-boundary'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <AlertTriangle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600 mt-2 max-w-md">
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>

        <div className="space-y-4">
          <details className="text-left bg-gray-100 rounded-lg p-4 max-w-lg">
            <summary className="cursor-pointer font-medium text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 text-sm text-red-600 overflow-x-auto">
              {error.message}
            </pre>
          </details>

          <div className="flex gap-4 justify-center">
            <Button onClick={resetErrorBoundary}>
              <RefreshCw size={18} className="mr-2" />
              Try Again
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error caught by boundary:', error, errorInfo)
        // In a real app, you'd send this to an error tracking service
      }}
    >
      {children}
    </ErrorBoundary>
  )
}