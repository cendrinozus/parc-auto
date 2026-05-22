import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { vehiculesService, pleinsService, rapportsService, echeancesService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { ArrowLeft, Pencil, Fuel, Plus, Trash2, CalendarClock } from 'lucide-react'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TYPES_DOCUMENT = [
  { value: 'visite_technique', label: 'Visite technique' },
  { value: 'assurance',        label: 'Assurance' },
  { value: 'tvm',              label: 'TVM' },
  { value: 'carte_orange',     label: 'Carte orange' },
]

function echeanceStatut(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr)
  const diff = Math.round((d - today) / 86400000)
  if (diff < 0) return { label: 'Expirée', cls: 'bg-red-100 text-red-700' }
  if (diff <= 15) return { label: `${diff}j restants`, cls: 'bg-orange-100 text-orange-700' }
  return { label: `${diff}j restants`, cls: 'bg-green-100 text-green-700' }
}

function EcheancesSection({ vehiculeId, isAdmin }) {
  const [echeances, setEcheances] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type_document: 'visite_technique', date_echeance: '', notes: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => echeancesService.getByVehicule(vehiculeId).then(r => setEcheances(r.data)).catch(() => {})

  useEffect(() => { load() }, [vehiculeId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await echeancesService.update(editId, form)
        toast.success('Échéance mise à jour')
      } else {
        await echeancesService.create(vehiculeId, form)
        toast.success('Échéance créée')
      }
      setForm({ type_document: 'visite_technique', date_echeance: '', notes: '' })
      setEditId(null)
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ech) => {
    setForm({ type_document: ech.type_document, date_echeance: ech.date_echeance, notes: ech.notes || '' })
    setEditId(ech.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette échéance ?')) return
    try {
      await echeancesService.delete(id)
      toast.success('Échéance supprimée')
      load()
    } catch { toast.error('Erreur') }
  }

  const cancel = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ type_document: 'visite_technique', date_echeance: '', notes: '' })
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-cipres-600 rounded-full" />
          <h2 className="text-base font-bold text-gray-800">Échéances documents</h2>
        </div>
        {isAdmin && (
          <button onClick={() => { cancel(); setShowForm(p => !p) }} className="btn-primary text-xs flex items-center gap-1">
            <Plus size={13} /> Ajouter
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type de document *</label>
              <select className="input" value={form.type_document} onChange={e => setForm(p => ({ ...p, type_document: e.target.value }))} required>
                {TYPES_DOCUMENT.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date d'échéance *</label>
              <input type="date" className="input" required value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optionnel" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary text-sm py-1.5 px-3">
              {saving ? 'Enregistrement...' : (editId ? 'Mettre à jour' : 'Créer')}
            </button>
            <button type="button" onClick={cancel} className="btn-secondary text-sm py-1.5 px-3">Annuler</button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100">
        {echeances.length === 0 && (
          <p className="px-6 py-5 text-sm text-gray-400">Aucune échéance enregistrée.</p>
        )}
        {echeances.map(ech => {
          const statut = echeanceStatut(ech.date_echeance)
          return (
            <div key={ech.id} className="px-6 py-3 flex items-center gap-4">
              <CalendarClock size={16} className="text-cipres-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{ech.label}</p>
                <p className="text-xs text-gray-500">
                  {new Date(ech.date_echeance).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {ech.notes && ` · ${ech.notes}`}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statut.cls}`}>{statut.label}</span>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(ech)} className="text-cipres-400 hover:text-cipres-700" title="Modifier">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(ech.id)} className="text-red-400 hover:text-red-600" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VehiculeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [pleins, setPleins] = useState([])
  const [evolution, setEvolution] = useState([])
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    vehiculesService.getStats(id).then(r => setStats(r.data)).catch(() => {})
    pleinsService.getAll({ vehicule_id: id, limit: 10 }).then(r => setPleins(r.data)).catch(() => {})
    rapportsService.evolutionConso(id).then(r => setEvolution(r.data)).catch(() => {})
  }, [id])

  if (!stats) return <div className="p-8 text-center text-gray-400">Chargement...</div>
  const v = stats.vehicule

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/vehicules" className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 text-sm font-medium">
          <ArrowLeft size={16} /> Retour aux véhicules
        </Link>
        <Link to={`/vehicules/${id}/modifier`} className="btn-secondary flex items-center gap-2">
          <Pencil size={15} /> Modifier
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="bg-cipres-600 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{v.marque} {v.modele}</h1>
              <p className="font-mono text-cipres-200 text-lg font-bold">{v.immatriculation}</p>
              <p className="text-cipres-200 text-sm mt-0.5">{v.annee} · {v.type_carburant} · {v.categorie}</p>
            </div>
            <span className={`badge-${v.statut}`}>{v.statut}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {[
            ['Km actuel', `${v.km_actuel?.toLocaleString()} km`],
            ['Nb pleins', stats.nb_pleins],
            ['Litres total', `${stats.total_litres} L`],
            ['Coût total', `${stats.total_cout} FCFA`],
          ].map(([label, val]) => (
            <div key={label} className="p-5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {evolution.length > 1 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-cipres-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Évolution consommation (L/100km)</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="km" tick={{ fontSize: 11 }} tickFormatter={v => `${v.toLocaleString()} km`} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={v => `${v} L/100km`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Line type="monotone" dataKey="conso" stroke="#AD522D" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <EcheancesSection vehiculeId={id} isAdmin={isAdmin} />

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-cipres-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Derniers pleins</h2>
          </div>
          <Link to={`/pleins/nouveau`} className="btn-primary text-xs flex items-center gap-1">
            <Fuel size={13} /> Nouveau plein
          </Link>
        </div>
        {pleins.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">Aucun plein enregistré</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Date','Km','Litres','Prix/L','Coût','L/100km','Station'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pleins.map(p => (
                  <tr key={p.id} className="hover:bg-cipres-50">
                    <td className="px-3 py-2">{new Date(p.date_plein).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-2">{p.km_compteur?.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.litres} L</td>
                    <td className="px-3 py-2">{p.prix_litre} FCFA</td>
                    <td className="px-3 py-2 font-semibold text-cipres-700">{p.cout_total} FCFA</td>
                    <td className="px-3 py-2">{p.consommation_100km ? `${p.consommation_100km}` : '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{p.station || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}