# Modèles des e-mails d'authentification (Supabase)

Générés par `node --experimental-strip-types scripts/emails/supabase-templates.mjs` — ne pas modifier à la main.
À coller dans Supabase › Authentication › Emails › Templates (un modèle par onglet) : l'objet ci-dessous dans
« Subject », le contenu du fichier HTML dans « Message body ».

La langue suit `locale` dans les métadonnées du compte (enregistrée à l'inscription) ; sinon français.
Les liens passent par `/auth/confirm` (token_hash) : ils fonctionnent dans n'importe quel navigateur.

### Confirm signup — `confirmation.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Bestätigen Sie Ihre E-Mail-Adresse{{ else if eq $l "it" }}Confermi il suo indirizzo e-mail{{ else if eq $l "en" }}Confirm your email address{{ else }}Confirmez votre adresse e-mail{{ end }}
```

### Invite user — `invite.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Sie sind zu Godet eingeladen{{ else if eq $l "it" }}È stato invitato su Godet{{ else if eq $l "en" }}You’ve been invited to Godet{{ else }}Vous êtes invité sur Godet{{ end }}
```

### Magic Link — `magic_link.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Ihr Anmeldelink für Godet{{ else if eq $l "it" }}Il suo link di accesso a Godet{{ else if eq $l "en" }}Your Godet sign-in link{{ else }}Votre lien de connexion à Godet{{ end }}
```

### Change Email Address — `email_change.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Bestätigen Sie Ihre neue E-Mail-Adresse{{ else if eq $l "it" }}Confermi il suo nuovo indirizzo e-mail{{ else if eq $l "en" }}Confirm your new email address{{ else }}Confirmez votre nouvelle adresse e-mail{{ end }}
```

### Reset Password — `recovery.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Setzen Sie Ihr Godet-Passwort zurück{{ else if eq $l "it" }}Reimposti la password di Godet{{ else if eq $l "en" }}Reset your Godet password{{ else }}Réinitialisez votre mot de passe Godet{{ end }}
```

### Reauthentication — `reauthentication.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Ihr Bestätigungscode für Godet{{ else if eq $l "it" }}Il suo codice di conferma Godet{{ else if eq $l "en" }}Your Godet confirmation code{{ else }}Votre code de confirmation Godet{{ end }}
```

### Password changed (notification de sécurité) — `password_changed_notification.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Ihr Godet-Passwort wurde geändert{{ else if eq $l "it" }}La password di Godet è stata modificata{{ else if eq $l "en" }}Your Godet password was changed{{ else }}Votre mot de passe Godet a été modifié{{ end }}
```

### Email address changed (notification de sécurité) — `email_changed_notification.html`

Objet (Subject) :

```
{{ $l := printf "%v" .Data.locale }}{{ if eq $l "de" }}Die E-Mail-Adresse Ihres Godet-Kontos wurde geändert{{ else if eq $l "it" }}L’indirizzo e-mail del suo account Godet è cambiato{{ else if eq $l "en" }}The email address of your Godet account changed{{ else }}L’adresse e-mail de votre compte Godet a changé{{ end }}
```
