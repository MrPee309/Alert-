import type { Dictionary } from "./ht";

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

/**
 * French — partial. Localization architecture is ready: add keys here and they
 * override Haitian Creole; anything missing falls back to `ht` automatically.
 */
const fr: DeepPartial<Dictionary> = {
  common: {
    cancel: "Annuler",
    save: "Enregistrer",
    retry: "Réessayer",
    loading: "Chargement...",
    next: "Continuer",
    back: "Retour",
    done: "Terminé",
    search: "Rechercher",
    seeAll: "Voir tout",
    ok: "OK",
    close: "Fermer",
    confirm: "Confirmer",
  },
  auth: {
    welcomeBack: "Bon retour",
    loginSubtitle: "Connectez-vous pour continuer sur DealLakay Alert",
    email: "E-mail",
    password: "Mot de passe",
    login: "Se connecter",
    register: "Créer un compte",
    logout: "Déconnexion",
  },
  tabs: {
    home: "Accueil",
    alert: "Alertes",
    demand: "Demandes",
    profile: "Profil",
  },
  home: {
    greeting: "Bonjour",
    cta: "Faire une demande",
    myDemands: "Mes demandes",
  },
  create: {
    submit: "🔔 Activer la demande",
  },
};

export default fr;
