// Erreurs de Supabase Auth → clé de message (zone « auth.errors »), traduite par le formulaire ou l'action serveur.

interface AuthErrorLike {
  code?: string;
  message?: string;
  status?: number;
  name?: string;
  reasons?: unknown;
}

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'userExists'
  | 'rateLimited'
  | 'emailInvalid'
  | 'emailNotAuthorized'
  | 'signupDisabled'
  | 'samePassword'
  | 'reauthenticate'
  | 'sessionExpired'
  | 'linkExpired'
  | 'userBanned'
  | 'captcha'
  | 'passwordPwned'
  | 'passwordWeak'
  | 'passwordShort'
  | 'network'
  | 'generic';

function weakPassword(reasons: unknown): AuthErrorKey {
  const list = Array.isArray(reasons) ? reasons.map(String) : [];
  if (list.includes('pwned')) return 'passwordPwned';
  if (list.includes('characters')) return 'passwordWeak';
  return 'passwordShort';
}

/** Clé du message à afficher pour une erreur renvoyée par Supabase Auth (ou une panne réseau). */
export function authErrorKey(error: AuthErrorLike): AuthErrorKey {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'weak_password' || error.name === 'AuthWeakPasswordError') return weakPassword(error.reasons);

  switch (code) {
    case 'invalid_credentials':
      return 'invalidCredentials';
    case 'email_not_confirmed':
      return 'emailNotConfirmed';
    case 'user_already_exists':
    case 'email_exists':
      return 'userExists';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'rateLimited';
    case 'email_address_invalid':
      return 'emailInvalid';
    case 'email_address_not_authorized':
      return 'emailNotAuthorized';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'signupDisabled';
    case 'same_password':
      return 'samePassword';
    case 'reauthentication_needed':
    case 'reauthentication_not_valid':
      return 'reauthenticate';
    case 'session_not_found':
    case 'session_expired':
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'bad_jwt':
      return 'sessionExpired';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
    case 'bad_code_verifier':
      return 'linkExpired';
    case 'user_banned':
      return 'userBanned';
    case 'captcha_failed':
      return 'captcha';
    case 'validation_failed':
      if (message.includes('email')) return 'emailInvalid';
      if (message.includes('password')) return weakPassword(error.reasons);
      break;
    default:
      break;
  }

  if (message.includes('invalid login credentials')) return 'invalidCredentials';
  if (message.includes('email not confirmed')) return 'emailNotConfirmed';
  if (message.includes('already registered')) return 'userExists';
  if (message.includes('rate limit') || error.status === 429) return 'rateLimited';
  if (message.includes('password should be') || message.includes('password is')) return weakPassword(error.reasons);
  if (error.name === 'AuthRetryableFetchError' || error.status === 0 || message.includes('fetch')) return 'network';
  if (error.name === 'AuthSessionMissingError') return 'sessionExpired';
  return 'generic';
}
