import { useState, useEffect } from 'react'
import { parametresService } from '../../services'
import { Settings, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const CARBURANTS = [
  { cle: 'prix_diesel',     label: 'Diesel',      couleur: 'bg-yellow-100 text-yellow-800' },
  { cle: 'prix_essence',    label: 'Essence',     couleur: 'bg-blue-100 text-blue-800' },
  { cle: 'prix_hybride',    label: 'Hybride',     couleur: 'bg-green-100 text-green-800' },
  { cle: 'prix_electrique', label: 'Électrique',  couleur: 'bg-purple-100 text-purple-800' },
]

export default function Parametres() {
  const [prix, setPrix] = useState({ prix_diesel: '', prix_essence: '', prix_hybride: '', prix_electrique: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    parametresService.getAll()
      .then(r => {
        const map = {}
        r.data.forEach(p => { map[p.cle] = p.valeur })
        setPrix(prev => ({ ...prev, ...map }))
      })
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = CARBURANTS.map(({ cle }) => ({ cle, valeur: prix[cle] || '0' }))
      await parametresService.update(payload)
      toast.success('Paramètres enregistrés')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="max-w-lg space-y-5">
      <div className="border-l-4 border-cipres-600 pl-4">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Configuration générale du parc automobile</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 flex items-center gap-3">
          <Settings size={18} className="text-white" />
          <h2 className="text-base font-bold text-white">Prix des carburants</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Ces prix seront utilisés par défaut lors de l'enregistrement d'un plein.
          </p>

          <div className="space-y-3">
            {CARBURANTS.map(({ cle, label, couleur }) => (
              <div key={cle} className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-24 text-center ${couleur}`}>
                  {label}
                </span>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    className="input pr-16"
                    step="0.001"
                    min="0"
                    value={prix[cle]}
                    onChange={e => setPrix(p => ({ ...p, [cle]: e.target.value }))}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                    FCFA/L
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
