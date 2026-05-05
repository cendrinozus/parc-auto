import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { vehiculesService } from '../../services'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const defaultForm = {
  immatriculation: '', marque: '', modele: '', annee: new Date().getFullYear(),
  type_carburant: 'diesel', km_initial: 0, km_actuel: 0,
  statut: 'actif', categorie: 'leger', couleur: '', numero_serie: ''
}

export default function VehiculeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) {
      vehiculesService.getById(id).then(r => setForm(r.data)).catch(() => toast.error('Erreur de chargement'))
    }
  }, [id])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) await vehiculesService.update(id, form)
      else await vehiculesService.create(form)
      toast.success(id ? 'Véhicule mis à jour' : 'Véhicule créé')
      navigate('/vehicules')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/vehicules')} className="flex items-center gap-2 text-cipres-600 hover:text-cipres-800 mb-5 text-sm font-medium">
        <ArrowLeft size={16} /> Retour aux véhicules
      </button>
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 mb-6">
          <h1 className="text-lg font-bold text-white">{id ? 'Modifier le véhicule' : 'Nouveau véhicule'}</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Immatriculation *</label>
              <input className="input uppercase" value={form.immatriculation} onChange={e => set('immatriculation', e.target.value)} required disabled={!!id} />
            </div>
            <div>
              <label className="label">Année *</label>
              <input type="number" className="input" value={form.annee} onChange={e => set('annee', parseInt(e.target.value))} min="1990" max={new Date().getFullYear()+1} required />
            </div>
            <div>
              <label className="label">Marque *</label>
              <input className="input" value={form.marque} onChange={e => set('marque', e.target.value)} required />
            </div>
            <div>
              <label className="label">Modèle *</label>
              <input className="input" value={form.modele} onChange={e => set('modele', e.target.value)} required />
            </div>
            <div>
              <label className="label">Type de carburant *</label>
              <select className="input" value={form.type_carburant} onChange={e => set('type_carburant', e.target.value)}>
                <option value="diesel">Diesel</option>
                <option value="essence">Essence</option>
                <option value="hybride">Hybride</option>
                <option value="electrique">Électrique</option>
              </select>
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                <option value="leger">Véhicule léger</option>
                <option value="utilitaire">Utilitaire</option>
                <option value="poids_lourd">Poids lourd</option>
              </select>
            </div>
            <div>
              <label className="label">Km initial</label>
              <input type="number" className="input" value={form.km_initial} onChange={e => set('km_initial', parseFloat(e.target.value))} min="0" />
            </div>
            <div>
              <label className="label">Km actuel</label>
              <input type="number" className="input" value={form.km_actuel} onChange={e => set('km_actuel', parseFloat(e.target.value))} min="0" />
            </div>
            <div>
              <label className="label">Couleur</label>
              <input className="input" value={form.couleur} onChange={e => set('couleur', e.target.value)} placeholder="Blanc, Noir..." />
            </div>
            <div>
              <label className="label">Statut</label>
              <select className="input" value={form.statut} onChange={e => set('statut', e.target.value)}>
                <option value="actif">Actif</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Numéro de série / VIN</label>
            <input className="input" value={form.numero_serie} onChange={e => set('numero_serie', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer le véhicule')}
            </button>
            <button type="button" onClick={() => navigate('/vehicules')} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
