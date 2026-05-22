import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { entretiensService, vehiculesService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { exportToPdf } from '../../utils/exportPdf'
import { Plus, Trash2, Pencil, Wrench, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

const ANNEE_COURANTE = new Date().getFullYear()
const ANNEES = Array.from({ length: 5 }, (_, i) => ANNEE_COURANTE - i)

export default function EntretiensList() {
  const { user } = useAuth()
  const canWrite = ['admin', 'gestionnaire'].includes(user?.role)
  const navigate = useNavigate()
  const [entretiens, setEntretiens] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [vehiculeFilter, setVehiculeFilter] = useState('')
  const [anneeFilter, setAnneeFilter] = useState(ANNEE_COURANTE)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = {}
    if (vehiculeFilter) params.vehicule_id = vehiculeFilter
    if (anneeFilter) params.annee = anneeFilter
    entretiensService.getAll(params).then(r => setEntretiens(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { vehiculesService.getAll().then(r => setVehicules(r.data)).catch(() => {}) }, [])
  useEffect(() => { load() }, [vehiculeFilter, anneeFilter])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet entretien ?')) return
    try { await entretiensService.delete(id); toast.success('Entretien supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  const totalCout = entretiens.reduce((s, e) => s + (e.cout || 0), 0)

  const handleExportPdf = () => {
    const vehiculeLabel = vehiculeFilter
      ? vehicules.find(v => String(v.id) === String(vehiculeFilter))?.immatriculation || ''
      : 'Tous véhicules'
    exportToPdf({
      title: `Entretiens & réparations — ${anneeFilter || 'Toutes années'} — ${vehiculeLabel}`,
      subtitle: `${entretiens.length} enregistrement(s) · Coût total : ${totalCout.toLocaleString()} FCFA`,
      filename: `entretiens_${anneeFilter || 'tous'}.pdf`,
      columns: [
        { header: 'Date',     accessor: e => new Date(e.date_entretien).toLocaleDateString('fr-FR') },
        { header: 'Véhicule', accessor: e => e.vehicule_immat },
        { header: 'Objet',    accessor: e => e.objet },
        { header: 'Garage',   accessor: e => e.garage },
        { header: 'Coût (FCFA)', accessor: e => e.cout?.toLocaleString() },
        { header: 'Notes',    accessor: e => e.notes },
      ],
      rows: entretiens,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Entretiens & réparations</h1>
          <p className="text-sm text-gray-500">
            {entretiens.length} enregistrement(s) · Coût total : {totalCout.toLocaleString()} FCFA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={entretiens.length === 0} className="btn-secondary flex items-center gap-2">
            <FileDown size={16} /> Exporter PDF
          </button>
          {canWrite && (
            <Link to="/entretiens/nouveau" className="btn-primary flex items-center gap-2 w-fit">
              <Plus size={16} /> Nouvel entretien
            </Link>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select className="input sm:w-32" value={anneeFilter} onChange={e => setAnneeFilter(e.target.value)}>
          {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
          <option value="">Toutes les années</option>
        </select>
        <select className="input sm:w-72" value={vehiculeFilter} onChange={e => setVehiculeFilter(e.target.value)}>
          <option value="">Tous les véhicules</option>
          {vehicules.map(v => <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : entretiens.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun entretien trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Date', 'Véhicule', 'Objet', 'Garage', 'Coût', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entretiens.map(e => (
                  <tr key={e.id} className="hover:bg-cipres-50">
                    <td className="px-4 py-3">{new Date(e.date_entretien).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-bold text-cipres-600 font-mono">{e.vehicule_immat || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Wrench size={13} className="text-gray-400 flex-shrink-0" />
                        <span>{e.objet}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.garage || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-cipres-700">{e.cout?.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/entretiens/${e.id}/modifier`)} className="text-cipres-400 hover:text-cipres-700" title="Modifier">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600" title="Supprimer">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
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
