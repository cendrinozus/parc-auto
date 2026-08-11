import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { relevesService, vehiculesService } from '../../services'
import toast from 'react-hot-toast'
import { Info, ChevronDown, ChevronUp, UserCheck, Car } from 'lucide-react'

const todayIso = () => new Date().toISOString().slice(0, 10)

function dateFr(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ─── Formulaire de saisie d'un relevé (create ou update) ───────────────────

function RelevéForm({ vehicule, conducteurId, conducteurNom, existingReleve, date, onSuccess }) {
  const [form, setForm] = useState({
    km_debut: existingReleve?.km_debut ?? '',
    observations: existingReleve?.observations ?? ''
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.km_debut === '') { toast.error('Le kilométrage est requis'); return }
    setSubmitting(true)
    try {
      const payload = {
        vehicule_id: vehicule.id,
        conducteur_id: conducteurId,
        date,
        km_debut: parseFloat(form.km_debut),
        observations: form.observations || null
      }
      if (existingReleve) {
        await relevesService.update(existingReleve.id, payload)
        toast.success('Relevé modifié')
      } else {
        await relevesService.create(payload)
        toast.success('Relevé enregistré')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {conducteurNom && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <UserCheck size={15} className="text-cipres-600 flex-shrink-0" />
          <span>Conducteur : <span className="font-semibold text-gray-800">{conducteurNom}</span></span>
        </div>
      )}

      <div>
        <label className="label">Kilométrage du compteur *</label>
        <input
          type="number"
          className="input"
          step="1"
          min="0"
          placeholder="Ex : 45 230"
          value={form.km_debut}
          onChange={e => set('km_debut', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Observations</label>
        <textarea
          className="input"
          rows={2}
          placeholder="Remarques éventuelles..."
          value={form.observations}
          onChange={e => set('observations', e.target.value)}
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Enregistrement...' : existingReleve ? 'Modifier le relevé' : 'Enregistrer le relevé'}
      </button>
    </form>
  )
}

// ─── Carte véhicule avec son formulaire ────────────────────────────────────

function VehiculeCard({ vehicule, conducteurNom, existingReleve, conducteurId, date, onRefresh }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="bg-cipres-600 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">{vehicule.immatriculation}</span>
          <span className="text-cipres-200 text-sm">{vehicule.marque} {vehicule.modele}</span>
        </div>
        {existingReleve && (
          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            {existingReleve.km_debut?.toLocaleString('fr-FR')} km relevé
          </span>
        )}
      </div>
      <div className="p-5">
        <RelevéForm
          vehicule={vehicule}
          conducteurId={conducteurId}
          conducteurNom={conducteurNom}
          existingReleve={existingReleve}
          date={date}
          onSuccess={onRefresh}
        />
      </div>
    </div>
  )
}

// ─── Ligne d'historique ────────────────────────────────────────────────────

function HistoriqueRow({ releve }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 text-left transition-colors"
      >
        <div className="flex-1 grid grid-cols-3 gap-2 items-center text-sm">
          <span className="font-medium text-gray-800 capitalize">
            {dateFr(releve.date)}
          </span>
          <span className="text-gray-500 truncate">
            {releve.conducteur_nom || releve.vehicule_info || '—'}
          </span>
          <span className="text-gray-600 font-medium">
            {releve.km_debut != null ? `${releve.km_debut?.toLocaleString('fr-FR')} km` : '—'}
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-3 text-sm text-gray-600">
          {releve.observations
            ? <><span className="font-medium">Observations :</span> {releve.observations}</>
            : <span className="italic text-gray-400">Aucune observation.</span>}
        </div>
      )}
    </div>
  )
}

// ─── Section admin / gestionnaire ─────────────────────────────────────────

