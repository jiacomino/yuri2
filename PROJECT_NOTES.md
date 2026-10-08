# Project Notes — yuri2

Running journal of decisions, requirements, and context for this Tauri + React project.
Updated as development progresses.

## Stack
- **Framework**: Tauri 2 (Rust backend) + React 19 + TypeScript 7
- **Build tool**: Vite 8 (moteur Rolldown)
- **UI** : HeroUI v3 (`@heroui/react` + `@heroui/styles`, basé sur React Aria) + Tailwind CSS 4 (`@tailwindcss/vite`)
- **Package manager**: npm
- **Créé**: 2026-09-30, scaffold manuel calqué sur la config de `yuri`
- **App identifier**: `com.yuri2.app`

## Environment
- OS: Windows 11
- **Node requis : `^20.19.0 || >=22.12.0`** (Vite 8 / Rolldown / `@vitejs/plugin-react` 6).
  Node de la machine mis à jour le 2026-10-01 : v20.12.1 → **v20.20.2**, via
  `winget upgrade --id OpenJS.NodeJS.20`. Nécessite un terminal **administrateur** :
  l'élévation UAC n'est pas possible depuis une session Claude Code (retourne 1602).
  Contrainte désormais satisfaite, plus aucun warning `EBADENGINE`.
- Alias de chemin : `@/*` → `./src/*` (vite.config.ts + tsconfig.json)
- Port de dev fixe : 1420 (strictPort, requis par Tauri)

## Contexte
Réécriture (v2) de `yuri`, un gestionnaire de favoris / tableau de bord local devenu
une app à groupes multiples (liens, markdown, kanban, mind map, calendrier, pomodoro,
workflow, Eisenhower, annotation d'image…).

yuri2 repart d'un scaffold vierge : aucun code applicatif repris. Les composants d'interface
viennent de HeroUI (`import { Button, Card, … } from "@heroui/react"`), avec une API composée
(`Card.Header`, `Card.Content`…) et sans Provider à monter.

## Decisions
- 2026-09-30: Scaffold vierge plutôt que copie de yuri — la v2 est une réécriture,
  pas une évolution incrémentale.
- 2026-09-30: `rusqlite` (bundled) conservé dans les dépendances Rust dès le départ,
  la persistance SQLite étant acquise comme choix d'architecture depuis yuri.
- 2026-09-30: Plugins Tauri repris : `opener`, `dialog`, `notification`.
- 2026-10-01: Toutes les dépendances npm passées aux dernières versions publiées
  (TypeScript 7.0.2, Vite 8.3.1, `@vitejs/plugin-react` 6.1.1, React 19.3.0,
  lucide-react 1.49.0, radix-ui 1.6.7, tailwindcss 4.3.3, `@xyflow/react` 12.12.0…).
  Le `tsc` de TypeScript 7 passe sans erreur sur le scaffold.
- 2026-10-01: **FullCalendar maintenu en `^6.1.21`.** `@fullcalendar/core` et
  `@fullcalendar/react` existent en 7.1.0 stable, mais `daygrid`, `timegrid` et
  `interaction` n'ont que des pré-versions 7.x (tag `latest` = 6.1.21,
  `rc` = 7.0.0-rc.0). Mélanger `core@7` et `daygrid@6` casserait les plugins :
  attendre que toute la famille soit stable en 7.x. FullCalendar 7 réorganise aussi
  le cœur (`@full-ui/headless-calendar`, `temporal-polyfill`) — ce sera une migration,
  pas un simple bump.
- 2026-10-01: `vite.config.ts` utilise `import.meta.dirname` et non `__dirname`,
  Vite 8 avertissant que `__dirname` est incompatible avec `configLoader: 'native'`
  (futur défaut). Disponible depuis Node 20.11.

- 2026-10-01: **Périmètre v2** : les mêmes types de composants que yuri seront recréés
  (links, text, markdown, postit, todo, kanban, eisenhower, workflow, pomodoro, pomotask,
  calendar, gcalendar, mindmap, image, password, posture), mais **aucun code repris**.
  Étape suivante : définir d'abord le visuel de chaque composant, puis les implémenter.
