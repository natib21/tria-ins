import { AuthProvider, ProtectedRoute } from '@/components/auth/auth-provider'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <DashboardSidebar>
            <Header />
            {children}
          </DashboardSidebar>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
