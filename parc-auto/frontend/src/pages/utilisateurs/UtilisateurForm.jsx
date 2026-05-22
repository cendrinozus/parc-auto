import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { utilisateursService, conducteursService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = { nom: '', prenom: '', email: '', password: '', role: 'conducteur', actif: true, conducteur_id: '' }

export default function UtilisateurForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [conducteurs, setConducteurs] = useState([])

  useEffect(() => {
    conducteursService.getAll({ actif: true })
      .then(r => setConducteurs(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (id) {
      utilisateursService.getById(id)
        .then(r => setForm({ ...r.data, password: '', conducteur_id: r.data.conducteur_id ?? '' }))
        .catch(() => navigate('/utilisateurs'))
    }
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleConducteurChange = (conducteurId) => {
    set('conducteur_id', conducteurId)
    if (conducteurId) {
      const c = conducteurs.find(c => c.id === parseInt(conducteurId))
      if (c) { set('nom', c.nom); set('prenom', c.prenom) }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!id && !form.password) {
      toast.error('Le mot de passe est requis pour un nouvel utilisateur')
      return
    }
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (id) await utilisateursService.update(id, payload)
      else await utilisateursService.create(payload)
      toast.success(id ? 'Utilisateur mis à jour' : 'Utilisateur créé')
      navigate('/utilisateurs')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const isSelf = id && parseInt(id) === currentUser?.id

  return (
    <div className="max-w-xl">
      <button
        onClick={() => navigate('/utilisateurs')}
        className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 mb-6">
          <h1 className="text-lg font-bold text-white">
            {id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">

            {/* Lien conducteur en tête, visible seulement pour le rôle conducteur */}
            {form.role === 'conducteur' && (
              <div className="col-span-2">
                <label className="label">Profil conducteur</label>
                <select
                  className="input"
                  value={form.conducteur_id}
                  onChange={e => handleConducteurChange(e.target.value)}
                >
                  <option value="">— Sélectionner un conducteur —</option>
                  {conducteurs.map(c => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Nom *</label>
              <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} required />
            </div>
            <div>
              <label className="label">Prénom *</label>
              <input className="input" value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="col-span-2">
              <label className="label">{id ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required={!id}
                placeholder={id ? '••••••••' : ''}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Rôle *</label>
              <select
                className="input"
                value={form.role}
                onChange={e => set('role', e.target.value)}
                disabled={isSelf}
              >
                <option value="conducteur">Conducteur</option>
                <option value="gestionnaire">Gestionnaire</option>
                <option value="admin">Administrateur</option>
              </select>
              {isSelf && (
                <p className="text-xs text-amber-600 mt-1">Vous ne pouvez pas modifier votre propre rôle.</p>
              )}
            </div>
          </div>

          {id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.actif}
                onChange={e => set('actif', e.target.checked)}
                className="rounded"
                disabled={isSelf}
              />
              <span className="text-sm text-gray-700">Compte actif</span>
              {isSelf && <span className="text-xs text-gray-400">(votre propre compte)</span>}
            </label>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer')}
            </button>
            <button type="button" onClick={() => navigate('/utilisateurs')} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}