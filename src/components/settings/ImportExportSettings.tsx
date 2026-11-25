import { useState, type ReactNode } from "react";
import { Button, Spinner } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { AppWindow, CheckCircle2, Layers, Pencil, PlugZap, Plus, Server as ServerIcon, ShieldAlert, Terminal, Trash2, XCircle } from "lucide-react";
import { ColorSwatches, PALETTE } from "@/components/shared/ColorSwatches";
import { ConnectionFields } from "@/components/importexport/ConnectionFields";
import { Badge, PathInput, SelectBox, TextInput, Toggle } from "@/components/importexport/ui";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";
import {
  errorMessage,
  ieApi,
  newServer,
  saveIeSettings,
  SSL_MODES,
  updateIeSettings,
  useIeSettings,
  type IeApplication,
  type IeEnvironment,
  type IeServer,
  type IeSettings,
} from "@/lib/importExport";
import { notify } from "@/lib/notify";

/** Onglet « Import / Export » des paramètres : outils MariaDB, applications, environnements, serveurs. */
export function ImportExportSettings() {
  const settings = useIeSettings();
  if (!settings) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size="sm" />
      </div>
    );
  }
  const save = async (next: IeSettings) => {
    try {
      await saveIeSettings(next);
    } catch (e) {
      notify({ title: "Enregistrement impossible", body: errorMessage(e), kind: "alarm", durationMs: 8000 });
    }
  };
  return (
    <div className="flex flex-col gap-7">
      <ToolsSection settings={settings} onSave={save} />
      <ApplicationsSection settings={settings} onSave={save} />
      <EnvironmentsSection settings={settings} onSave={save} />
      <ServersSection settings={settings} onSave={save} />
    </div>
  );
}

type SectionProps = { settings: IeSettings; onSave: (next: IeSettings) => Promise<void> };

