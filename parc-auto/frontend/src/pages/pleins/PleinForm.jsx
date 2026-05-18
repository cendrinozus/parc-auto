import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { pleinsService, vehiculesService, conducteursService, parametresService } from '../../services'
import { ArrowLeft, Fuel } from 'lucide-react'
import toast from 'react-hot-toast'

const LABEL_CARBURANT = { essence: 'Essence', diesel: 'Diesel', hybride: 'Hybride', electrique: 'Électrique' }

export default function PleinForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [vehicules, setVehicules] = useState([])
  const [conducteurs, setConducteurs] = useState([])
  const [prixCarburants, setPrixCarburants] = useState({})
  const [vehiculeInfo, setVehiculeInfo] = useState(null)
  const [minKm, setMinKm] = useState(0)
  const [kmError, setKmError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)

  const now = new Date().toISOString().slice(0, 16)
  const [form, setForm] = useState({
    vehicule_id: searchParams.get('vehicule_id') || '',
    conducteur_id: '',
    date_plein: now,
    km_compteur: '',
    litres: '',
    prix_litre: '',
    station: '',
    motif: 'Plein ordinaire',
    plein_complet: true,
    notes: ''
  })

  useEffect(() => {
    vehiculesService.getAll({ statut: 'actif' }).then(r => setVehicules(r.data)).catch(() => {})
    conducteursService.getAll({ actif: true }).then(r => setConducteurs(r.data)).catch(() => {})
    parametresService.getAll().then(r => {
      const map = {}
      r.data.forEach(p => { map[p.cle] = parseFloat(p.valeur) || 0 })
      setPrixCarburants(map)
    }).catch(() => {})
  }, [])

  // Mode édition : charger les données du plein et calculer le km minimum
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      setInitialLoading(true)
      try {
        const { data: p } = await pleinsService.getById(id)
        setForm({
          vehicule_id: String(p.vehicule_id),
          conducteur_id: p.conducteur_id ? String(p.conducteur_id) : '',
          date_plein: p.date_plein.slice(0, 16),
          km_compteur: p.km_compteur,
          litres: p.litres,
          prix_litre: p.prix_litre,
          station: p.station || '',
          motif: p.motif || '',
          plein_complet: p.plein_complet,
          notes: p.notes || ''
        })
        // Trouver le plein précédent (km max parmi les autres pleins du même véhicule avec km < km actuel)
        const { data: tous } = await pleinsService.getAll({ vehicule_id: p.vehicule_id, limit: 500 })
        const precedent = tous
          .filter(x => x.id !== parseInt(id) && x.km_compteur < p.km_compteur)
          .sort((a, b) => b.km_compteur - a.km_compteur)[0]
        setMinKm(precedent ? precedent.km_compteur : 0)
      } finally {
        setInitialLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  // Mode création : mettre à jour vehiculeInfo, minKm (depuis les pleins réels) et prix_litre
  useEffect(() => {
    if (isEdit || !form.vehicule_id) { if (!isEdit) setVehiculeInfo(null); return }
    const v = vehicules.find(v => v.id === parseInt(form.vehicule_id))
    setVehiculeInfo(v || null)
    setKmError('')
    if (v?.type_carburant) {
      const prixConfig = prixCarburants[`prix_${v.type_carburant}`]
      if (prixConfig > 0) set('prix_litre', prixConfig)
    }
    // Chercher le dernier km réel depuis les pleins (km_actuel peut être obsolète après suppression)
    pleinsService.getAll({ vehicule_id: v.id, limit: 100 })
      .then(r => {
        const kms = r.data.map(p => p.km_compteur)
        setMinKm(kms.length > 0 ? Math.max(...kms) : 0)
      })
      .catch(() => setMinKm(v?.km_actuel || 0))
  }, [form.vehicule_id, vehicules, isEdit, prixCarburants])

  // Mode édition : afficher l'info carburant une fois les véhicules chargés
  useEffect(() => {
    if (!isEdit || !form.vehicule_id || vehicules.length === 0) return
    const v = vehicules.find(v => v.id === parseInt(form.vehicule_id))
    setVehiculeInfo(v || null)
  }, [form.vehicule_id, vehicules, isEdit])

  const coutTotal = form.litres && form.prix_litre
    ? (parseFloat(form.litres) * parseFloat(form.prix_litre)).toFixed(0)
    : '—'

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validateKm = (val) => {
    const km = parseFloat(val)
    if (minKm > 0 && km < minKm) {
      const msg = `Le km doit être ≥ ${minKm.toLocaleString()} km (dernier relevé)`
      setKmError(msg)
      return false
    }
    setKmError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.conducteur_id) { toast.error('Veuillez sélectionner un conducteur'); return }
    if (!form.motif.trim()) { toast.error('Veuillez indiquer un motif'); return }
    if (!validateKm(form.km_compteur)) { toast.error(kmError || 'Km compteur invalide'); return }

    setLoading(true)
    try {
      const payload = {
        ...form,
        vehicule_id: parseInt(form.vehicule_id),
        conducteur_id: parseInt(form.conducteur_id),
        km_compteur: parseFloat(form.km_compteur),
        litres: parseFloat(form.litres),
        prix_litre: parseFloat(form.prix_litre)
      }
      if (isEdit) {
        await pleinsService.update(id, payload)
        toast.success('Plein modifié')
      } else {
        await pleinsService.create(payload)
        toast.success('Plein enregistré')
      }
      navigate('/pleins')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate('/pleins')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium">
        <ArrowLeft size={16} /> Retour
      </button>
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4">
          <h1 className="text-lg font-bold text-white">
            {isEdit ? 'Modifier un plein' : 'Enregistrer un plein'}
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Véhicule — non modifiable en mode édition */}
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

          {/* Carburant en lecture seule depuis le véhicule */}
          {vehiculeInfo && (
            <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <Fuel size={15} className="text-cipres-600" />
              <span className="text-gray-600">Type de carburant :</span>
              <span className="font-semibold text-cipres-700">
                {LABEL_CARBURANT[vehiculeInfo.type_carburant] || vehiculeInfo.type_carburant}
              </span>
            </div>
          )}

          {/* Conducteur */}
          <div>
            <label className="label">Conducteur *</label>
            <select className="input" value={form.conducteur_id} onChange={e => set('conducteur_id', e.target.value)} required>
              <option value="">Sélectionner un conducteur</option>
              {conducteurs.map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>

          {/* Motif */}
          <div>
            <label className="label">Motif *</label>
            <input
              className="input"
              value={form.motif}
              onChange={e => set('motif', e.target.value)}
              required
              placeholder="Ex: Mission de service, Tournée terrain..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date et heure *</label>
              <input
                type="datetime-local"
                className="input"
                value={form.date_plein}
                onChange={e => set('date_plein', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Km compteur *</label>
              <input
                type="number"
                className={`input ${kmError ? 'border-red-500 focus:ring-red-500' : ''}`}
                step="0.1"
                min={minKm || 0}
                value={form.km_compteur}
                onChange={e => { set('km_compteur', e.target.value); if (kmError) validateKm(e.target.value) }}
                onBlur={e => validateKm(e.target.value)}
                required
                placeholder={minKm ? `≥ ${minKm.toLocaleString()}` : 'Ex: 45230'}
              />
              {kmError
                ? <p className="text-xs text-red-500 mt-1">{kmError}</p>
                : minKm > 0 && <p className="text-xs text-gray-400 mt-1">Dernier relevé : {minKm.toLocaleString()} km</p>
              }
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

          <div>
            <label className="label">Station</label>
            <input className="input" value={form.station} onChange={e => set('station', e.target.value)} placeholder="Total, Shell..." />
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
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : isEdit ? 'Enregistrer les modifications' : 'Enregistrer le plein'}
            </button>
            <button type="button" onClick={() => navigate('/pleins')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
