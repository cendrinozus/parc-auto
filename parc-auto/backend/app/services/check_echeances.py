import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import date, timedelta

logger = logging.getLogger(__name__)

def _get_stades(app):
    with app.app_context():
        from app.models.parametre import Parametre
        stades = []
        for cle, defaut in [('alerte_stade_1', 15), ('alerte_stade_2', 5), ('alerte_stade_3', 1)]:
            p = Parametre.query.filter_by(cle=cle).first()
            try:
                stades.append(int(p.valeur) if p else defaut)
            except ValueError:
                stades.append(defaut)
        return sorted(set(stades), reverse=True)


def verifier_et_alerter(app):
    with app.app_context():
        from app import db
        from app.models.echeance import EcheanceVehicule, LABELS_DOCUMENT
        from app.models.plein import Alerte
        from app.models.vehicule import Vehicule

        stades = _get_stades(app)
        today = date.today()
        horizon = today + timedelta(days=max(stades))

        echeances = EcheanceVehicule.query.filter(
            EcheanceVehicule.date_echeance >= today,
            EcheanceVehicule.date_echeance <= horizon
        ).all()

        nouvelles = []
        for ech in echeances:
            jours = (ech.date_echeance - today).days
            notifies = ech.stades_notifies()

            # Détermine le stade le plus urgent non encore notifié
            stade_a_notifier = None
            for stade in stades:
                if stade not in notifies and jours <= stade:
                    stade_a_notifier = stade
                    break

            if stade_a_notifier is None:
                continue

            v = Vehicule.query.get(ech.vehicule_id)
            immat = v.immatriculation if v else f'Véhicule #{ech.vehicule_id}'
            label = LABELS_DOCUMENT.get(ech.type_document, ech.type_document)
            date_str = ech.date_echeance.strftime('%d/%m/%Y')

            if jours == 0:
                msg = f"[URGENT] {label} du véhicule {immat} expire aujourd'hui ({date_str})"
            elif jours == 1:
                msg = f"[URGENT] {label} du véhicule {immat} expire demain ({date_str})"
            else:
                msg = f"{label} du véhicule {immat} expire dans {jours} jour(s) (le {date_str})"

            alerte = Alerte(
                vehicule_id=ech.vehicule_id,
                echeance_id=ech.id,
                type_alerte='autre',
                message=msg,
                lue=False
            )
            db.session.add(alerte)
            ech.marquer_stade(stade_a_notifier)
            nouvelles.append({'stade': stade_a_notifier, 'message': msg})

        if nouvelles:
            db.session.commit()
            logger.info(f"{len(nouvelles)} alerte(s) échéances créée(s)")
            _envoyer_emails(app, [n['message'] for n in nouvelles])
        else:
            logger.info("Vérification échéances : aucune nouvelle alerte")


def _envoyer_emails(app, messages):
    with app.app_context():
        from app.models.parametre import Parametre

        def get_param(cle, default=''):
            p = Parametre.query.filter_by(cle=cle).first()
            return p.valeur if p else default

        smtp_host = get_param('smtp_host')
        if not smtp_host:
            logger.warning("Envoi email ignoré : smtp_host non configuré")
            return

        smtp_port = int(get_param('smtp_port', '587'))
        smtp_user = get_param('smtp_user')
        smtp_password = get_param('smtp_password')
        smtp_from = get_param('smtp_from') or smtp_user
        emails_str = get_param('emails_admins')

        if not emails_str:
            logger.warning("Envoi email ignoré : emails_admins non configuré")
            return

        recipients = [e.strip() for e in emails_str.split(',') if e.strip()]
        if not recipients:
            return

        nb = len(messages)
        subject = f"[ParcAuto CIPRES] {nb} échéance(s) à venir"
        body = "Bonjour,\n\nLes documents suivants approchent de leur date d'échéance :\n\n"
        for m in messages:
            body += f"  • {m}\n"
        body += "\nConnectez-vous à l'application ParcAuto pour plus de détails.\n\nCordialement,\nParcAuto — CIPRES\n"

        msg = MIMEMultipart()
        msg['From'] = smtp_from
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))

        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.ehlo()
                server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, recipients, msg.as_string())
            logger.info(f"Email alertes envoyé à {recipients}")
        except Exception as e:
            logger.error(f"Erreur envoi email alertes : {e}")
            raise
