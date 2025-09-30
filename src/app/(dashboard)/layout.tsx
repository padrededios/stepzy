'use client'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      {(user) => (
        <DashboardLayout user={user}>
          {children}
        </DashboardLayout>
      )}
    </ProtectedRoute>
  )
}