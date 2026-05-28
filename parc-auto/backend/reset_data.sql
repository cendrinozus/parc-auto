-- =============================================================
-- Réinitialisation de la base de données parc_auto
-- Conserve : utilisateurs, parametres
-- Supprime  : vehicules, conducteurs, pleins, affectations,
--             alertes, entretiens, echeances_vehicule,
--             releves_journaliers, trajets
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE trajets;
TRUNCATE TABLE releves_journaliers;
TRUNCATE TABLE pleins;
TRUNCATE TABLE affectations;
TRUNCATE TABLE alertes;
TRUNCATE TABLE entretiens;
TRUNCATE TABLE echeances_vehicule;
TRUNCATE TABLE conducteurs;
TRUNCATE TABLE vehicules;

-- Délier les utilisateurs de leur conducteur (FK vers conducteurs)
UPDATE utilisateurs SET conducteur_id = NULL;

SET FOREIGN_KEY_CHECKS = 1;
