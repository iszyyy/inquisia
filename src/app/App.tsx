import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { SessionProvider } from '../context/SessionContext'
import { router } from './routes'

export default function App() {
  return (
    <SessionProvider>
      <Toaster position="top-right" richColors />
      <RouterProvider router={router} />
    </SessionProvider>
  )
}