- 2026-10-01: **Bibliothèques proposées (pas encore validées)** :
  - à garder : radix-ui/shadcn, lucide-react, Tailwind, clsx/cva/tailwind-merge,
    react-grid-layout (API v2 native, sans `/legacy`), @dnd-kit, @xyflow/react
    (mind map et peut-être workflow), react-markdown + remark-gfm, FullCalendar 6 ;
  - à remplacer : markerjs2 → marker.js 3 (licence linkware), `contentEditable` +
    `execCommand` → TipTap ;
  - à ajouter : zustand (+ zundo pour annuler/rétablir), zod (validation du JSON
    `content`), date-fns, sonner (notifications), cmdk (palette Ctrl+K, optionnel) ;
  - côté Rust : chiffrer les mots de passe (`keyring` ou stronghold), OAuth Google
    géré dans le backend.

- 2026-10-01: **HeroUI v3 (3.2.6) remplace shadcn/ui**, choisi pour son rendu soigné dès
  l'installation. Retirés : `radix-ui`, `class-variance-authority`, `components.json`.
  Ajoutés : `@heroui/react`, `@heroui/styles`, `react-aria`, `react-aria-components`,
  `@internationalized/date` (dépendances de HeroUI). `clsx` + `tailwind-merge` gardés pour
  le helper `cn`. `index.css` importe `@heroui/styles`, qui inclut déjà Tailwind et
  tw-animate-css. Police racine à 13.5px pour garder la densité compacte (HeroUI
  dimensionne en rem). Mode sombre : classe `.dark` sur `<html>`, posée dans `main.tsx`
  selon la préférence de Windows. Le CSS de HeroUI pèse ~430 kB (40 kB gzip), sans
  importance pour une app de bureau.
- 2026-10-01: **Drag & drop (proposition)** : react-grid-layout pour placer et
  redimensionner les groupes sur le canevas ; `@xyflow/react` pour les graphes (mind map,
  workflow) ; `@dnd-kit/core` + `sortable` pour les listes internes (liens, todo, kanban,
  Eisenhower). `@dnd-kit/react` (nouvelle API) est encore en 0.x : migrer à sa 1.0.

- 2026-10-01: **Style visuel retenu : « aéré »** (façon Notion), choisi parmi trois
  maquettes (compact façon yuri, verre façon Windows 11, aéré). Cadre de groupe =
  carte `bg-surface` sans bordure, `rounded-3xl`, ombre douce ; barre de titre de 56px
  avec pastille d'icône colorée (`size-8`, `rounded-xl`, fond = couleur du groupe),
  titre 15px semi-gras, tags en `Chip` soft, actions Réduire + menu (Renommer, Couleur,
  Supprimer). Corps `px-4 pb-4`, éléments internes en `rounded-xl`/`rounded-2xl` sur
  `bg-surface-secondary`. Canevas en `bg-background-secondary`. Implémenté dans
  `src/components/group/GroupFrame.tsx` ; la barre de titre porte `group-handle`
  (poignée de react-grid-layout).

- 2026-10-01: **Les 16 composants de yuri recréés** dans le style aéré, sans persistance
  (état local). Contrat commun `BodyProps<S> = { groupId, value, onChange }` et
  `GroupDefinition<S>` dans `src/components/groups/types.ts` ; un dossier par type dans
  `src/components/groups/<kind>/` (index.ts, state.ts, Body + sous-composants) ; liste
  dans `registry.ts`. Page temporaire `GroupGallery` (un exemplaire de chaque, données
  de démo). Helpers partagés : `src/lib/{notify,confirm,id,alarm,url,browserPref,google,calendarLink}.ts`,
  `src/components/shared/{AlarmControl,EditableTabs,InlineInput}.tsx`.
  Rust : `system.rs` (save_binary_file, detect_browsers, open_url_with) et `oauth.rs`
  (flux OAuth Google loopback), repris de yuri. Ajouts npm : TipTap v3 (texte riche,
  remplace contentEditable/execCommand), `@markerjs/markerjs3` (remplace markerjs2,
  licence linkware : logo affiché), date-fns. Notifications in-app : toasts HeroUI.
  Écarts notables avec yuri : timers pomodoro/pomotask/posture sauvegardés dans l'état,
  vue « Mois » au calendrier, édition des cartes kanban/tâches calendrier en Modal,
  colonnes kanban réordonnables, tâches todo réordonnables, liens mind map en courbes.

