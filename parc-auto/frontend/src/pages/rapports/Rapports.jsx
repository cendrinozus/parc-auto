import { useEffect, useRef, useState } from 'react'
import { rapportsService, vehiculesService } from '../../services'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { FileDown } from 'lucide-react'
import { exportToPdf, exportChartToPdf } from '../../utils/exportPdf'

export default function Rapports() {
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [vehiculeId, setVehiculeId] = useState('')
  const [vehicules, setVehicules] = useState([])
  const [mensuel, setMensuel] = useState([])
  const [parVehicule, setParVehicule] = useState([])
  const [exportingCout, setExportingCout] = useState(false)
  const [exportingConso, setExportingConso] = useState(false)

  const coutChartRef = useRef(null)
  const consoChartRef = useRef(null)

  useEffect(() => {
    vehiculesService.getAll({ statut: 'actif' })
      .then(r => setVehicules(r.data))
      .catch(() => {})
  }, [])

  // Graphiques mensuels : filtrés par véhicule si sélectionné
  useEffect(() => {
    const params = { annee }
    if (vehiculeId) params.vehicule_id = vehiculeId
    rapportsService.mensuel(params).then(r => setMensuel(r.data)).catch(() => {})
  }, [annee, vehiculeId])

  // Tableau classement : toujours tous les véhicules
  useEffect(() => {
    rapportsService.parVehicule({ annee }).then(r => setParVehicule(r.data)).catch(() => {})
  }, [annee])

  const annees = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const COLORS = ['#AD522D','#8B3F22','#C96039','#DD7D57','#EAA98C','#6B2F18']

  const vehiculeLabel = vehiculeId
    ? vehicules.find(v => String(v.id) === String(vehiculeId))?.immatriculation ?? ''
    : 'Tous véhicules'

  const handleExportCout = async () => {
    if (!coutChartRef.current) return
    setExportingCout(true)
    try {
      await exportChartToPdf({
        title: `Évolution mensuelle — Coût carburant ${annee} (${vehiculeLabel})`,
        subtitle: `${mensuel.length} mois · ${vehiculeLabel} · ${annee}`,
        filename: `rapports_cout_mensuel_${annee}${vehiculeId ? '_' + vehiculeLabel : ''}.pdf`,
        chartElement: coutChartRef.current,
        columns: [
          { header: 'Mois',       accessor: r => r.mois_label },
          { header: 'Nb pleins',  accessor: r => r.nb_pleins },
          { header: 'Litres',     accessor: r => `${r.total_litres} L` },
          { header: 'Coût total', accessor: r => `${r.total_cout} FCFA` },
          { header: 'Conso moy.', accessor: r => `${r.conso_moyenne} L/100km` },
        ],
        rows: mensuel,
      })
    } finally {
      setExportingCout(false)
    }
  }

  const handleExportConso = async () => {
    if (!consoChartRef.current) return
    setExportingConso(true)
    try {
      await exportChartToPdf({
        title: `Consommation moyenne par mois ${annee} (${vehiculeLabel})`,
        subtitle: `${mensuel.length} mois · ${vehiculeLabel} · ${annee}`,
        filename: `rapports_conso_mensuelle_${annee}${vehiculeId ? '_' + vehiculeLabel : ''}.pdf`,
        chartElement: consoChartRef.current,
        columns: [
          { header: 'Mois',                   accessor: r => r.mois_label },
          { header: 'Conso moy. (L/100km)',    accessor: r => r.conso_moyenne },
          { header: 'Nb pleins',               accessor: r => r.nb_pleins },
          { header: 'Litres',                  accessor: r => `${r.total_litres} L` },
        ],
        rows: mensuel,
      })
    } finally {
      setExportingConso(false)
    }
  }

  const handleExportClassement = () => {
    exportToPdf({
      title: `Classement par véhicule — Coût total ${annee}`,
      subtitle: `${parVehicule.length} véhicule(s) · ${annee}`,
      filename: `rapports_classement_vehicules_${annee}.pdf`,
      columns: [
        { header: 'Rang',            accessor: r => r._rang },
        { header: 'Immatriculation', accessor: r => r.immatriculation },
        { header: 'Véhicule',        accessor: r => r.label },
        { header: 'Nb pleins',       accessor: r => r.nb_pleins },
        { header: 'Litres',          accessor: r => `${r.total_litres} L` },
        { header: 'Coût total',      accessor: r => `${r.total_cout} FCFA` },
        { header: 'L/100km moy.',    accessor: r => `${r.conso_moyenne} L/100` },
      ],
      rows: parVehicule.map((r, i) => ({ ...r, _rang: i + 1 })),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-l-4 border-cipres-600 pl-4">
          <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
          <p className="text-sm text-gray-500">Analyse de la consommation carburant</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="input w-52"
            value={vehiculeId}
            onChange={e => setVehiculeId(e.target.value)}
          >
            <option value="">— Tous les véhicules —</option>
            {vehicules.map(v => (
              <option key={v.id} value={v.id}>
                {v.immatriculation} — {v.marque} {v.modele}
              </option>
            ))}
          </select>
          <select className="input w-32" value={annee} onChange={e => setAnnee(parseInt(e.target.value))}>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Graphique coût mensuel */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-cipres-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Évolution mensuelle — Coût carburant (FCFA)</h2>
          </div>
          <button
            onClick={handleExportCout}
            disabled={mensuel.length === 0 || exportingCout}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <FileDown size={14} /> {exportingCout ? 'Export...' : 'Exporter PDF'}
          </button>
        </div>
        <div ref={coutChartRef}>
          {mensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mensuel} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois_label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={v => [`${v} FCFA`, 'Coût']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total_cout" radius={[4,4,0,0]}>
                  {mensuel.map((_, i) => <Cell key={i} fill="#AD522D" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>}
        </div>
      </div>

      {/* Graphique consommation mensuelle */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-green-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Consommation moyenne par mois (L/100km)</h2>
          </div>
          <button
            onClick={handleExportConso}
            disabled={mensuel.length === 0 || exportingConso}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <FileDown size={14} /> {exportingConso ? 'Export...' : 'Exporter PDF'}
          </button>
        </div>
        <div ref={consoChartRef}>
          {mensuel.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mensuel} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois_label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 'auto']} />
                <Tooltip
                  formatter={v => [`${v} L/100km`, 'Conso moy.']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="conso_moyenne" fill="#16a34a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>}
        </div>
      </div>

      {/* Tableau classement — toujours tous les véhicules */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-cipres-600 rounded-full" />
            <h2 className="text-base font-bold text-gray-800">Classement par véhicule — Coût total (FCFA)</h2>
          </div>
          <button
            onClick={handleExportClassement}
            disabled={parVehicule.length === 0}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <FileDown size={14} /> Exporter PDF
          </button>
        </div>
        {parVehicule.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="thead-cipres">
                  {['Rang','Véhicule','Nb pleins','Litres','Coût total','L/100km moy.'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parVehicule.map((r, i) => (
                  <tr key={r.vehicule_id} className="hover:bg-cipres-50">
                    <td className="px-4 py-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-cipres-700 font-mono">
                      {r.immatriculation} <span className="text-gray-400 font-normal text-xs">— {r.label}</span>
                    </td>
                    <td className="px-4 py-3">{r.nb_pleins}</td>
                    <td className="px-4 py-3">{r.total_litres} L</td>
                    <td className="px-4 py-3 font-semibold text-cipres-700">{r.total_cout} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={r.conso_moyenne > 10 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                        {r.conso_moyenne} L/100
                      </span>
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
