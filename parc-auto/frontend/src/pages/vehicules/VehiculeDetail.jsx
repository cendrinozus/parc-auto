import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { vehiculesService, pleinsService, rapportsService } from '../../services'
import { ArrowLeft, Pencil, Fuel } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function VehiculeDetail() {
  const { id } = useParams()
  const [stats, setStats] = useState(null)
  const [pleins, setPleins] = useState([])
  const [evolution, setEvolution] = useState([])

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