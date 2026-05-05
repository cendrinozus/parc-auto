import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { utilisateursService } from '../../services'
import { Plus, Search, Pencil, Trash2, ShieldCheck, User, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ROLE_LABELS = { admin: 'Administrateur', gestionnaire: 'Gestionnaire', conducteur: 'Conducteur' }
const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  gestionnaire: 'bg-blue-100 text-blue-700',
  conducteur: 'bg-gray-100 text-gray-700'
}
const ROLE_ICONS = { admin: ShieldCheck, gestionnaire: Settings, conducteur: User }

export default function UtilisateursList() {
  const { user: currentUser } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    utilisateursService.getAll()
      .then(r => setUtilisateurs(r.data))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id, nom) => {
    if (!confirm(`Supprimer l'utilisateur ${nom} ? Cette action est irréversible.`)) return
    try {
      await utilisateursService.delete(id)
      toast.success('Utilisateur supprimé')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de suppression')
    }
  }

  const filtered = utilisateurs.filter(u =>
    `${u.nom} ${u.prenom} ${u.email} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">{utilisateurs.length} compte(s)</p>
        </div>
        <Link to="/utilisateurs/nouveau" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={16} /> Nouvel utilisateur
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucun utilisateur trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Nom complet', 'Email', 'Rôle', 'Statut', 'Créé le', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(u => {
                  const RoleIcon = ROLE_ICONS[u.role] || User
                  const isSelf = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className="hover:bg-cipres-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-cipres-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {u.prenom} {u.nom}
                            {isSelf && <span className="ml-1 text-xs text-cipres-500">(vous)</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                          <RoleIcon size={12} />
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={u.actif ? 'badge-actif' : 'badge-hors_service'}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/utilisateurs/${u.id}/modifier`}
                            className="text-gray-500 hover:text-cipres-600"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </Link>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(u.id, `${u.prenom} ${u.nom}`)}
                              className="text-red-400 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}