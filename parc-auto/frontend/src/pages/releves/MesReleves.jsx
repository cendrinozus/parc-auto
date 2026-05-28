import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { relevesService } from '../../services'
import toast from 'react-hot-toast'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'

const todayFr = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

function StatutBadge({ statut }) {
  if (statut === 'clos') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Clôturé</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">En cours</span>
}

function VehiculeCard({ vehicule, releve, historique, onRefresh }) {
  const [startForm, setStartForm] = useState({ km_debut: '', observations: '' })
  const [closeForm, setCloseForm] = useState({ km_fin: '', observations: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (releve) return
    const dernier = [...historique]
      .filter(r => r.vehicule_id === vehicule.id && r.km_fin != null)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    if (dernier) setStartForm(p => ({ ...p, km_debut: String(dernier.km_fin) }))
  }, [historique, vehicule.id, releve])

  const setStart = (k, v) => setStartForm(p => ({ ...p, [k]: v }))
  const setClose = (k, v) => setCloseForm(p => ({ ...p, [k]: v }))

  const handleStart = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await relevesService.create({
        vehicule_id: vehicule.id,
        km_debut: startForm.km_debut ? parseFloat(startForm.km_debut) : null,
        observations: startForm.observations || null
      })
      toast.success('Journée démarrée')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await relevesService.update(releve.id, {
        km_fin: closeForm.km_fin ? parseFloat(closeForm.km_fin) : null,
        observations: closeForm.observations,
        statut: 'clos'
      })
      toast.success('Journée clôturée')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const kmParcourus = releve && releve.km_fin != null && releve.km_debut != null
    ? (releve.km_fin - releve.km_debut).toFixed(1)
    : null

  return (
    <div className="card p-0 overflow-hidden">
      {/* Card header */}
      <div className="bg-cipres-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-base">{vehicule.immatriculation}</span>
          <span className="text-cipres-200 text-sm">{vehicule.marque} {vehicule.modele}</span>
        </div>
        {releve && <StatutBadge statut={releve.statut} />}
      </div>

      <div className="p-5 space-y-5">
        {/* STATE: no releve */}
        {!releve && (
          <form onSubmit={handleStart} className="space-y-4">
            <p className="text-sm text-gray-500">Aucun relevé pour ce véhicule aujourd'hui. Démarrez votre journée.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Kilométrage de départ *</label>
                <input
                  type="number"
                  className="input"
                  step="0.1"
                  required
                  value={startForm.km_debut}
                  onChange={e => setStart('km_debut', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Observations</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Remarques, informations sur la journée..."
                  value={startForm.observations}
                  onChange={e => setStart('observations', e.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Démarrage...' : 'Démarrer la journée'}
            </button>
          </form>
        )}

        {/* STATE: en_cours */}
        {releve && releve.statut === 'en_cours' && (
          <>
            {/* Info bar */}
            <div className="flex gap-6 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3">
              <span><span className="font-medium">Km départ :</span> {releve.km_debut ?? '—'}</span>
            </div>

            {/* Clôturer */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-700 mb-3">Clôturer la journée</h3>
              <form onSubmit={handleClose} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kilométrage de fin</label>
                    <input
                      type="number"
                      className="input"
                      step="0.1"
                      value={closeForm.km_fin}
                      onChange={e => setClose('km_fin', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Observations</label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Remarques, informations sur la journée..."
                      value={closeForm.observations}
                      onChange={e => setClose('observations', e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Clôture...' : 'Clôturer la journée'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* STATE: clos */}
        {releve && releve.statut === 'clos' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1 text-sm">
              <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold">Kilométrage</p>
              <p><span className="font-medium">Départ :</span> {releve.km_debut ?? '—'} km</p>
              <p><span className="font-medium">Fin :</span> {releve.km_fin ?? '—'} km</p>
              {kmParcourus != null && (
                <p className="text-cipres-700 font-semibold">Parcourus : {kmParcourus} km</p>
              )}
            </div>

            {releve.observations && (
              <p className="text-sm text-gray-600"><span className="font-medium">Observations :</span> {releve.observations}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoriqueRow({ releve }) {
  const [open, setOpen] = useState(false)
  const kmParcourus = releve.km_fin != null && releve.km_debut != null
    ? (releve.km_fin - releve.km_debut).toFixed(1)
    : null

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 text-left transition-colors"
      >
        <div className="flex-1 grid grid-cols-3 gap-2 items-center">
          <span className="text-sm font-medium text-gray-800 capitalize">
            {new Date(releve.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="text-sm text-gray-500 truncate">{releve.vehicule_info}</span>
          <span className="text-sm text-gray-600">
            {releve.km_debut != null ? `${releve.km_debut} → ${releve.km_fin ?? '?'} km` : '—'}
            {kmParcourus != null && <span className="text-cipres-700 font-medium ml-1">({kmParcourus} km)</span>}
          </span>
        </div>
        <StatutBadge statut={releve.statut} />
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && releve.observations && (
        <div className="px-5 pb-3 text-sm text-gray-600">
          <span className="font-medium">Observations :</span> {releve.observations}
        </div>
      )}
      {open && !releve.observations && (
        <div className="px-5 pb-3 text-sm text-gray-400 italic">Aucune observation.</div>
      )}
    </div>
  )
}

export default function MesReleves() {
  const { user } = useAuth()
  const [vehicules, setVehicules] = useState([])
  const [releves, setReleves] = useState([])
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHistorique, setShowHistorique] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await relevesService.getAujourdhui()
      setVehicules(res.data.vehicules)
      setReleves(res.data.releves)
    } catch {
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchHistorique = useCallback(async () => {
    try {
      const res = await relevesService.getHistorique()
      setHistorique(res.data)
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (user?.conducteur_id) fetchHistorique()
  }, [user, fetchHistorique])

  const getReleveForVehicule = (vehiculeId) =>
    releves.find(r => r.vehicule_id === vehiculeId) || null

  const today = new Date().toISOString().slice(0, 10)
  const historiqueFiltre = historique.filter(r => r.date !== today)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Mes relevés</h1>
        <p className="text-gray-500 text-sm capitalize mt-0.5">{todayFr}</p>
      </div>

      {!user?.conducteur_id && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-4 text-sm text-blue-800">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p>Votre compte n'est pas encore lié à un profil conducteur. Contactez l'administrateur.</p>
        </div>
      )}

      {user?.conducteur_id && loading && (
        <p className="text-gray-500 text-sm">Chargement...</p>
      )}

      {user?.conducteur_id && !loading && vehicules.length === 0 && (
        <div className="card p-6 text-center text-gray-500 text-sm">
          Aucun véhicule ne vous est affecté pour aujourd'hui.
        </div>
      )}

      {user?.conducteur_id && !loading && vehicules.map(v => (
        <VehiculeCard
          key={v.id}
          vehicule={v}
          releve={getReleveForVehicule(v.id)}
          historique={historique}
          onRefresh={fetchData}
        />
      ))}

      {/* Historique */}
      {user?.conducteur_id && (
        <div className="card p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistorique(p => !p)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-bold text-gray-800">Historique des relevés</h2>
            <div className="flex items-center gap-2">
              {historiqueFiltre.length > 0 && (
                <span className="text-xs text-gray-400">{historiqueFiltre.length} relevé{historiqueFiltre.length > 1 ? 's' : ''}</span>
              )}
              {showHistorique ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
          </button>
          {showHistorique && (
            historiqueFiltre.length === 0
              ? <p className="px-5 pb-4 text-sm text-gray-400">Aucun relevé antérieur.</p>
              : <div>{historiqueFiltre.map(r => <HistoriqueRow key={r.id} releve={r} />)}</div>
          )}
        </div>
      )}
    </div>
  )
}
