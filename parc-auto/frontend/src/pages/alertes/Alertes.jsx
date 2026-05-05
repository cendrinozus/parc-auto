import { useEffect, useState } from 'react'
import { alertesService } from '../../services'
import { Bell, BellOff, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const typeLabel = { sur_consommation: 'Sur-consommation', entretien: 'Entretien', permis_expire: 'Permis expiré', autre: 'Autre' }
const typeBadge = {
  sur_consommation: 'bg-red-100 text-red-800 border border-red-300',
  entretien: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  permis_expire: 'bg-cipres-100 text-cipres-800 border border-cipres-300',
  autre: 'bg-gray-100 text-gray-800 border border-gray-300'
}

export default function Alertes() {
  const [alertes, setAlertes] = useState([])
  const [filtre, setFiltre] = useState('non_lues')
  const [loading, setLoading] = useState(true)

  const load = () => {
    const params = filtre === 'non_lues' ? { lue: false } : filtre === 'lues' ? { lue: true } : {}
    alertesService.getAll(params).then(r => setAlertes(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filtre])

  const marquerLue = async (id) => {
    await alertesService.marquerLue(id)
    load()
  }

  const toutLire = async () => {
    await alertesService.toutLire()
    toast.success('Toutes les alertes marquées comme lues')
    load()
  }

  const nonLues = alertes.filter(a => !a.lue).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          <p className="text-sm text-gray-500">{nonLues > 0 ? `${nonLues} alerte(s) non lue(s)` : 'Aucune alerte non lue'}</p>
        </div>
        {nonLues > 0 && (
          <button onClick={toutLire} className="btn-secondary flex items-center gap-2 w-fit text-sm">
            <CheckCheck size={15} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {[['non_lues','Non lues'],['lues','Lues'],['toutes','Toutes']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltre(k)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filtre === k
                ? 'bg-cipres-600 text-white shadow-sm'
                : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-cipres-300 hover:text-cipres-700'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div> : alertes.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12">
          <BellOff size={32} className="text-gray-300" />
          <p className="text-gray-400">Aucune alerte</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertes.map(a => (
            <div key={a.id} className={`card flex items-start gap-4 ${a.lue ? 'opacity-60' : 'border-l-4 border-l-cipres-600'}`}>
              <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.lue ? 'bg-gray-100' : 'bg-cipres-100'}`}>
                <Bell size={16} className={a.lue ? 'text-gray-400' : 'text-cipres-600'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${typeBadge[a.type_alerte]}`}>
                    {typeLabel[a.type_alerte]}
                  </span>
                  {!a.lue && <span className="w-2 h-2 rounded-full bg-cipres-600 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-800 font-medium">{a.message}</p>
                {a.seuil_valeur && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seuil : {a.seuil_valeur} · Valeur : <span className="text-red-600 font-semibold">{a.valeur_actuelle}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{new Date(a.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {!a.lue && (
                <button onClick={() => marquerLue(a.id)} className="text-xs text-cipres-600 hover:text-cipres-800 font-semibold hover:underline flex-shrink-0">
                  Marquer lu
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}