- 2026-10-01: **Espaces de travail, canevas et persistance SQLite.**
  - Rust : `db.rs` (tables `workspaces` et `groups`, état du composant en JSON dans
    `groups.content`, cascade à la suppression d'un espace, espace « Accueil » créé si la
    base est vide) et `commands.rs`. Base : `app_data_dir()/yuri2.db`.
  - Front : `src/lib/db.ts` (appels `invoke`), hooks `useWorkspaces` (espace actif
    mémorisé en localStorage) et `useGroups` (sauvegarde différée de 400 ms par
    composant, vidée à la fermeture ; la disposition est enregistrée immédiatement).
  - Interface : `AppShell` (barre du haut + onglets d'espaces + canevas), fenêtres
    `WorkspaceDialog` (nom + couleur), `AddGroupDialog` (16 types en cartes, nom
    prérempli, double-clic = création directe), `GroupSettingsDialog` (nom, couleur,
    tags, déplacement vers un autre espace). Canevas react-grid-layout v2 (API native
    `useContainerWidth`, 24 colonnes, placement libre avec chevauchement comme yuri),
    réduction des composants dans un dock en bas à droite. La galerie de démo est retirée.
- 2026-10-02: **Base SQLite à côté de l'exe** (mode portable, `db_path` dans `lib.rs`).
  Repli sur `%APPDATA%\com.yuri2.app` si le dossier n'est pas inscriptible (Program Files) ;
  copie unique de l'ancienne base AppData au premier lancement.
- 2026-10-02: **Import yuri 1** (bouton dans l'en-tête). Rust lit `com.yuri.app/yuri.db` en
  lecture seule (`yuri1.rs`), le frontend convertit chaque type (`src/lib/yuri1/convert/`).
  Nouveaux identifiants : un second import crée des doublons. Annotations d'image aplaties
  (marker.js 2 → 3 incompatible). Client ID/secret Google à ressaisir (localStorage par app).
- 2026-10-02: **Style « moderne coloré »** retenu parmi trois maquettes (moderne coloré,
  sombre élégant, pastel affirmé) : fond #eef1f7, cartes blanches à ombre douce (rayon 16 px),
  pastille d'icône teintée de la couleur du groupe, accent indigo #4f46e5, police Plus
  Jakarta Sans (embarquée via @fontsource). Variables HeroUI surchargées dans `index.css`.
  Intérieur des 16 composants repris dans ce style : onglets soulignés (`EditableTabs`,
  todo, mots de passe), panneaux `bg-surface-secondary`, cartes blanches, pastilles de
  priorité teintées, anneaux de minuterie, FullCalendar thémé (`calendar.css`). Plus de
  liseré gauche (priorités todo/workflow → point ou pastille). Phase « Travail » du
  pomodoro renommée « Concentration ».
- 2026-10-02: **Passe de modernisation après captures** (Vite + Playwright/Edge avec
  `__TAURI_INTERNALS__` simulé et les `demoState` de chaque type). Cartes rayon 18 px,
  liseré fin, élévation au survol, actions de carte visibles au survol seulement ; en-tête
  translucide flouté ; canevas à trame de points (`.canvas-bg`) ; mode sombre retravaillé
  (#0d0e13 / cartes #16181f). Corrigés : cases à cocher invisibles (contour global sur
  `.checkbox__control`), mots collés (`word-spacing` : espace étroite de Plus Jakarta),
  titres de tâches écrasés (actions todo en barre superposée au survol), événements du
  calendrier (titre puis heure), champ « jours » de Google Agenda (stepper maison),
  pomodoro regroupé au centre, zoom initial de la carte mentale plafonné à 1.
- 2026-10-02: **Police Inter** (`@fontsource-variable/inter`, `cv11` + `ss01`) à la place de
  Plus Jakarta Sans, jugée grossière. Comparaison faite sur captures (Jakarta, Inter, Geist,
  Figtree, Onest) : le côté pâteux venait surtout des graisses. Graisses Tailwind remappées
  dans `index.css` (`--font-weight-semibold` 530, `bold` 600, `extrabold` 680 ; encore
  un cran plus léger en sombre). `word-spacing` retiré. Geist donnait un rendu proche.
- 2026-10-02: **Taille de texte pilotée par une seule valeur** : `html { font-size }` dans
  `index.css`, passée de 13,5 à 12 px. Les 153 tailles fixes `text-[Npx]` des composants
  (et celles de `calendar.css`) ont été converties en rem sur une base 13,5 (ex. 12 px →
  0.8889rem) : elles suivent désormais la racine, comme HeroUI et les espacements Tailwind.
- 2026-10-02: **Touches pastel** (choisies sur captures parmi aucun / fond / fond + cartes) :
  fond du canevas mêlé à 8 % de la couleur de l'espace actif (`--ws-tint`, posée sur `<main>`
  dans `AppShell`, accent si l'espace n'a pas de couleur) ; carte mêlée à 4 % de la couleur
  du composant (`--group-tint` sur `.group-frame`). Le contenu des cartes reste blanc.
- 2026-10-02: **Exe portable complet.** `portable_dir()` dans `lib.rs` : si le dossier de
  l'exe contient la base ou est inscriptible, la base ET les données WebView2 (`yuri2-webview/`,
  localStorage) y sont rangées. Pour cela la fenêtre est créée dans `setup`
  (`"create": false` dans `tauri.conf.json`, `WebviewWindowBuilder::from_config` +
  `data_directory`). Paquet : `release/yuri2-portable-<version>/` (exe + LISEZMOI.txt) et
  son .zip, dossier ignoré par git. Testé à froid depuis un dossier vide.
