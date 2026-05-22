import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pleinsService, vehiculesService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { exportToPdf } from '../../utils/exportPdf'
import { Plus, Trash2, Pencil, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

const ANNEE_COURANTE = new Date().getFullYear()
const ANNEES = Array.from({ length: 5 }, (_, i) => ANNEE_COURANTE - i)

export default function PleinsList() {
  const { user } = useAuth()
  const canWrite = ['admin', 'gestionnaire'].includes(user?.role)
  const navigate = useNavigate()
  const [pleins, setPleins] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [vehiculeFilter, setVehiculeFilter] = useState('')
  const [anneeFilter, setAnneeFilter] = useState(ANNEE_COURANTE)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = { limit: 500 }
    if (vehiculeFilter) params.vehicule_id = vehiculeFilter
    if (anneeFilter) params.annee = anneeFilter
    pleinsService.getAll(params).then(r => setPleins(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { vehiculesService.getAll().then(r => setVehicules(r.data)).catch(() => {}) }, [])
  useEffect(() => { load() }, [vehiculeFilter, anneeFilter])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce plein ?')) return
    try { await pleinsService.delete(id); toast.success('Plein supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  // Filtrage côté client par année (filet de sécurité si le backend ne supporte pas le param)
  const pleinsFiltres = anneeFilter
    ? pleins.filter(p => new Date(p.date_plein).getFullYear() === Number(anneeFilter))
    : pleins

  const totalCout = pleinsFiltres.reduce((s, p) => s + (p.cout_total || 0), 0)
  const totalLitres = pleinsFiltres.reduce((s, p) => s + (p.litres || 0), 0)

  const handleExportPdf = () => {
    const vehiculeLabel = vehiculeFilter
      ? vehicules.find(v => String(v.id) === String(vehiculeFilter))?.immatriculation || ''
      : 'Tous véhicules'
    exportToPdf({
      title: `Pleins carburant — ${anneeFilter || 'Toutes années'} — ${vehiculeLabel}`,
      subtitle: `${pleinsFiltres.length} enregistrement(s) · ${totalLitres.toFixed(1)} L · ${totalCout.toFixed(0)} FCFA`,
      filename: `pleins_${anneeFilter || 'tous'}.pdf`,
      columns: [
        { header: 'Date',       accessor: p => new Date(p.date_plein).toLocaleDateString('fr-FR') },
        { header: 'Véhicule',   accessor: p => p.vehicule_immat },
        { header: 'Conducteur', accessor: p => p.conducteur_nom },
        { header: 'Km compteur', accessor: p => p.km_compteur?.toLocaleString() + ' km' },
        { header: 'Litres',     accessor: p => p.litres + ' L' },
        { header: 'Prix/L',     accessor: p => p.prix_litre + ' FCFA' },
        { header: 'Coût total', accessor: p => p.cout_total + ' FCFA' },
        { header: 'L/100km',    accessor: p => p.consommation_100km ? p.consommation_100km + ' L/100' : null },
      ],
      rows: pleinsFiltres,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Pleins carburant</h1>
          <p className="text-sm text-gray-500">
            {pleinsFiltres.length} enregistrement(s) · {totalLitres.toFixed(1)} L · {totalCout.toFixed(0)} FCFA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={pleinsFiltres.length === 0} className="btn-secondary flex items-center gap-2">
            <FileDown size={16} /> Exporter PDF
          </button>
          {canWrite && (
            <Link to="/pleins/nouveau" className="btn-primary flex items-center gap-2 w-fit">
              <Plus size={16} /> Nouveau plein
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
        {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : pleinsFiltres.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun plein trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Date','Véhicule','Conducteur','Km compteur','Litres','Prix/L','Coût total','L/100km',''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pleinsFiltres.map(p => (
                  <tr key={p.id} className="hover:bg-cipres-50">
                    <td className="px-4 py-3">{new Date(p.date_plein).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 font-bold text-cipres-600 font-mono">{p.vehicule_immat || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{p.conducteur_nom || '—'}</td>
                    <td className="px-4 py-3">{p.km_compteur?.toLocaleString()} km</td>
                    <td className="px-4 py-3">{p.litres} L</td>
                    <td className="px-4 py-3">{p.prix_litre} FCFA</td>
                    <td className="px-4 py-3 font-semibold text-cipres-700">{p.cout_total} FCFA</td>
                    <td className="px-4 py-3">
                      {p.consommation_100km ? (
                        <span className={`font-medium ${p.consommation_100km > 10 ? 'text-red-500' : 'text-green-600'}`}>
                          {p.consommation_100km} L/100
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/pleins/${p.id}/modifier`)} className="text-cipres-400 hover:text-cipres-700" title="Modifier"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600" title="Supprimer"><Trash2 size={15} /></button>
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