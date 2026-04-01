'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Client = {
  id: string;
  name: string;
  slug: string;
  type: string;
  coverage: string;
  region: string | null;
  vertical: string;
  active: boolean;
  created_at: string;
  user_count: number;
  article_count: number;
  has_profile: number;
};

type User = {
  id: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
};

type ClientDetail = {
  client: Client;
  users: User[];
};

const TYPE_LABELS: Record<string, string> = {
  radio: 'Radio', tv: 'TV', digital: 'Digital',
  portal: 'Portal', revista: 'Revista', otro: 'Otro',
};
const COVERAGE_LABELS: Record<string, string> = {
  nacional: 'Nacional', regional: 'Regional', local: 'Local',
};

export default function AdminPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);

  async function loadClients() {
    const res = await fetch('/api/admin/clients');
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadClients(); }, []);

  async function selectClient(id: string) {
    setLoadingDetail(true);
    setSelected(null);
    const res = await fetch(`/api/admin/clients/${id}`);
    const data = await res.json();
    setSelected(data);
    setLoadingDetail(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Administración</h1>
          <p className="text-xs text-gray-500">Gestión de clientes y usuarios</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
          <button
            onClick={() => setShowNewClient(true)}
            className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            + Nuevo cliente
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Lista de clientes */}
        <div className="w-80 border-r border-gray-800 overflow-y-auto flex-shrink-0">
          {loading ? (
            <div className="p-6 text-gray-500 text-sm">Cargando...</div>
          ) : clients.length === 0 ? (
            <div className="p-6 text-gray-500 text-sm">No hay clientes</div>
          ) : (
            <div>
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client.id)}
                  className={`w-full text-left px-5 py-4 border-b border-gray-800/50 hover:bg-gray-900 transition-colors ${
                    selected?.client.id === client.id ? 'bg-gray-900 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    {!client.active && (
                      <span className="text-xs text-gray-600 ml-2">inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {client.vertical === 'creator' ? 'Creator' : 'Media'} · {TYPE_LABELS[client.type] || client.type} · {COVERAGE_LABELS[client.coverage] || client.coverage}
                    {client.region ? ` · ${client.region}` : ''}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>{client.user_count} usuario{client.user_count !== 1 ? 's' : ''}</span>
                    <span>{client.article_count} nota{client.article_count !== 1 ? 's' : ''}</span>
                    {client.has_profile > 0 ? (
                      <span className="text-green-600">✓ perfil</span>
                    ) : (
                      <span className="text-yellow-600">sin perfil</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalle del cliente */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && !loadingDetail && (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm">
              Selecciona un cliente para ver el detalle
            </div>
          )}
          {loadingDetail && (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
              Cargando...
            </div>
          )}
          {selected && !loadingDetail && (
            <ClientDetail
              detail={selected}
              onAddUser={() => setShowNewUser(true)}
              onUserCreated={() => selectClient(selected.client.id)}
              showNewUser={showNewUser}
              onCloseUser={() => setShowNewUser(false)}
              onEditClient={() => setShowEditClient(true)}
              onClientUpdated={() => { loadClients(); selectClient(selected.client.id); }}
            />
          )}
        </div>
      </div>

      {/* Modal nuevo cliente */}
      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreated={() => { loadClients(); setShowNewClient(false); }}
        />
      )}

      {/* Modal editar cliente */}
      {showEditClient && selected && (
        <EditClientModal
          client={selected.client}
          onClose={() => setShowEditClient(false)}
          onSaved={() => { loadClients(); selectClient(selected.client.id); setShowEditClient(false); }}
        />
      )}
    </div>
  );
}

function ClientDetail({
  detail, onAddUser, onUserCreated, showNewUser, onCloseUser, onEditClient, onClientUpdated,
}: {
  detail: ClientDetail;
  onAddUser: () => void;
  onUserCreated: () => void;
  showNewUser: boolean;
  onCloseUser: () => void;
  onEditClient: () => void;
  onClientUpdated: () => void;
}) {
  const { client, users } = detail;
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const router = useRouter();

  async function handleImpersonate() {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, clientName: client.name }),
    });
    if (res.ok) router.push('/');
  }

  return (
    <div className="max-w-2xl">
      {/* Info cliente */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">{client.name}</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${client.active ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
              {client.active ? 'activo' : 'inactivo'}
            </span>
            <button
              onClick={onEditClient}
              className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              Editar
            </button>
            <button
              onClick={handleImpersonate}
              className="text-xs px-2.5 py-1 bg-blue-700 hover:bg-blue-600 border border-blue-600 rounded-lg transition-colors text-white font-medium"
            >
              Ver dashboard →
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-3">/{client.slug}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Tipo</p>
            <p className="text-sm font-medium">{TYPE_LABELS[client.type] || client.type}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Cobertura</p>
            <p className="text-sm font-medium">{COVERAGE_LABELS[client.coverage] || client.coverage}</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Región</p>
            <p className="text-sm font-medium">{client.region || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{client.user_count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Usuarios</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{client.article_count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Notas</p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className={`text-sm font-medium mt-1 ${client.has_profile > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {client.has_profile > 0 ? '✓ Completo' : 'Pendiente'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Perfil</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          ID: <span className="font-mono">{client.id}</span>
        </p>
        <p className="text-xs text-gray-600">
          Creado: {new Date(client.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Usuarios */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Usuarios</h3>
          <button
            onClick={onAddUser}
            className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            + Agregar usuario
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-gray-600 py-4">Sin usuarios asignados</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{u.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {u.role} · {new Date(u.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                    {u.active ? 'activo' : 'inactivo'}
                  </span>
                  <button
                    onClick={() => setEditingUser(u)}
                    className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nuevo usuario */}
      {showNewUser && (
        <NewUserModal
          clientId={client.id}
          clientName={client.name}
          onClose={onCloseUser}
          onCreated={() => { onCloseUser(); onUserCreated(); }}
        />
      )}

      {/* Modal editar usuario */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          currentClientId={client.id}
          onClose={() => setEditingUser(null)}
          onSaved={() => { setEditingUser(null); onClientUpdated(); }}
        />
      )}
    </div>
  );
}

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', slug: '', type: 'digital', coverage: 'local', region: '', vertical: 'media' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function autoSlug(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch('/api/admin/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, region: form.region || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Error al crear'); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Nuevo cliente</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Nombre del medio</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
              placeholder="Ej: Noticias Jalisco"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="noticias-jalisco"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="digital">Digital</option>
                <option value="portal">Portal</option>
                <option value="radio">Radio</option>
                <option value="tv">TV</option>
                <option value="revista">Revista</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Cobertura</label>
              <select
                value={form.coverage}
                onChange={e => setForm(f => ({ ...f, coverage: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="nacional">Nacional</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Región / Ciudad <span className="text-gray-600">(opcional)</span></label>
            <input
              type="text"
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              placeholder="Ej: Guadalajara, Jalisco"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Producto</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'media', label: 'Media Intelligence', sub: 'Medios, portales, radios' },
                { value: 'creator', label: 'Creator Intelligence', sub: 'Creadores, marcas personales' }].map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, vertical: v.value }))}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    form.vertical === v.value
                      ? 'bg-blue-900/50 border-blue-600 text-blue-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <p className="text-xs font-medium">{v.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.slug}
            className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Creando...' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewUserModal({ clientId, clientName, onClose, onCreated }: {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ email: '', password: '', role: 'editor' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, clientId }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Error al crear'); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Nuevo usuario</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>
        <p className="text-xs text-gray-500 mb-5">{clientName}</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="editor@medio.com"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.email || !form.password}
            className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditClientModal({ client, onClose, onSaved }: {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: client.name,
    slug: client.slug,
    type: client.type,
    coverage: client.coverage,
    region: client.region || '',
    vertical: (client as Client & { vertical?: string }).vertical || 'media',
    active: client.active,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, region: form.region || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Editar cliente</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Nombre del medio</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="digital">Digital</option>
                <option value="portal">Portal</option>
                <option value="radio">Radio</option>
                <option value="tv">TV</option>
                <option value="revista">Revista</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Cobertura</label>
              <select
                value={form.coverage}
                onChange={e => setForm(f => ({ ...f, coverage: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="local">Local</option>
                <option value="regional">Regional</option>
                <option value="nacional">Nacional</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Región / Ciudad</label>
            <input
              type="text"
              value={form.region}
              onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              placeholder="Ej: Guadalajara, Jalisco"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Producto</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: 'media', label: 'Media Intelligence', sub: 'Medios, portales, radios' },
                { value: 'creator', label: 'Creator Intelligence', sub: 'Creadores, marcas personales' }].map(v => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, vertical: v.value }))}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    form.vertical === v.value
                      ? 'bg-blue-900/50 border-blue-600 text-blue-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <p className="text-xs font-medium">{v.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{v.sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Estado</label>
            <button
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                form.active
                  ? 'bg-green-900/50 border-green-700 text-green-400'
                  : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}
            >
              {form.active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.slug}
            className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditUserModal({ user, currentClientId, onClose, onSaved }: {
  user: User;
  currentClientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ email: user.email, role: user.role, active: user.active, clientId: currentClientId });
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/clients').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setClients(data);
    });
  }, []);

  async function handleSave() {
    setError('');
    setSaving(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold">Editar usuario</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          {form.role !== 'superadmin' && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Cliente asignado</label>
              <select
                value={form.clientId}
                onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Estado</label>
            <button
              onClick={() => setForm(f => ({ ...f, active: !f.active }))}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                form.active
                  ? 'bg-green-900/50 border-green-700 text-green-400'
                  : 'bg-gray-800 border-gray-700 text-gray-500'
              }`}
            >
              {form.active ? 'Activo' : 'Inactivo'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-sm py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.email}
            className="flex-1 text-sm py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
