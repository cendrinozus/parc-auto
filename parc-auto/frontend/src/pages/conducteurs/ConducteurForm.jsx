import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { conducteursService } from '../../services'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = { nom: '', prenom: '', email: '', telephone: '', numero_permis: '', date_expiration_permis: '', actif: true }

export default function ConducteurForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) conducteursService.getById(id).then(r => setForm({ ...r.data, date_expiration_permis: r.data.date_expiration_permis || '' })).catch(() => {})
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (id) await conducteursService.update(id, form)
      else await conducteursService.create(form)
      toast.success(id ? 'Conducteur mis à jour' : 'Conducteur créé')
      navigate('/conducteurs')
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate('/conducteurs')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium">
        <ArrowLeft size={16} /> Retour
      </button>
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 mb-6">
          <h1 className="text-lg font-bold text-white">{id ? 'Modifier le conducteur' : 'Nouveau conducteur'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} required /></div>
            <div><label className="label">Prénom *</label><input className="input" value={form.prenom} onChange={e => set('prenom', e.target.value)} required /></div>
            <div><label className="label">N° de permis *</label><input className="input" value={form.numero_permis} onChange={e => set('numero_permis', e.target.value)} required disabled={!!id} /></div>
            <div><label className="label">Expiration permis</label><input type="date" className="input" value={form.date_expiration_permis} onChange={e => set('date_expiration_permis', e.target.value)} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          {id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Conducteur actif</span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer')}</button>
            <button type="button" onClick={() => navigate('/conducteurs')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