function AdminReleves() {
  const [tousVehicules, setTousVehicules] = useState([])
  const [selectedVehiculeId, setSelectedVehiculeId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [data, setData] = useState(null)   // { vehicule, releve, conducteur_id, conducteur_nom }
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(false)
  const [showHistorique, setShowHistorique] = useState(false)

  useEffect(() => {
    vehiculesService.getAll({ statut: 'actif' })
      .then(res => setTousVehicules(res.data))
      .catch(() => {})
  }, [])

  const fetch = useCallback(async (vehiculeId, date) => {
    setLoading(true)
    try {
      const [infoRes, histRes] = await Promise.all([
        relevesService.pourVehicule({ vehicule_id: vehiculeId, date }),
        relevesService.getHistorique({ vehicule_id: vehiculeId })
      ])
      setData(infoRes.data)
      setHistorique(histRes.data)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectVehicule = (e) => {
    const id = e.target.value
    setSelectedVehiculeId(id)
    setData(null)
    setHistorique([])
    if (id) fetch(parseInt(id), selectedDate)
  }

  const handleChangeDate = (e) => {
    const d = e.target.value
    setSelectedDate(d)
    setData(null)
    if (selectedVehiculeId && d) fetch(parseInt(selectedVehiculeId), d)
  }

  const historiqueFiltre = historique.filter(r => r.date !== selectedDate)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <Car size={18} className="text-amber-600 flex-shrink-0" />
        <span className="text-sm font-medium text-amber-800">Mode administrateur — Saisie par véhicule</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Véhicule</label>
          <select className="input" value={selectedVehiculeId} onChange={handleSelectVehicule}>
            <option value="">— Choisir un véhicule —</option>
            {tousVehicules.map(v => (
              <option key={v.id} value={v.id}>
                {v.immatriculation} — {v.marque} {v.modele}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date du relevé</label>
          <input
            type="date"
            className="input"
            value={selectedDate}
            max={todayIso()}
            onChange={handleChangeDate}
          />
        </div>
      </div>

      {selectedVehiculeId && loading && (
        <p className="text-gray-500 text-sm">Chargement...</p>
      )}

      {selectedVehiculeId && !loading && data && !data.conducteur_id && (
        <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
          <Info size={15} className="flex-shrink-0" />
          <span>Aucun conducteur affecté à ce véhicule. Affectez-en un depuis la page Conducteurs.</span>
        </div>
      )}

      {selectedVehiculeId && !loading && data?.vehicule && data?.conducteur_id && (
        <VehiculeCard
          vehicule={data.vehicule}
          conducteurId={data.conducteur_id}
          conducteurNom={data.conducteur_nom}
          existingReleve={data.releve}
          date={selectedDate}
          onRefresh={() => fetch(parseInt(selectedVehiculeId), selectedDate)}
        />
      )}

      {selectedVehiculeId && !loading && historiqueFiltre.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHistorique(p => !p)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-bold text-gray-800">Historique du véhicule</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{historiqueFiltre.length} relevé{historiqueFiltre.length > 1 ? 's' : ''}</span>
              {showHistorique ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </div>
          </button>
          {showHistorique && (
            <div>{historiqueFiltre.map(r => <HistoriqueRow key={r.id} releve={r} />)}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Section conducteur ────────────────────────────────────────────────────

function ConducteurReleves() {
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [vehicules, setVehicules] = useState([])
  const [releves, setReleves] = useState([])
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHistorique, setShowHistorique] = useState(false)

  const fetchPourDate = useCallback(async (date) => {
    setLoading(true)
    try {
      const [dateRes, histRes] = await Promise.all([
        relevesService.pourDate({ date }),
        relevesService.getHistorique({ date })
      ])
      setVehicules(dateRes.data.vehicules)
      setReleves(dateRes.data.releves)
      setHistorique(histRes.data)
    } catch {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPourDate(selectedDate) }, [fetchPourDate, selectedDate])

  const getReleveForVehicule = (vehiculeId) =>
    releves.find(r => r.vehicule_id === vehiculeId) || null

  const historiqueFiltre = historique.filter(r => r.date !== selectedDate)

  return (
    <div className="space-y-4">
      <div>
        <label className="label flex items-center gap-2">
          <Calendar size={15} className="text-cipres-600" />
          Date du relevé
        </label>
        <input
          type="date"
          className="input max-w-xs"
          value={selectedDate}
          max={todayIso()}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-500 text-sm">Chargement...</p>}

      {!loading && vehicules.length === 0 && (
        <div className="card p-6 text-center text-gray-500 text-sm">
          Aucun véhicule affecté pour cette date.
        </div>
      )}

      {!loading && vehicules.map(v => (
        <VehiculeCard
          key={v.id}
          vehicule={v}
          conducteurId={null}
          conducteurNom={null}
          existingReleve={getReleveForVehicule(v.id)}
          date={selectedDate}
          onRefresh={() => fetchPourDate(selectedDate)}
        />
      ))}

      {!loading && (
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
              ? <p className="px-5 pb-4 text-sm text-gray-400 italic">Aucun relevé antérieur.</p>
              : <div>{historiqueFiltre.map(r => <HistoriqueRow key={r.id} releve={r} />)}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────

export default function MesReleves() {
  const { user } = useAuth()
  const isAdmin = ['admin', 'gestionnaire'].includes(user?.role)
  const isConducteur = Boolean(user?.conducteur_id)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relevés kilométriques</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{dateFr(todayIso())}</p>
      </div>

      {isAdmin && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Saisie pour un conducteur</h2>
          <AdminReleves />
        </section>
      )}

      {isConducteur && (
        <section className="space-y-4">
          {isAdmin && <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Mes propres relevés</h2>}
          <ConducteurReleves />
        </section>
      )}

      {!isConducteur && !isAdmin && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-4 text-sm text-blue-800">
          <Info size={18} className="flex-shrink-0 mt-0.5" />
          <p>Votre compte n'est pas encore lié à un profil conducteur. Contactez l'administrateur.</p>
        </div>
      )}

    </div>
  )
}
