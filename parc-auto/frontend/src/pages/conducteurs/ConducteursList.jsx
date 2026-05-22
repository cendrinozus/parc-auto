import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { conducteursService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { exportToPdf } from '../../utils/exportPdf'
import { Plus, Search, Pencil, Trash2, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ConducteursList() {
  const { user } = useAuth()
  const canWrite = ['admin', 'gestionnaire'].includes(user?.role)
  const [conducteurs, setConducteurs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    conducteursService.getAll().then(r => setConducteurs(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer ${nom} ?`)) return
    try {
      await conducteursService.delete(id)
      toast.success('Conducteur supprimé')
      load()
    } catch { toast.error('Erreur de suppression') }
  }

  const filtered = conducteurs.filter(c =>
    `${c.nom} ${c.prenom} ${c.numero_permis}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleExportPdf = () => {
    exportToPdf({
      title: 'Liste des conducteurs',
      subtitle: `${filtered.length} conducteur(s)`,
      filename: 'conducteurs.pdf',
      columns: [
        { header: 'Nom',              accessor: c => `${c.nom} ${c.prenom}` },
        { header: 'N° Permis',        accessor: c => c.numero_permis },
        { header: 'Expiration permis', accessor: c => c.date_expiration_permis ? new Date(c.date_expiration_permis).toLocaleDateString('fr-FR') : null },
        { header: 'Téléphone',        accessor: c => c.telephone },
        { header: 'Email',            accessor: c => c.email },
        { header: 'Statut',           accessor: c => c.actif ? 'Actif' : 'Inactif' },
      ],
      rows: filtered,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Conducteurs</h1>
          <p className="text-sm text-gray-500">{conducteurs.length} conducteur(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={filtered.length === 0} className="btn-secondary flex items-center gap-2">
            <FileDown size={16} /> Exporter PDF
          </button>
          {canWrite && (
            <Link to="/conducteurs/nouveau" className="btn-primary flex items-center gap-2 w-fit">
              <Plus size={16} /> Nouveau conducteur
            </Link>
          )}
        </div>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun conducteur trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Nom complet','Permis','Expiration permis','Téléphone','Email','Statut','Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-cipres-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.nom} {c.prenom}</td>
                    <td className="px-4 py-3 font-mono text-sm text-cipres-700">{c.numero_permis}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.date_expiration_permis ? new Date(c.date_expiration_permis).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.telephone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={c.actif ? 'badge-actif' : 'badge-hors_service'}>
                        {c.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-2">
                          <Link to={`/conducteurs/${c.id}/modifier`} className="text-gray-500 hover:text-cipres-600"><Pencil size={16} /></Link>
                          <button onClick={() => handleDelete(c.id, `${c.prenom} ${c.nom}`)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
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