- 2026-10-05: **Son des alarmes joué par Windows.** Sans option `sound`, le toast du plugin
  notification (via `notify-rust`) est muet sous Windows. `fireAlarmNotification(title, body,
  { sound })` passe `sound: "Reminder"` (nom reconnu par `tauri-winrt-notification`), audible
  même fenêtre réduite. Le carillon Web Audio (`playAlarmSound`) ne sert plus qu'en repli quand
  le plugin échoue. Une salve de rappels simultanés ne sonne qu'une fois.
- 2026-10-05: **Filtre Ctrl+F** des composants de l'espace actif (remplace la recherche native
  de la WebView). Correspondance sur nom, type, tags et texte de l'état (`lib/search.ts`, sans
  accents, tous les mots requis ; clés id/couleur/dates/images/mots de passe ignorées). Les
  non-correspondants sont estompés, les résultats cerclés (canevas et dock des réduits).
  Entrée amène le premier résultat à l'écran ; Échap vide, puis ferme.
- 2026-10-05: **Paramètres généraux** (oubli par rapport à yuri 1), bouton engrenage de l'en-tête
  ou Ctrl+, (`components/settings/SettingsDialog.tsx`), enregistrés à chaque changement :
  - Sauvegarde : export JSON (`export_data`, format `yuri2-backup` v1) et import en
    **remplacement complet** (`import_data` → `db::replace_all` en transaction, après
    confirmation, puis rechargement). yuri 1 exportait en Markdown ; yuri2 passe au JSON, plus
    simple et sans perte. Bouton « Depuis yuri 1 » repris ici en plus de l'en-tête.
  - Espace ouvert au démarrage : dernier / premier / espace fixé (`yuri2.startupWorkspace`,
    `lib/startupPref.ts`, repli sur le premier si l'espace a disparu).
  - Navigateur pour les liens : système, navigateurs détectés, ou exécutable personnalisé
    (`yuri.browserPref`, déjà lu par `openWithPref`, il manquait l'écran).
  - Identifiants Google Agenda (réutilise `CredentialsForm`).
  Les préférences (localStorage) ne font pas partie de la sauvegarde, comme dans yuri 1.
- 2026-10-06: **Trois nouveaux composants** (19 types au total) :
  - `timetrack` « Suivi du temps » : chrono par tâche + projet coloré (une plage en cours au
    plus, `end: null`, survit au redémarrage), totaux Aujourd'hui / Cette semaine par projet,
    historique groupé par jour avec relance et suppression. Pas encore de saisie manuelle.
  - `goals` « Objectifs » : par étapes à cocher ou par valeur chiffrée (actuel / cible +
    unité), barre d'avancement, échéance (J-n, en retard), atteints en fin de liste.
  - `clipboard` « Presse-papiers » : `src-tauri/src/clipboard.rs` surveille via
    `GetClipboardSequenceNumber` (500 ms, `windows-sys`) et lit via `arboard`, émet
    `clipboard-changed`. Écoute **au niveau de l'app** (`useClipboardRecorder` dans
    `AppShell`) pour enregistrer même si le composant est réduit ou dans un autre espace.
    50 éléments non épinglés max, dont 12 images (≤ 1280 px), doublons remontés en tête,
    épinglage, recherche, pause. Contenu marqué `ExcludeClipboardContentFromMonitorProcessing`
    ignoré ; le composant Mots de passe copie désormais via `clipboard_write_text(sensitive)`
    (exclu de yuri2, de Win+V et du cloud). Testé : aller-retour texte et exclusion OK.
  - `converters` yuri 1 devient `Partial` (types nés dans yuri2 : état par défaut).
- 2026-10-06: **Barre de titre des composants en pastel** (`.group-header`) : couleur du
  composant à 13 % vers le fond (45 % puis 22 % essayés, trop soutenus) ; marge sous la barre avant le
  contenu ; pastille d'icône à fond opaque pour rester lisible (liseré essayé puis retiré) ;
  titre dans la couleur du composant foncée (40 % mêlée à `--foreground`, 55 % trop clair).
- 2026-10-06: **Survol des listes plus visible**, deux classes communes dans `index.css`,
  teintées par `--group-tint` (couleur du composant) : `.list-row` pour les lignes plates
  (liens, identifiants, tâches et sous-tâches todo, événements Google) = fond teinté 8 % +
  liseré pastel de 1 px tout autour ; `.list-card` pour les petites cartes (kanban, workflow,
  Eisenhower, pomotask) = liseré pastel + ombre. (Une barre à gauche a été essayée puis
  remplacée par le liseré, à la demande.) `data-active="true"` maintient
  l'effet pendant qu'un menu de la ligne est ouvert. Séparateur d'1 px très léger (6 % du texte)
  entre deux `.list-row` consécutives, masqué autour de la ligne survolée. CSS hors `@layer` : prime sur Tailwind.
- 2026-10-06: **Menus contextuels sous le curseur.** Le clic droit (liens, mots de passe)
  ouvrait le menu du bouton « … », donc ancré loin du clic. `useContextMenuAnchor`
  (`components/shared`) pose un repère invisible au point du clic, rendu en portail dans
  `body` (le `transform` des items du canevas fausserait un `position: fixed` sur place),
  et le popover s'y accroche via `triggerRef`. Ouvert par « … », le menu reste sous le bouton.
- 2026-10-05: **Police racine à 10.5px** (12px, 11px puis 10px essayés ; initialement 13.5px) : texte
  plus petit. Tout étant en rem, espacements et composants HeroUI rétrécissent d'autant.
- 2026-10-05: **Capture d'écran dans le composant Image** avec la crate `xcap` 0.9 (choisie
  parmi : coller depuis Win+Shift+S, `xcap`, `getDisplayMedia`). `src-tauri/src/capture.rs` :
  `list_capture_targets` (écrans + fenêtres visibles, titrées, ≥ 80 px, hors yuri2) et
  `capture_target` (masque la fenêtre yuri2 250 ms, capture, réduit à 1600 px, renvoie une
  data URL PNG). Bouton « Capturer » (`CaptureMenu`) dans la barre du composant. Pas de
  sélection de zone : recadrer ensuite dans l'annotation. Testé : 2560×1440 + fenêtres OK.
  Bouton appareil photo de l'en-tête : `capture_primary_screen` (écran principal entier) →
  nouveau composant Image « Capture JJ/MM/AAAA HH:MM » dans l'espace actif, filtre de tag
  retiré et canevas défilé jusqu'à lui (`useGroups.add` accepte un `state` et renvoie l'id).
