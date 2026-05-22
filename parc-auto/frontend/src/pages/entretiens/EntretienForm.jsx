import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { entretiensService, vehiculesService } from '../../services'
import { ArrowLeft, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'

const now = () => new Date().toISOString().slice(0, 16)

export default function EntretienForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [vehicules, setVehicules] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  const [form, setForm] = useState({
    vehicule_id: '',
    date_entretien: now(),
    objet: '',
    garage: '',
    cout: '',
    notes: ''
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    vehiculesService.getAll({ statut: 'actif' }).then(r => setVehicules(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setInitialLoading(true)
    entretiensService.getById(id)
      .then(r => {
        const e = r.data
        setForm({
          vehicule_id: String(e.vehicule_id),
          date_entretien: e.date_entretien.slice(0, 16),
          objet: e.objet || '',
          garage: e.garage || '',
          cout: e.cout ?? '',
          notes: e.notes || ''
        })
      })
      .catch(() => navigate('/entretiens'))
      .finally(() => setInitialLoading(false))
  }, [id, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        vehicule_id: parseInt(form.vehicule_id),
        cout: parseFloat(form.cout) || 0
      }
      if (isEdit) {
        await entretiensService.update(id, payload)
        toast.success('Entretien modifié')
      } else {
        await entretiensService.create(payload)
        toast.success('Entretien enregistré')
      }
      navigate('/entretiens')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate('/entretiens')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium">
        <ArrowLeft size={16} /> Retour
      </button>

      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 flex items-center gap-3">
          <Wrench size={18} className="text-white" />
          <h1 className="text-lg font-bold text-white">
            {isEdit ? 'Modifier l\'entretien' : 'Nouvel entretien / réparation'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Véhicule *</label>
            <select
              className="input disabled:bg-gray-50 disabled:text-gray-500"
              value={form.vehicule_id}
              onChange={e => set('vehicule_id', e.target.value)}
              required
              disabled={isEdit}
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicules.map(v => (
                <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Objet *</label>
            <input
              className="input"
              value={form.objet}
              onChange={e => set('objet', e.target.value)}
              required
              placeholder="Ex: Vidange, Changement plaquettes, Révision..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.date_entretien}
                onChange={e => set('date_entretien', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Coût (FCFA) *</label>
              <input
                type="number"
                className="input"
                step="1"
                min="0"
                value={form.cout}
                onChange={e => set('cout', e.target.value)}
                required
                placeholder="Ex: 150000"
              />
            </div>
          </div>

          <div>
            <label className="label">Garage / Prestataire</label>
            <input
              className="input"
              value={form.garage}
              onChange={e => set('garage', e.target.value)}
              placeholder="Ex: Garage Central, Atelier CIPRES..."
            />
          </div>

          {form.cout > 0 && (
            <div className="bg-cipres-50 border-l-4 border-cipres-600 rounded-r-lg px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-cipres-700 font-semibold">Coût total</span>
              <span className="text-xl font-bold text-cipres-700">{parseFloat(form.cout).toLocaleString()} FCFA</span>
            </div>
          )}

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input h-20 resize-none"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Pièces remplacées, observations..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => navigate('/entretiens')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
