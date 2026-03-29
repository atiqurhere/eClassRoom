import { ReactNode } from 'react'
import { GraduationCap } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 text-white p-3 rounded-full">
              <GraduationCap size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">E-Classroom LMS</h1>
          <p className="text-gray-600 mt-2">Modern Learning Management System</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          © 2026 E-Classroom. All rights reserved.
        </p>
      </div>
    </div>
  )
}
