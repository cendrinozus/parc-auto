import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pleinsService, vehiculesService } from '../../services'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PleinForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [vehicules, setVehicules] = useState([])
  const [loading, setLoading] = useState(false)
  const now = new Date().toISOString().slice(0, 16)
  const [form, setForm] = useState({
    vehicule_id: searchParams.get('vehicule_id') || '',
    date_plein: now,
    km_compteur: '',
    litres: '',
    prix_litre: '',
    station: '',
    type_carburant: 'diesel',
    plein_complet: true,
    notes: ''
  })

  useEffect(() => { vehiculesService.getAll({ statut: 'actif' }).then(r => setVehicules(r.data)).catch(() => {}) }, [])

  const coutTotal = form.litres && form.prix_litre ? (parseFloat(form.litres) * parseFloat(form.prix_litre)).toFixed(0) : '—'

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await pleinsService.create({ ...form, vehicule_id: parseInt(form.vehicule_id) })
      toast.success('Plein enregistré')
      navigate('/pleins')
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate('/pleins')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium">
        <ArrowLeft size={16} /> Retour
      </button>
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4">
          <h1 className="text-lg font-bold text-white">Enregistrer un plein</h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Véhicule *</label>
            <select className="input" value={form.vehicule_id} onChange={e => set('vehicule_id', e.target.value)} required>
              <option value="">Sélectionner un véhicule</option>
              {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date et heure *</label>
              <input type="datetime-local" className="input" value={form.date_plein} onChange={e => set('date_plein', e.target.value)} required />
            </div>
            <div>
              <label className="label">Km compteur *</label>
              <input type="number" className="input" step="0.1" min="0" value={form.km_compteur} onChange={e => set('km_compteur', e.target.value)} required placeholder="Ex: 45230" />
            </div>
            <div>
              <label className="label">Litres *</label>
              <input type="number" className="input" step="0.01" min="0.01" value={form.litres} onChange={e => set('litres', e.target.value)} required placeholder="Ex: 40.5" />
            </div>
            <div>
              <label className="label">Prix / litre (FCFA) *</label>
              <input type="number" className="input" step="0.001" min="0.01" value={form.prix_litre} onChange={e => set('prix_litre', e.target.value)} required placeholder="Ex: 620" />
            </div>
          </div>

          {/* Coût estimé */}
          <div className="bg-cipres-50 border-l-4 border-cipres-600 rounded-r-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-cipres-700 font-semibold">Coût total estimé</span>
            <span className="text-xl font-bold text-cipres-700">{coutTotal} FCFA</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Station</label>
              <input className="input" value={form.station} onChange={e => set('station', e.target.value)} placeholder="Total, Shell..." />
            </div>
            <div>
              <label className="label">Type de carburant</label>
              <select className="input" value={form.type_carburant} onChange={e => set('type_carburant', e.target.value)}>
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
                <option value="hybride">Hybride</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.plein_complet} onChange={e => set('plein_complet', e.target.checked)} className="rounded accent-cipres-600" />
            <span className="text-sm text-gray-700">Plein complet (utilisé pour le calcul de consommation)</span>
          </label>
          <div>
            <label className="label">Notes</label>
            <textarea className="input h-20 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Remarques..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enregistrement...' : 'Enregistrer le plein'}</button>
            <button type="button" onClick={() => navigate('/pleins')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}