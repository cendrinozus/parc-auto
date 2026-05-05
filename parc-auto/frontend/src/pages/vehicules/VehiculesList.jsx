import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { vehiculesService } from '../../services'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const statutBadge = { actif: 'badge-actif', maintenance: 'badge-maintenance', hors_service: 'badge-hors_service' }
const statutLabel = { actif: 'Actif', maintenance: 'Maintenance', hors_service: 'Hors service' }

export default function VehiculesList() {
  const [vehicules, setVehicules] = useState([])
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    vehiculesService.getAll({ statut: statut || undefined })
      .then(r => setVehicules(r.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statut])

  const handleDelete = async (id, immat) => {
    if (!confirm(`Supprimer le véhicule ${immat} ?`)) return
    try {
      await vehiculesService.delete(id)
      toast.success('Véhicule supprimé')
      load()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filtered = vehicules.filter(v =>
    `${v.immatriculation} ${v.marque} ${v.modele}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Véhicules</h1>
          <p className="text-sm text-gray-500">{vehicules.length} véhicule(s) au total</p>
        </div>
        <Link to="/vehicules/nouveau" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={16} /> Nouveau véhicule
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statut} onChange={e => setStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="maintenance">Maintenance</option>
          <option value="hors_service">Hors service</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun véhicule trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Immatriculation','Marque / Modèle','Année','Carburant','Kilométrage','Statut','Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-cipres-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cipres-600">{v.immatriculation}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{v.marque} {v.modele}</td>
                    <td className="px-4 py-3 text-gray-600">{v.annee}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{v.type_carburant}</td>
                    <td className="px-4 py-3 text-gray-600">{v.km_actuel?.toLocaleString()} km</td>
                    <td className="px-4 py-3">
                      <span className={statutBadge[v.statut]}>{statutLabel[v.statut]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/vehicules/${v.id}`} className="text-cipres-600 hover:text-cipres-800"><Eye size={16} /></Link>
                        <Link to={`/vehicules/${v.id}/modifier`} className="text-gray-500 hover:text-gray-700"><Pencil size={16} /></Link>
                        <button onClick={() => handleDelete(v.id, v.immatriculation)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
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