- 2026-10-05: **Réorganiser l'espace** (bouton grille de l'en-tête) : `lib/arrange.ts`
  range les composants non réduits de l'espace actif en lignes (ordre de lecture conservé,
  largeurs conservées, hauteur de ligne = plus haut composant, jamais de réduction). Filtre
  de tag ignoré. Annulable depuis la notification (`notify` accepte désormais une `action`).
- 2026-10-05: **Système de tags** repris de yuri 1 (tags sur les composants seulement) :
  - `TagInput` (`components/shared`) : pastilles `#tag`, Entrée / virgule / espace valident,
    Retour arrière retire le dernier, suggestions des tags de l'espace (↑/↓, 8 max).
    Normalisation `lib/tags.ts` : minuscules, sans `#`, espaces → tirets. Utilisé à la
    création (`AddGroupDialog`) et dans les réglages du composant.
  - `TagSidebar` : menu à gauche comme yuri 1 (demande explicite : pas de barre en haut),
    ouvert / fermé par une languette sur son bord droit (restée au bord du canevas une fois
    fermé ; plus de bouton dans l'en-tête) ou Ctrl+B, état mémorisé
    (`yuri2.tagSidebarOpen`, ouvert par défaut). « Tous les composants » + un bouton par tag
    avec son compte, un seul tag actif, composants non concernés **masqués** (comme yuri 1). Filtre non mémorisé, retombé si le tag disparaît de l'espace. Le dock des réduits
    l'ignore. Nouveauté : clic sur un tag dans l'en-tête d'un composant = filtre sur ce tag.
- 2026-10-08: **Composant `launcher` « Lanceur »** (20 types) : applications Windows lancées d'un
  clic, en grille ou en liste, réordonnables (dnd-kit), filtre, menu (lancer, lancer en
  administrateur, ouvrir l'emplacement, modifier, retirer). Ajout depuis les applications
  installées (cases à cocher), un fichier ou un chemin / une commande saisis (arguments, dossier
  de travail, admin). `src-tauri/src/launcher.rs` : `list_start_menu_apps` (raccourcis des deux
  dossiers « Programmes », ~40 ms), `list_store_apps` (`Get-StartApps` via PowerShell, ~5 s,
  lancées par `shell:AppsFolder\<AUMID>`), `app_icons` (`SHParseDisplayName` +
  `SHGetFileInfoW` → PNG 32 px, ~50 ms l'icône en debug, chargées par lots de 24 côté front),
  `launch_app` (`ShellExecuteW`, verbe `runas`, `%VARIABLES%` développées). Inventaire gardé en
  mémoire pour la session ; icône stockée dans l'état de l'application. Testé : 118 raccourcis +
  43 applis Store, 161/161 icônes.
  Dépôt de fichiers depuis l'Explorateur : hook partagé `components/shared/useFileDrop.ts`
  (`getCurrentWebview().onDragDropEvent`, seul moyen d'obtenir les chemins ; position physique
  ÷ `devicePixelRatio` puis `elementFromPoint` pour viser le bon composant, même superposé).
  Doublons de chemin ignorés. NB : le dépôt HTML5 du composant Image (`dataTransfer.files`)
  est probablement inopérant tant que le glisser-déposer natif de Tauri est actif.

## Open Questions
- Quel visuel pour chaque type de composant (le cadre commun est fixé) ?
- Valider la liste de bibliothèques proposée.
- Modèle de données : repartir du schéma SQLite de yuri ou le repenser ?
- Monter aussi les dépendances Rust (`cargo update`, rusqlite 0.32 → plus récent) ?

## TODO
- Filtre par tags (barre latérale de yuri).
- Canal inter-groupes : workflow → calendrier (`onSendToCalendar`, déjà prévu côté
  workflow, `addTaskToCalendar` dans `calendarLink.ts`).
- Chiffrer les mots de passe côté Rust ; jetons OAuth Google stockés dans l'état du groupe.
- Images annotées stockées en data URL dans l'état : envisager un stockage fichier.
- Fusionner les barres « Applications » de kanban, calendrier et workflow en un composant
  partagé ; unifier les `genId` locaux sur `@/lib/id` ; deux `InlineInput` coexistent
  (shared et todo).
- Bundle JS de 2 Mo : découper (import dynamique par type de groupe).
- Définir le périmètre fonctionnel de la v2.
- Mettre en place le schéma SQLite et les commandes Tauri associées.
- Surveiller la sortie stable de FullCalendar 7 (tous les plugins) pour migrer.

## Changelog
- 2026-09-30: Projet créé (configs, scaffold React, backend Rust minimal avec commande `ping`).
- 2026-10-01: `package.json` monté aux dernières versions ; FullCalendar laissé en 6.1.21.
  Node mis à jour en 20.20.2 pour satisfaire Vite 8. `npm run build` vert
  (tsc 7 + vite 8, aucun warning), `cargo check` vert.
- 2026-10-01: Passage de shadcn/ui à HeroUI v3 ; `App.tsx` utilise le `Button` HeroUI.
  `npm run build` vert.