function Section({
  icon: Icon,
  title,
  hint,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="flex items-center gap-2 text-[0.963rem] font-bold">
            <Icon className="size-4 text-muted" />
            {title}
          </h3>
          {hint && <p className="text-[0.8889rem] leading-relaxed text-muted">{hint}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Outils

type Tools = Pick<IeSettings, "dumpPath" | "clientPath" | "defaultOutputDir">;

/** Enregistré à chaque saisie, comme les autres sections (pas de bouton à oublier). */
function ToolsSection({ settings }: SectionProps) {
  const draft: Tools = settings;
  const [check, setCheck] = useState<{ ok: boolean; text: string; client?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const setDraft = (patch: Partial<Tools>) =>
    void updateIeSettings((current) => ({ next: { ...current, ...patch }, result: undefined })).catch((e) =>
      notify({ title: "Enregistrement impossible", body: errorMessage(e), kind: "alarm", durationMs: 8000 }),
    );

  async function verify() {
    setChecking(true);
    try {
      const r = await ieApi.checkBinary(draft.dumpPath, draft.clientPath);
      setCheck({ ok: true, text: r.version, client: r.clientPath });
    } catch (e) {
      setCheck({ ok: false, text: errorMessage(e) });
    } finally {
      setChecking(false);
    }
  }

  const exe = [{ name: "Exécutable", extensions: ["exe"] }];
  return (
    <Section icon={Terminal} title="Outils MariaDB" hint="mariadb-dump sert aux exports ; le client mariadb au test de connexion, à la liste des bases et aux imports.">
      <PathInput
        label="Chemin de mariadb-dump"
        value={draft.dumpPath}
        onChange={(dumpPath) => {
          setDraft({ dumpPath });
          setCheck(null);
        }}
        placeholder="C:\Program Files\MariaDB 11.4\bin\mariadb-dump.exe"
        filters={exe}
      />
      <PathInput
        label="Client mariadb (optionnel)"
        value={draft.clientPath}
        onChange={(clientPath) => setDraft({ clientPath })}
        placeholder="Détecté automatiquement à côté de mariadb-dump"
        filters={exe}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" onPress={() => void verify()} isDisabled={!draft.dumpPath || checking}>
          {checking && <Spinner size="sm" />}
          Vérifier
        </Button>
        {check && (
          <span className={`flex min-w-0 items-center gap-1.5 text-[0.8889rem] ${check.ok ? "text-success" : "text-danger"}`}>
            {check.ok ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
            <span className="min-w-0 break-words">{check.text}</span>
          </span>
        )}
      </div>
      {check?.ok && (
        <p className="text-[0.8148rem] text-muted">
          Client mariadb : {check.client ? <code className="break-all">{check.client}</code> : "non trouvé (test limité, import impossible)"}
        </p>
      )}
      <PathInput
        label="Répertoire de sortie par défaut"
        value={draft.defaultOutputDir}
        onChange={(defaultOutputDir) => setDraft({ defaultOutputDir })}
        placeholder="D:\Sauvegardes\MariaDB"
        description="Pour les connecteurs sans répertoire propre. Variables acceptées : {app}, {env}, {date:%Y%m}…"
        directory
      />
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Applications et environnements

function ApplicationsSection({ settings, onSave }: SectionProps) {
  const [editing, setEditing] = useState<IeApplication | null>(null);
  const items = settings.applications;

  async function commit(app: IeApplication) {
    const exists = items.some((a) => a.id === app.id);
    await onSave({ ...settings, applications: exists ? items.map((a) => (a.id === app.id ? app : a)) : [...items, app] });
    setEditing(null);
  }

  async function remove(app: IeApplication) {
    if (await confirmDelete(`Supprimer l'application « ${app.name} » ? Elle disparaît de tous les composants : les éléments qui y étaient rattachés (tâches, cartes, actions, MEP, connecteurs) n'auront plus d'application.`)) {
      await onSave({ ...settings, applications: items.filter((a) => a.id !== app.id) });
    }
  }

  return (
    <Section
      icon={AppWindow}
      title="Applications"
      hint="Liste unique utilisée par tous les composants : calendrier, Kanban, suivi de projet, mise en production et import / export."
      actions={
        <Button size="sm" variant="secondary" onPress={() => setEditing({ id: genId(), name: "", color: PALETTE[items.length % PALETTE.length], notes: "" })}>
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      }
    >
      {items.length === 0 && !editing && <p className="text-[0.8889rem] text-muted">Aucune application pour l'instant.</p>}
      <ul className="flex flex-col divide-y divide-separator">
        {items.map((it) =>
          editing?.id === it.id ? (
            <RefEditor key={it.id} value={editing} onChange={(v) => setEditing(v as IeApplication)} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
          ) : (
            <RefRow key={it.id} onEdit={() => setEditing({ ...it })} onDelete={() => void remove(it)}>
              <Badge color={it.color}>{it.name}</Badge>
              {it.notes && <span className="truncate text-[0.8889rem] text-muted">{it.notes}</span>}
            </RefRow>
          ),
        )}
        {editing && !items.some((a) => a.id === editing.id) && (
          <RefEditor value={editing} onChange={(v) => setEditing(v as IeApplication)} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
        )}
      </ul>
    </Section>
  );
}

function EnvironmentsSection({ settings, onSave }: SectionProps) {
  const [editing, setEditing] = useState<IeEnvironment | null>(null);
  const items = settings.environments;

  async function commit(env: IeEnvironment) {
    const exists = items.some((e) => e.id === env.id);
    await onSave({ ...settings, environments: exists ? items.map((e) => (e.id === env.id ? env : e)) : [...items, env] });
    setEditing(null);
  }

  async function remove(env: IeEnvironment) {
    const used = settings.servers.filter((s) => s.environmentId === env.id).length;
    if (used > 0) {
      notify({ title: "Environnement utilisé", body: `${used} serveur(s) y sont rattachés : changez-les d'environnement d'abord.`, kind: "alarm", durationMs: 6000 });
      return;
    }
    if (await confirmDelete(`Supprimer l'environnement « ${env.name} » ?`)) {
      await onSave({ ...settings, environments: items.filter((e) => e.id !== env.id) });
    }
  }

  function move(env: IeEnvironment, delta: -1 | 1) {
    const list = [...items];
    const i = list.findIndex((e) => e.id === env.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    void onSave({ ...settings, environments: list });
  }

  return (
    <Section
      icon={Layers}
      title="Environnements"
      hint="DEV, RECETTE, PROD… Un environnement « sensible » exige de recopier son nom avant chaque lancement."
      actions={
        <Button size="sm" variant="secondary" onPress={() => setEditing({ id: genId(), name: "", color: PALETTE[(items.length + 5) % PALETTE.length], confirm: false })}>
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      }
    >
      {items.length === 0 && !editing && <p className="text-[0.8889rem] text-muted">Aucun environnement pour l'instant.</p>}
      <ul className="flex flex-col divide-y divide-separator">
        {items.map((it, i) =>
          editing?.id === it.id ? (
            <RefEditor key={it.id} value={editing} onChange={(v) => setEditing(v as IeEnvironment)} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
          ) : (
            <RefRow
              key={it.id}
              onEdit={() => setEditing({ ...it })}
              onDelete={() => void remove(it)}
              onUp={i > 0 ? () => move(it, -1) : undefined}
              onDown={i < items.length - 1 ? () => move(it, 1) : undefined}
            >
              <Badge color={it.color}>{it.name}</Badge>
              {it.confirm && (
                <span className="flex items-center gap-1 text-[0.8148rem] text-warning">
                  <ShieldAlert className="size-3.5" /> sensible
                </span>
              )}
            </RefRow>
          ),
        )}
        {editing && !items.some((e) => e.id === editing.id) && (
          <RefEditor value={editing} onChange={(v) => setEditing(v as IeEnvironment)} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
        )}
      </ul>
    </Section>
  );
}

function RefRow({
  children,
  onEdit,
  onDelete,
  onUp,
  onDown,
}: {
  children: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      {(onUp || onDown) && (
        <div className="flex">
          <Button isIconOnly size="sm" variant="ghost" aria-label="Monter" isDisabled={!onUp} onPress={onUp}>
            ↑
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Descendre" isDisabled={!onDown} onPress={onDown}>
            ↓
          </Button>
        </div>
      )}
      <Button isIconOnly size="sm" variant="ghost" aria-label="Modifier" onPress={onEdit}>
        <Pencil className="size-3.5" />
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Supprimer" onPress={onDelete}>
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  );
}

function RefEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: IeApplication | IeEnvironment;
  onChange: (v: IeApplication | IeEnvironment) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <li className="my-1 flex flex-col gap-3 rounded-xl bg-surface-secondary p-3">
      <div className="flex flex-wrap items-end gap-3">
        <TextInput label="Nom" value={value.name} onChange={(name) => onChange({ ...value, name })} className="w-44" autoFocus />
        {"notes" in value && (
          <TextInput label="Notes" value={value.notes} onChange={(notes) => onChange({ ...value, notes })} className="min-w-40 flex-1" />
        )}
      </div>
      <ColorSwatches value={value.color} onChange={(color) => onChange({ ...value, color: color ?? PALETTE[0] })} />
      {"confirm" in value && (
        <Toggle
          label="Environnement sensible"
          description="Le nom de l'environnement doit être recopié avant chaque export ou import"
          isSelected={value.confirm}
          onChange={(confirm) => onChange({ ...value, confirm })}
        />
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onPress={onCancel}>
          Annuler
        </Button>
        <Button size="sm" onPress={onSave} isDisabled={!value.name.trim()}>
          Enregistrer
        </Button>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Serveurs

function ServersSection({ settings, onSave }: SectionProps) {
  const [editing, setEditing] = useState<IeServer | null>(null);
  const { servers, environments } = settings;

  async function commit(server: IeServer) {
    const exists = servers.some((s) => s.id === server.id);
    await onSave({ ...settings, servers: exists ? servers.map((s) => (s.id === server.id ? server : s)) : [...servers, server] });
    setEditing(null);
  }

  async function remove(s: IeServer) {
    if (await confirmDelete(`Supprimer le serveur « ${s.name} » et son mot de passe ? Les connecteurs qui l'utilisent devront en choisir un autre.`)) {
      await onSave({ ...settings, servers: servers.filter((x) => x.id !== s.id) });
    }
  }

  const isNew = editing && !servers.some((s) => s.id === editing.id);
  const orphans = servers.filter((s) => !environments.some((e) => e.id === s.environmentId));
  const groups = [
    ...environments.map((env) => ({ key: env.id, env, list: servers.filter((s) => s.environmentId === env.id) })),
    { key: "none", env: undefined, list: orphans },
  ].filter((g) => g.list.length > 0);

  return (
    <Section
      icon={ServerIcon}
      title="Serveurs"
      hint="Serveurs MariaDB par environnement, réutilisables par les connecteurs (mot de passe chiffré)."
      actions={
        <Button size="sm" variant="secondary" onPress={() => setEditing(newServer(environments[0]?.id ?? ""))} isDisabled={environments.length === 0}>
          <Plus className="size-3.5" />
          Ajouter
        </Button>
      }
    >
      {environments.length === 0 && <p className="text-[0.8889rem] text-muted">Créez d'abord un environnement.</p>}
      {servers.length === 0 && environments.length > 0 && !editing && <p className="text-[0.8889rem] text-muted">Aucun serveur pour l'instant.</p>}
      {groups.map(({ key, env, list }) => (
        <div key={key} className="flex flex-col gap-1">
          {env ? <Badge color={env.color}>{env.name}</Badge> : <span className="text-[0.8148rem] font-semibold text-warning">Sans environnement</span>}
          <ul className="flex flex-col">
            {list.map((s) =>
              editing?.id === s.id ? (
                <ServerEditor key={s.id} value={editing} settings={settings} onChange={setEditing} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
              ) : (
                <li key={s.id} className="flex items-center gap-3 rounded-[10px] px-2 py-1.5 hover:bg-surface-secondary">
                  <ServerIcon className="size-4 shrink-0 text-muted" />
                  <span className="font-semibold">{s.name}</span>
                  <span className="min-w-0 truncate font-mono text-[0.8148rem] text-muted">
                    {s.user ? `${s.user}@` : ""}
                    {s.host}:{s.port}
                  </span>
                  {s.sslMode !== "default" && (
                    <span className="shrink-0 rounded-md bg-default px-1.5 text-[0.7407rem] font-semibold text-muted">
                      SSL {SSL_MODES.find((m) => m.id === s.sslMode)?.label.toLowerCase()}
                    </span>
                  )}
                  <span className="ml-auto" />
                  <Button isIconOnly size="sm" variant="ghost" aria-label="Modifier" onPress={() => setEditing({ ...s })}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label="Supprimer" onPress={() => void remove(s)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
      {isNew && editing && (
        <ul>
          <ServerEditor value={editing} settings={settings} onChange={setEditing} onSave={() => void commit(editing)} onCancel={() => setEditing(null)} />
        </ul>
      )}
    </Section>
  );
}

function ServerEditor({
  value,
  settings,
  onChange,
  onSave,
  onCancel,
}: {
  value: IeServer;
  settings: IeSettings;
  onChange: (s: IeServer) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [test, setTest] = useState<{ state: "idle" | "running" | "ok" | "error"; text?: string }>({ state: "idle" });
  const patch = (p: Partial<IeServer>) => {
    onChange({ ...value, ...p });
    setTest({ state: "idle" });
  };

  async function runTest() {
    setTest({ state: "running" });
    try {
      setTest({ state: "ok", text: await ieApi.test({ ...value, serverId: null }) });
    } catch (e) {
      setTest({ state: "error", text: errorMessage(e) });
    }
  }

  const canTest = (settings.dumpPath || settings.clientPath) && value.host.trim();
  return (
    <li className="my-1 flex flex-col gap-4 rounded-xl bg-surface-secondary p-3">
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Nom" value={value.name} onChange={(name) => patch({ name })} placeholder="ex. MariaDB principal" autoFocus />
        <SelectBox
          label="Environnement"
          value={value.environmentId || null}
          onChange={(environmentId) => patch({ environmentId })}
          items={settings.environments.map((e) => ({ id: e.id, label: e.name, color: e.color }))}
        />
      </div>
      <ConnectionFields value={value} onChange={patch} />
      <TextInput label="Notes" value={value.notes} onChange={(notes) => patch({ notes })} placeholder="Optionnel" />
      <div className="flex flex-col gap-2">
        <div>
          <Button size="sm" variant="secondary" onPress={() => void runTest()} isDisabled={test.state === "running" || !canTest}>
            {test.state === "running" ? <Spinner size="sm" /> : <PlugZap className="size-3.5" />}
            Tester la connexion
          </Button>
        </div>
        {!(settings.dumpPath || settings.clientPath) && <p className="text-[0.8148rem] text-muted">Enregistrez d'abord les outils MariaDB ci-dessus.</p>}
        {test.state === "ok" && (
          <p className="flex items-center gap-2 rounded-[10px] bg-success/10 px-3 py-2 text-[0.8889rem] text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            {test.text}
          </p>
        )}
        {test.state === "error" && (
          <div className="flex items-start gap-2 rounded-[10px] bg-danger/10 px-3 py-2 text-[0.8889rem] text-danger">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <pre className="font-sans whitespace-pre-wrap">{test.text}</pre>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onPress={onCancel}>
          Annuler
        </Button>
        <Button size="sm" onPress={onSave} isDisabled={!value.name.trim() || !value.host.trim() || !value.environmentId}>
          Enregistrer
        </Button>
      </div>
    </li>
  );
}
