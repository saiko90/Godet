// Messages d'erreur Supabase Auth traduits en français, pour les formulaires de compte.

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
  name?: string;
  reasons?: unknown;
}

const NBSP = '\u00a0';

function weakPasswordMessage(reasons: unknown): string {
  const list = Array.isArray(reasons) ? reasons.map(String) : [];
  if (list.includes('pwned')) {
    return 'Ce mot de passe figure dans des fuites de données connues. Choisissez-en un autre.';
  }
  if (list.includes('characters')) {
    return `Mot de passe trop simple${NBSP}: mélangez minuscules, majuscules, chiffres et symboles.`;
  }
  return `Mot de passe trop court${NBSP}: 8${NBSP}caractères au minimum.`;
}

/** Message lisible pour une erreur renvoyée par Supabase Auth (ou une panne réseau). */
export function authMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return '';
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'weak_password' || error.name === 'AuthWeakPasswordError') return weakPasswordMessage(error.reasons);

  switch (code) {
    case 'invalid_credentials':
      return 'E-mail ou mot de passe incorrect.';
    case 'email_not_confirmed':
      return `Votre adresse e-mail n’est pas encore confirmée. Ouvrez le lien reçu par e-mail, ou demandez un nouvel envoi.`;
    case 'user_already_exists':
    case 'email_exists':
      return `Un compte existe déjà avec cette adresse. Connectez-vous, ou choisissez «${NBSP}Mot de passe oublié${NBSP}?${NBSP}».`;
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives en peu de temps. Patientez quelques minutes, puis réessayez.';
    case 'email_address_invalid':
      return 'Cette adresse e-mail n’est pas valable.';
    case 'email_address_not_authorized':
      return 'Les e-mails ne peuvent pas être envoyés à cette adresse pour le moment.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Les inscriptions sont momentanément fermées.';
    case 'same_password':
      return 'Choisissez un mot de passe différent de l’actuel.';
    case 'reauthentication_needed':
    case 'reauthentication_not_valid':
      return 'Par sécurité, reconnectez-vous avant de changer votre mot de passe.';
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'bad_jwt':
      return 'Votre session a expiré. Reconnectez-vous.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'bad_code_verifier':
      return 'Ce lien n’est plus valable. Demandez-en un nouveau.';
    case 'user_banned':
      return 'Ce compte est bloqué.';
    case 'captcha_failed':
      return 'La vérification anti-robot a échoué. Réessayez.';
    case 'validation_failed':
      if (message.includes('email')) return 'Cette adresse e-mail n’est pas valable.';
      if (message.includes('password')) return weakPasswordMessage(error.reasons);
      break;
    default:
      break;
  }

  if (message.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.';
  if (message.includes('email not confirmed')) return 'Votre adresse e-mail n’est pas encore confirmée.';
  if (message.includes('already registered')) {
    return `Un compte existe déjà avec cette adresse. Connectez-vous, ou choisissez «${NBSP}Mot de passe oublié${NBSP}?${NBSP}».`;
  }
  if (message.includes('rate limit') || error.status === 429) {
    return 'Trop de tentatives en peu de temps. Patientez quelques minutes, puis réessayez.';
  }
  if (message.includes('password should be') || message.includes('password is')) return weakPasswordMessage(error.reasons);
  if (error.name === 'AuthRetryableFetchError' || error.status === 0 || message.includes('fetch')) {
    return 'Connexion au serveur impossible. Vérifiez votre réseau, puis réessayez.';
  }
  if (error.name === 'AuthSessionMissingError') return 'Votre session a expiré. Reconnectez-vous.';
  return 'Une erreur est survenue. Réessayez dans un instant.';
}
