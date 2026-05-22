import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { conducteursService, vehiculesService } from '../../services'
import { ArrowLeft, Plus, Trash2, CircleStop } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = { nom: '', prenom: '', email: '', telephone: '', numero_permis: '', date_expiration_permis: '', actif: true }

function AffectationsBadge({ active }) {
  return active
    ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
    : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Terminée</span>
}

export default function ConducteurForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  // Affectations
  const [affectations, setAffectations] = useState([])
  const [vehicules, setVehicules] = useState([])
  const [affForm, setAffForm] = useState({ vehicule_id: '', type_affectation: 'permanente', notes: '' })
  const [showAffForm, setShowAffForm] = useState(false)
  const [affLoading, setAffLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (id) {
      conducteursService.getById(id)
        .then(r => setForm({ ...r.data, date_expiration_permis: r.data.date_expiration_permis || '' }))
        .catch(() => {})
      loadAffectations()
    }
    vehiculesService.getAll({ statut: 'actif' }).then(r => setVehicules(r.data)).catch(() => {})
  }, [id])

  const loadAffectations = () => {
    conducteursService.getAffectations(id).then(r => setAffectations(r.data)).catch(() => {})
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (id) {
        await conducteursService.update(id, form)
        toast.success('Conducteur mis à jour')
        navigate('/conducteurs')
      } else {
        const res = await conducteursService.create(form)
        toast.success('Conducteur créé')
        navigate(`/conducteurs/${res.data.id}/modifier`)
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setLoading(false) }
  }

  const handleAddAffectation = async (e) => {
    e.preventDefault()
    if (!affForm.vehicule_id) { toast.error('Sélectionnez un véhicule'); return }
    setAffLoading(true)
    try {
      await conducteursService.createAffectation(id, {
        vehicule_id: parseInt(affForm.vehicule_id),
        type_affectation: affForm.type_affectation,
        notes: affForm.notes || null
      })
      toast.success('Affectation créée')
      setAffForm({ vehicule_id: '', type_affectation: 'permanente', notes: '' })
      setShowAffForm(false)
      loadAffectations()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur') }
    finally { setAffLoading(false) }
  }

  const handleTerminer = async (affId) => {
    if (!confirm('Terminer cette affectation ?')) return
    try {
      await conducteursService.terminerAffectation(id, affId)
      toast.success('Affectation terminée')
      loadAffectations()
    } catch { toast.error('Erreur') }
  }

  const handleDeleteAff = async (affId) => {
    if (!confirm('Supprimer cette affectation ?')) return
    try {
      await conducteursService.deleteAffectation(id, affId)
      toast.success('Affectation supprimée')
      loadAffectations()
    } catch { toast.error('Erreur') }
  }

  const isActive = (aff) => !aff.date_fin || new Date(aff.date_fin) >= new Date()

  return (
    <div className="max-w-xl space-y-6">
      <button onClick={() => navigate('/conducteurs')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 text-sm font-medium">
        <ArrowLeft size={16} /> Retour
      </button>

      {/* Formulaire conducteur */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 mb-6">
          <h1 className="text-lg font-bold text-white">{id ? 'Modifier le conducteur' : 'Nouveau conducteur'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Nom *</label><input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} required /></div>
            <div><label className="label">Prénom *</label><input className="input" value={form.prenom} onChange={e => set('prenom', e.target.value)} required /></div>
            <div><label className="label">N° de permis *</label><input className="input" value={form.numero_permis} onChange={e => set('numero_permis', e.target.value)} required disabled={!!id} /></div>
            <div><label className="label">Expiration permis</label><input type="date" className="input" value={form.date_expiration_permis} onChange={e => set('date_expiration_permis', e.target.value)} /></div>
            <div><label className="label">Téléphone</label><input className="input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          </div>
          {id && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.actif} onChange={e => set('actif', e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700">Conducteur actif</span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer')}</button>
            <button type="button" onClick={() => navigate('/conducteurs')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>

      {/* Section affectations */}
      <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">Véhicules affectés</h2>
            {id ? (
              <button
                onClick={() => setShowAffForm(p => !p)}
                className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3"
              >
                <Plus size={15} /> Affecter un véhicule
              </button>
            ) : (
              <span className="text-xs text-gray-400">Enregistrez d'abord le conducteur</span>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAffForm && (
            <form onSubmit={handleAddAffectation} className="px-6 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Véhicule *</label>
                  <select className="input" value={affForm.vehicule_id} onChange={e => setAffForm(p => ({ ...p, vehicule_id: e.target.value }))} required>
                    <option value="">Sélectionner un véhicule</option>
                    {vehicules.map(v => (
                      <option key={v.id} value={v.id}>{v.immatriculation} — {v.marque} {v.modele}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={affForm.type_affectation} onChange={e => setAffForm(p => ({ ...p, type_affectation: e.target.value }))}>
                    <option value="permanente">Permanente</option>
                    <option value="temporaire">Temporaire</option>
                  </select>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input className="input" value={affForm.notes} onChange={e => setAffForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optionnel" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={affLoading} className="btn-primary text-sm py-1.5 px-3">
                  {affLoading ? 'Création...' : 'Créer l\'affectation'}
                </button>
                <button type="button" onClick={() => setShowAffForm(false)} className="btn-secondary text-sm py-1.5 px-3">Annuler</button>
              </div>
            </form>
          )}

          {/* Liste des affectations */}
          <div className="divide-y divide-gray-100">
            {affectations.length === 0 && (
              <p className="px-6 py-5 text-sm text-gray-400">Aucune affectation enregistrée.</p>
            )}
            {affectations.map(aff => (
              <div key={aff.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-cipres-700 font-mono">{aff.vehicule_immat}</p>
                  <p className="text-sm text-gray-500">{aff.vehicule_label} · <span className="capitalize">{aff.type_affectation}</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Depuis le {new Date(aff.date_debut).toLocaleDateString('fr-FR')}
                    {aff.date_fin && ` → ${new Date(aff.date_fin).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <AffectationsBadge active={isActive(aff)} />
                <div className="flex items-center gap-2">
                  {isActive(aff) && (
                    <button onClick={() => handleTerminer(aff.id)} className="text-amber-500 hover:text-amber-700" title="Terminer l'affectation">
                      <CircleStop size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteAff(aff.id)} className="text-red-400 hover:text-red-600" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}
