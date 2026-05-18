import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import VehiculesList from './pages/vehicules/VehiculesList'
import VehiculeForm from './pages/vehicules/VehiculeForm'
import VehiculeDetail from './pages/vehicules/VehiculeDetail'
import ConducteursList from './pages/conducteurs/ConducteursList'
import ConducteurForm from './pages/conducteurs/ConducteurForm'
import PleinsList from './pages/pleins/PleinsList'
import PleinForm from './pages/pleins/PleinForm'
import Rapports from './pages/rapports/Rapports'
import Alertes from './pages/alertes/Alertes'
import UtilisateursList from './pages/utilisateurs/UtilisateursList'
import UtilisateurForm from './pages/utilisateurs/UtilisateurForm'
import Parametres from './pages/parametres/Parametres'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="vehicules" element={<VehiculesList />} />
          <Route path="vehicules/nouveau" element={<VehiculeForm />} />
          <Route path="vehicules/:id" element={<VehiculeDetail />} />
          <Route path="vehicules/:id/modifier" element={<VehiculeForm />} />
          <Route path="conducteurs" element={<ConducteursList />} />
          <Route path="conducteurs/nouveau" element={<ConducteurForm />} />
          <Route path="conducteurs/:id/modifier" element={<ConducteurForm />} />
          <Route path="pleins" element={<PleinsList />} />
          <Route path="pleins/nouveau" element={<PleinForm />} />
          <Route path="pleins/:id/modifier" element={<PleinForm />} />
          <Route path="rapports" element={<Rapports />} />
          <Route path="alertes" element={<Alertes />} />
          <Route path="utilisateurs" element={<AdminRoute><UtilisateursList /></AdminRoute>} />
          <Route path="utilisateurs/nouveau" element={<AdminRoute><UtilisateurForm /></AdminRoute>} />
          <Route path="utilisateurs/:id/modifier" element={<AdminRoute><UtilisateurForm /></AdminRoute>} />
          <Route path="parametres" element={<AdminRoute><Parametres /></AdminRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
