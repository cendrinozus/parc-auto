import { useState, useEffect, useCallback } from 'react'
import { relevesService } from '../../services'
import toast from 'react-hot-toast'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

const today = new Date().toISOString().slice(0, 10)
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

function StatutBadge({ statut }) {
  if (statut === 'clos') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Clôturé</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En cours</span>
}

function ReleveRow({ releve }) {
  const [open, setOpen] = useState(false)
  const kmParcourus = releve.km_fin != null && releve.km_debut != null
    ? (releve.km_fin - releve.km_debut).toFixed(1)
    : null

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 text-left transition-colors"
      >
        <div className="flex-1 grid grid-cols-4 gap-2 items-center text-sm">
          <span className="font-medium text-gray-800">
            {new Date(releve.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-gray-600 font-semibold">{releve.conducteur_nom}</span>
          <span className="text-gray-500 truncate">{releve.vehicule_info}</span>
          <span className="text-gray-600">
            {releve.km_debut != null ? `${releve.km_debut} → ${releve.km_fin ?? '?'} km` : '—'}
            {kmParcourus != null && <span className="text-cipres-700 font-medium ml-1">({kmParcourus} km)</span>}
          </span>
        </div>
        <StatutBadge statut={releve.statut} />
        {open ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-3 text-sm text-gray-600">
          {releve.observations
            ? <><span className="font-medium">Observations :</span> {releve.observations}</>
            : <span className="text-gray-400 italic">Aucune observation.</span>
          }
        </div>
      )}
    </div>
  )
}

export default function TousLesReleves() {
  const [releves, setReleves] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateDebut, setDateDebut] = useState(ninetyDaysAgo)
  const [dateFin, setDateFin] = useState(today)
  const [recherche, setRecherche] = useState('')
  const [toutAfficher, setToutAfficher] = useState(false)

  const fetchReleves = useCallback(async (debut, fin) => {
    setLoading(true)
    try {
      const params = {}
      if (debut) params.date_debut = debut
      if (fin) params.date_fin = fin
      const res = await relevesService.getAll(params)
      setReleves(res.data)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReleves(dateDebut, dateFin) }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    const debut = toutAfficher ? '' : dateDebut
    const fin = toutAfficher ? '' : dateFin
    fetchReleves(debut, fin)
  }

  const handleToutAfficher = () => {
    const next = !toutAfficher
    setToutAfficher(next)
    if (next) fetchReleves('', '')
    else fetchReleves(dateDebut, dateFin)
  }

  const relevesFiltres = releves.filter(r => {
    if (!recherche) return true
    const q = recherche.toLowerCase()
    return (
      r.conducteur_nom?.toLowerCase().includes(q) ||
      r.vehicule_info?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relevés journaliers</h1>
        <p className="text-gray-500 text-sm mt-0.5">Historique de tous les conducteurs</p>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Date début</label>
            <input
              type="date"
              className="input"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              disabled={toutAfficher}
            />
          </div>
          <div>
            <label className="label">Date fin</label>
            <input
              type="date"
              className="input"
              value={dateFin}
              onChange={e => setDateFin(e.target.value)}
              disabled={toutAfficher}
            />
          </div>
          <button type="submit" disabled={loading || toutAfficher} className="btn-primary flex items-center gap-1.5">
            <Search size={15} /> Filtrer
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 ml-2">
            <input
              type="checkbox"
              className="rounded"
              checked={toutAfficher}
              onChange={handleToutAfficher}
            />
            Tout afficher (sans limite de date)
          </label>
        </form>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Rechercher par conducteur ou véhicule..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
      </div>

      {/* Tableau */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">
            {loading ? 'Chargement...' : `${relevesFiltres.length} relevé${relevesFiltres.length !== 1 ? 's' : ''}`}
          </h2>
        </div>

        {/* En-tête colonnes */}
        {relevesFiltres.length > 0 && (
          <div className="grid grid-cols-4 gap-2 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <span>Date</span>
            <span>Conducteur</span>
            <span>Véhicule</span>
            <span>Kilométrage</span>
          </div>
        )}

        {!loading && relevesFiltres.length === 0 && (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Aucun relevé trouvé.</p>
        )}

        {!loading && relevesFiltres.map(r => <ReleveRow key={r.id} releve={r} />)}
      </div>
    </div>
  )
}
