import { useState, useEffect } from 'react'
import { parametresService, echeancesService } from '../../services'
import { Settings, Save, Mail, Bell, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const CARBURANTS = [
  { cle: 'prix_diesel',     label: 'Diesel',      couleur: 'bg-yellow-100 text-yellow-800' },
  { cle: 'prix_essence',    label: 'Essence',     couleur: 'bg-blue-100 text-blue-800' },
  { cle: 'prix_hybride',    label: 'Hybride',     couleur: 'bg-green-100 text-green-800' },
  { cle: 'prix_electrique', label: 'Électrique',  couleur: 'bg-purple-100 text-purple-800' },
]

const SMTP_FIELDS = [
  { cle: 'smtp_host',     label: 'Serveur SMTP',    type: 'text',     placeholder: 'smtp.gmail.com' },
  { cle: 'smtp_port',     label: 'Port',             type: 'number',   placeholder: '587' },
  { cle: 'smtp_user',     label: 'Identifiant',      type: 'text',     placeholder: 'user@gmail.com' },
  { cle: 'smtp_password', label: 'Mot de passe',     type: 'password', placeholder: '••••••••' },
  { cle: 'smtp_from',     label: 'Expéditeur',       type: 'email',    placeholder: 'parcauto@cipres.org' },
]

const defaultParams = {
  prix_diesel: '', prix_essence: '', prix_hybride: '', prix_electrique: '',
  alerte_stade_1: '15', alerte_stade_2: '5', alerte_stade_3: '1',
  emails_admins: '',
  smtp_host: '', smtp_port: '587', smtp_user: '', smtp_password: '', smtp_from: '',
}

export default function Parametres() {
  const [params, setParams] = useState(defaultParams)
  const [loading, setLoading] = useState(true)
  const [savingPrix, setSavingPrix] = useState(false)
  const [savingAlertes, setSavingAlertes] = useState(false)
  const [savingSmtp, setSavingSmtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [lancing, setLancing] = useState(false)

  const set = (cle, val) => setParams(p => ({ ...p, [cle]: val }))

  useEffect(() => {
    parametresService.getAll()
      .then(r => {
        const map = {}
        r.data.forEach(p => { map[p.cle] = p.valeur })
        setParams(prev => ({ ...prev, ...map }))
      })
      .catch(() => toast.error('Erreur lors du chargement des paramètres'))
      .finally(() => setLoading(false))
  }, [])

  const saveGroup = async (cles, setSaving) => {
    setSaving(true)
    try {
      const payload = cles.map(cle => ({ cle, valeur: params[cle] ?? '' }))
      await parametresService.update(payload)
      toast.success('Paramètres enregistrés')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleVerifier = async () => {
    setVerifying(true)
    try {
      await echeancesService.testerEmail()
      toast.success('Email de test envoyé aux adresses configurées')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi — vérifiez la configuration SMTP')
    } finally {
      setVerifying(false)
    }
  }

  const handleLancerAlertes = async () => {
    if (!confirm('Réinitialiser les notifications et relancer la vérification de toutes les échéances ?')) return
    setLancing(true)
    try {
      await echeancesService.verifier(true)
      toast.success('Vérification lancée — alertes et emails envoyés si des échéances correspondent')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la vérification')
    } finally {
      setLancing(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <div className="max-w-lg space-y-6">
      <div className="border-l-4 border-cipres-600 pl-4">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Configuration générale du parc automobile</p>
      </div>

      {/* Prix carburants */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 flex items-center gap-3">
          <Settings size={18} className="text-white" />
          <h2 className="text-base font-bold text-white">Prix des carburants</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">Prix utilisés par défaut lors de l'enregistrement d'un plein.</p>
          <div className="space-y-3">
            {CARBURANTS.map(({ cle, label, couleur }) => (
              <div key={cle} className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full w-24 text-center ${couleur}`}>{label}</span>
                <div className="flex-1 relative">
                  <input type="number" className="input pr-16" step="0.001" min="0"
                    value={params[cle]} onChange={e => set(cle, e.target.value)} placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">FCFA/L</span>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => saveGroup(CARBURANTS.map(c => c.cle), setSavingPrix)} disabled={savingPrix} className="btn-primary flex items-center gap-2">
            <Save size={15} />{savingPrix ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Alertes échéances */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 flex items-center gap-3">
          <Bell size={18} className="text-white" />
          <h2 className="text-base font-bold text-white">Alertes d'échéances</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Des alertes sont envoyées (dans l'application et par email) aux trois seuils configurés ci-dessous.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { cle: 'alerte_stade_1', label: '1er seuil' },
              { cle: 'alerte_stade_2', label: '2ème seuil' },
              { cle: 'alerte_stade_3', label: '3ème seuil' },
            ].map(({ cle, label }) => (
              <div key={cle}>
                <label className="label">{label}</label>
                <div className="relative">
                  <input type="number" className="input pr-8" min="1" max="365"
                    value={params[cle]} onChange={e => set(cle, e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">j</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="label">Emails destinataires (séparés par des virgules)</label>
            <input className="input" type="text" placeholder="admin@cipres.org, dsi@cipres.org"
              value={params.emails_admins} onChange={e => set('emails_admins', e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => saveGroup(['alerte_stade_1', 'alerte_stade_2', 'alerte_stade_3', 'emails_admins'], setSavingAlertes)} disabled={savingAlertes} className="btn-primary flex items-center gap-2">
              <Save size={15} />{savingAlertes ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={handleVerifier} disabled={verifying} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={15} className={verifying ? 'animate-spin' : ''} />
              {verifying ? 'Envoi...' : 'Tester l\'email'}
            </button>
            <button onClick={handleLancerAlertes} disabled={lancing} className="btn-secondary flex items-center gap-2">
              <Bell size={15} className={lancing ? 'animate-pulse' : ''} />
              {lancing ? 'Vérification...' : 'Déclencher les alertes'}
            </button>
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div className="card p-0 overflow-hidden">
        <div className="bg-cipres-600 px-6 py-4 flex items-center gap-3">
          <Mail size={18} className="text-white" />
          <h2 className="text-base font-bold text-white">Configuration email (SMTP)</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500">
            Utilisé pour l'envoi automatique des alertes d'échéances. Laisser vide pour désactiver l'envoi par email.
          </p>
          <div className="space-y-3">
            {SMTP_FIELDS.map(({ cle, label, type, placeholder }) => (
              <div key={cle}>
                <label className="label">{label}</label>
                <input className="input" type={type} placeholder={placeholder}
                  value={params[cle]} onChange={e => set(cle, e.target.value)} />
              </div>
            ))}
          </div>
          <button onClick={() => saveGroup(SMTP_FIELDS.map(f => f.cle), setSavingSmtp)} disabled={savingSmtp} className="btn-primary flex items-center gap-2">
            <Save size={15} />{savingSmtp ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
