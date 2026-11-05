import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { BrowsePage } from './pages/BrowsePage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { ReportPage } from './pages/ReportPage'
import { MyItemsPage } from './pages/MyItemsPage'
import { LoginPage } from './pages/LoginPage'
import { AdminPage } from './pages/AdminPage'
import { ChatListPage } from './pages/ChatListPage'
import { ChatRoomPage } from './pages/ChatRoomPage'
import { AlertsPage, PlacesPage, RecentPage, SavedPage, TodayPage } from './pages/CollectionPages'
import { ProtectedRoute } from './components/ProtectedRoute'

/** Route changes should land at the top of the new screen, not mid-scroll. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        {/* Finder tools — stored per browser, so no sign-in needed. */}
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/recent" element={<RecentPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-items"
          element={
            <ProtectedRoute>
              <MyItemsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chats/:id"
          element={
            <ProtectedRoute>
              <ChatRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute admin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    </>
  )
}
