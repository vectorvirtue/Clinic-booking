import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { BookingPage } from './pages/BookingPage'
import { ModulePage } from './pages/ModulePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate replace to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="book" element={<BookingPage />} />
        <Route path="appointments" element={<ModulePage title="Appointments" />} />
        <Route path="availability" element={<ModulePage title="Availability" />} />
        <Route path="patients" element={<ModulePage title="Patients" />} />
        <Route path="providers" element={<ModulePage title="Providers" />} />
        <Route path="reports" element={<ModulePage title="Reports" />} />
        <Route path="settings" element={<ModulePage title="Settings" />} />
        <Route path="*" element={<ModulePage title="Page not found" />} />
      </Route>
    </Routes>
  )
}
