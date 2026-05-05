import { useEffect, useState } from 'react'
import { rapportsService, alertesService } from '../../services'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { Car, Fuel, Banknote, TrendingDown } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className={`h-1.5 w-full ${color}`} />
      <div className="flex items-center gap-4 p-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color} bg-opacity-15`}>
          <Icon size={22} className={`${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [global, setGlobal] = useState(null)
  const [mensuel, setMensuel] = useState([])
  const [alertCount, setAlertCount] = useState(0)
  const annee = new Date().getFullYear()

  useEffect(() => {
    rapportsService.global({ annee }).then(r => setGlobal(r.data)).catch(() => {})
    rapportsService.mensuel({ annee }).then(r => setMensuel(r.data)).catch(() => {})
    alertesService.count().then(r => setAlertCount(r.data.non_lues)).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-cipres-600 pl-4">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Année {annee} — Vue globale du parc</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Véhicules actifs"
          value={global?.nb_vehicules_actifs ?? '—'}
          icon={Car}
          color="bg-cipres-600"
        />
        <StatCard
          label="Litres consommés"
          value={global ? `${global.total_litres.toLocaleString()} L` : '—'}
          icon={Fuel}
          color="bg-green-600"
          sub={`${global?.nb_pleins ?? 0} pleins`}
        />
        <StatCard
          label="Coût total carburant"
          value={global ? `${global.total_cout.toLocaleString()} FCFA` : '—'}
          icon={Banknote}
          color="bg-cipres-600"
        />
        <StatCard
          label="Conso moyenne"
          value={global ? `${global.conso_moyenne} L/100` : '—'}
          icon={TrendingDown}
          color="bg-amber-600"
          sub={alertCount > 0 ? `${alertCount} alerte(s) active(s)` : 'Aucune alerte'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-cipres-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Coût mensuel (FCFA)</h2>
          </div>
          {mensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mensuel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois_label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v) => `${v} FCFA`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total_cout" fill="#AD522D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-green-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Consommation moyenne mensuelle (L/100km)</h2>
          </div>
          {mensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={mensuel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois_label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  formatter={(v) => `${v} L/100km`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Line type="monotone" dataKey="conso_moyenne" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>
    </div>
  )
}