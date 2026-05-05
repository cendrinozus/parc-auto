import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import logoCipres from '../../assets/logo-cipres.png'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cipres-900 flex items-center justify-center p-4">
      {/* Bande décorative gauche */}
      <div className="fixed left-0 top-0 bottom-0 w-1.5 bg-cipres-600" />

      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="text-center mb-8">
          <img src={logoCipres} alt="CIPRES" className="w-24 h-24 object-contain mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-4xl font-bold text-white tracking-tight">ParcAuto</h1>
          <p className="text-cipres-300 text-sm mt-2 font-medium uppercase tracking-widest">
            Gestion du parc automobile — CIPRES
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-cipres-600 px-8 py-4">
            <p className="text-white font-bold text-sm uppercase tracking-wider">Connexion</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input"
                placeholder="admin@parc.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-base">
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <div className="px-8 pb-6">
            <div className="border border-cipres-200 rounded-lg px-4 py-3 bg-cipres-50">
              <p className="text-xs text-cipres-700 font-semibold uppercase tracking-wide mb-1">Compte démo</p>
              <p className="text-sm text-cipres-800 font-mono">admin@parc.com / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}