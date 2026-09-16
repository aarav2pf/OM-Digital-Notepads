import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  addSuperadmin,
  createNotepad,
  deleteNotepad,
  getNotepads,
  getSuperadmins,
  getTrash,
  restoreNotepad,
  updateNotepad,
  removeSuperadmin,
} from './api';
import { useAuth } from './auth/AuthProvider';
import Login from './auth/Login';
import AccessDenied from './auth/AccessDenied';
import notepadThumbnail from './assets/notepad-thumbnail.png';

const SUPER_SUPER_ADMIN = 'aaravsadhu7@gmail.com';

const emptyForm = {
  college_name: '',
  event_name: '',
  team_name: '',
  team_leader_name: '',
  team_leader_contact: '',
  boys: 0,
  girls: 0,
  total_members: 0,
  mentor_name: '',
  mentor_contact: '',
  mentor_room: '',
  accommodation: '',
  transaction_id: '',
  amount_paid: '',
  oc_poc: '',
  oc_poc_contact: '',
  duration: '',
  arrival_date: '',
  expected_departure_date: '',
  additional_remarks: '',
};

const sortLabels = {
  created: 'Recently added',
  arrival: 'Date of arrival',
  departure: 'Expected departure',
  college: 'College name',
  event: 'Event name',
  team: 'Team name',
};

function toForm(data = {}) {
  return {
    ...emptyForm,
    college_name: data.college_name ?? '',
    event_name: data.event_name ?? '',
    team_name: data.team_name ?? '',
    team_leader_name: data.team_leader_name ?? '',
    team_leader_contact: data.team_leader_contact ?? '',
    boys: data.boys ?? 0,
    girls: data.girls ?? 0,
    total_members: data.total_members ?? 0,
    mentor_name: data.mentor_name ?? '',
    mentor_contact: data.mentor_contact ?? '',
    mentor_room: data.mentor_room ?? '',
    accommodation: data.accommodation ?? '',
    transaction_id: data.transaction_id ?? '',
    amount_paid: data.amount_paid ?? '',
    oc_poc: data.oc_poc ?? '',
    oc_poc_contact: data.oc_poc_contact ?? '',
    duration: data.duration ?? '',
    arrival_date: data.arrival_date
      ? String(data.arrival_date).slice(0, 10)
      : '',
    expected_departure_date: data.expected_departure_date
      ? String(data.expected_departure_date).slice(0, 10)
      : '',
    additional_remarks: data.additional_remarks ?? '',
  };
}

function displayDate(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
}

function displayTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      });
}

function groupByCreatedDate(notepads) {
  const groups = new Map();

  for (const note of notepads) {
    const key = displayDate(note.created_at);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(note);
  }

  return [...groups.entries()];
}

function sortNotepads(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === 'college') {
      return (
        (a.college_name || '').localeCompare(b.college_name || '') ||
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (sort === 'event') {
      return (
        (a.event_name || '').localeCompare(b.event_name || '') ||
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (sort === 'team') {
      return (
        (a.team_name || '').localeCompare(b.team_name || '') ||
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (sort === 'arrival') {
      const aDate = a.arrival_date
        ? new Date(a.arrival_date).getTime()
        : Infinity;

      const bDate = b.arrival_date
        ? new Date(b.arrival_date).getTime()
        : Infinity;

      return (
        aDate - bDate ||
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    if (sort === 'departure') {
      const aDate = a.expected_departure_date
        ? new Date(a.expected_departure_date).getTime()
        : Infinity;

      const bDate = b.expected_departure_date
        ? new Date(b.expected_departure_date).getTime()
        : Infinity;

      return (
        aDate - bDate ||
        new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function matchesSearch(note, query) {
  const q = query.trim().toLowerCase();

  if (!q) {
    return true;
  }

  const college = (note.college_name || '').toLowerCase();
  const event = (note.event_name || '').toLowerCase();
  const team = (note.team_name || '').toLowerCase();

  const combined = `${college} ${event} ${team}`;
  const combinedDashed = `${college} - ${event} - ${team}`;

  if (
    college.includes(q) ||
    event.includes(q) ||
    team.includes(q)
  ) {
    return true;
  }

  if (
    combined.includes(q) ||
    combinedDashed.includes(q)
  ) {
    return true;
  }

  return q
    .split(/\s+/)
    .every((part) => combined.includes(part));
}

export default function App() {
  const {
    session,
    authorized,
    loading: authLoading,
  } = useAuth();

  if (!session) {
  if (authLoading) {
    return (
      <div className="auth-loading">
        Checking authorization...
      </div>
    );
  }

  return <Login />;
}

if (authorized === null) {
  return (
    <div className="auth-loading">
      Checking authorization...
    </div>
  );
}

if (authorized === false) {
  return <AccessDenied />;
}

return <NotepadApp />;
}

function NotepadApp() {
  const { user, logout } = useAuth();

  const isSuperSuperAdmin =
    user?.email?.toLowerCase() ===
    SUPER_SUPER_ADMIN;

  const [notepads, setNotepads] = useState([]);
  const [trash, setTrash] = useState([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [mode, setMode] = useState(null);
  const [showSort, setShowSort] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [notes, deleted] = await Promise.all([
        getNotepads(),
        getTrash(),
      ]);

      setNotepads(notes);
      setTrash(deleted);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      sortNotepads(
        notepads.filter((note) =>
          matchesSearch(note, query)
        ),
        sort
      ),
    [notepads, query, sort]
  );

  const grouped = useMemo(
    () =>
      sort === 'created'
        ? groupByCreatedDate(filtered)
        : null,
    [filtered, sort]
  );

  async function handleCreate() {
    try {
      const note = await createNotepad();

      setNotepads((current) => [
        note,
        ...current,
      ]);

      setActive(note);
      setMode('create');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  function openNote(note, nextMode) {
    setActive(note);
    setMode(nextMode);
  }

  function handleNoteSaved(updated) {
    setNotepads((current) =>
      current.map((item) =>
        item.id === updated.id
          ? updated
          : item
      )
    );
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      const deleted = await deleteNotepad(
        deleteTarget.id
      );

      setNotepads((current) =>
        current.filter(
          (item) =>
            item.id !== deleteTarget.id
        )
      );

      setTrash((current) => [
        deleted,
        ...current,
      ]);

      setDeleteTarget(null);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRestore(id) {
    try {
      const restored =
        await restoreNotepad(id);

      setTrash((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      setNotepads((current) => [
        restored,
        ...current,
      ]);

      setShowTrash(false);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          DIGITAL NOTEPAD
        </div>

        <div className="topbar-actions">
          <button
            className="create-btn"
            onClick={handleCreate}
          >
            <Plus size={18} />
            Create New Notepad
          </button>

          <button
            className="extra-btn"
            onClick={() =>
              setShowAdmin(true)
            }
          >
            Superadmins
          </button>

          <button
            className="extra-btn"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </header>

      <section className="toolbar">
        <div className="search-wrap">
          <Search size={19} />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search college, event or team name..."
          />

          {query && (
            <button
              className="icon-btn"
              onClick={() =>
                setQuery('')
              }
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-wrap">
          <button
            className="sort-btn"
            onClick={() =>
              setShowSort((v) => !v)
            }
          >
            Sort: {sortLabels[sort]}
            <ChevronDown size={17} />
          </button>

          {showSort && (
            <div className="sort-menu">
              {Object.entries(
                sortLabels
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    className={
                      sort === value
                        ? 'selected'
                        : ''
                    }
                    onClick={() => {
                      setSort(value);
                      setShowSort(false);
                    }}
                  >
                    {label}

                    {sort === value && (
                      <Check size={15} />
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="content">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="recent-label">
          RECENTS
        </div>

        <div className="recent-subtitle">
          Notepads are shown from newest to oldest.
        </div>

        {loading ? (
          <div className="state">
            Loading notepads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="state">
            No notepads found.
          </div>
        ) : sort === 'created' ? (
          grouped.map(
            ([date, notes]) => (
              <NotepadRow
                key={date}
                date={date}
                notes={notes}
                onOpen={openNote}
                onDelete={
                  setDeleteTarget
                }
              />
            )
          )
        ) : (
          <NotepadRow
            date={`Sorted by ${sortLabels[sort]}`}
            notes={filtered}
            onOpen={openNote}
            onDelete={setDeleteTarget}
          />
        )}

        <div className="trash-area">
          <button
            className="trash-link"
            onClick={() =>
              setShowTrash(true)
            }
          >
            <Trash2 size={15} />
            Trash{' '}
            {trash.length > 0 &&
              `(${trash.length})`}
          </button>
        </div>
      </section>

      {active && mode && (
        <NotepadModal
          note={active}
          mode={mode}
          onClose={() => {
            setActive(null);
            setMode(null);
          }}
          onSaved={handleNoteSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDelete
          note={deleteTarget}
          onCancel={() =>
            setDeleteTarget(null)
          }
          onConfirm={confirmDelete}
        />
      )}

      {showTrash && (
        <TrashModal
          trash={trash}
          onClose={() =>
            setShowTrash(false)
          }
          onRestore={handleRestore}
        />
      )}

      {showAdmin && (
        <SuperadminModal
          currentUser={user}
          isSuperSuperAdmin={
            isSuperSuperAdmin
          }
          onClose={() =>
            setShowAdmin(false)
          }
        />
      )}
    </main>
  );
}

function NotepadRow({
  date,
  notes,
  onOpen,
  onDelete,
}) {
  const scroller = useRef(null);

  return (
    <section className="date-section">
      <div className="date-heading">
        {date}
      </div>

      <div className="row-shell">
        <div
          className="notepad-row"
          ref={scroller}
        >
          {notes.map((note) => (
            <NotepadCard
              key={note.id}
              note={note}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function NotepadCard({
  note,
  onOpen,
  onDelete,
}) {
  const title = [
    note.college_name || 'College',
    note.event_name || 'Event',
    note.team_name || 'Team',
  ].join(' - ');

  return (
    <article className="card">
      <div className="thumbnail-wrap">
        <img
          src={notepadThumbnail}
          alt="Notepad"
        />

        <div className="hover-actions">
          <button
            onClick={() =>
              onOpen(note, 'view')
            }
          >
            View
          </button>

          <button
            onClick={() =>
              onOpen(note, 'edit')
            }
          >
            <Edit3 size={14} />
            Edit
          </button>

          <button
            className="delete-hover"
            onClick={() =>
              onDelete(note)
            }
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <div
        className="card-title"
        title={title}
      >
        {title}
      </div>

      {note.created_at && (
        <div className="card-time">
          {displayTime(note.created_at)}
        </div>
      )}
    </article>
  );
}

function NotepadModal({
  note,
  mode,
  onClose,
  onSaved,
}) {
  const isCreate = mode === 'create';
  const editable =
    isCreate || mode === 'edit';

  const [form, setForm] = useState(
    () => toForm(note)
  );

  const [saving, setSaving] =
    useState(false);

  const [savedAt, setSavedAt] =
    useState(
      note.updated_at ||
        note.created_at
    );

  const saveTimer = useRef(null);

  useEffect(() => {
    return () =>
      clearTimeout(
        saveTimer.current
      );
  }, []);

  function scheduleAutosave(nextForm) {
    clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(
      () => autosave(nextForm),
      1200
    );
  }

  function change(field, value) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (editable) {
        scheduleAutosave(next);
      }

      return next;
    });
  }

  async function autosave(nextForm) {
    setSaving(true);

    try {
      const updated =
        await updateNotepad(
          note.id,
          nextForm
        );

      setSavedAt(
        updated.updated_at
      );

      onSaved(updated);
    } catch (e) {
      console.error(
        'Autosave failed:',
        e
      );
    } finally {
      setSaving(false);
    }
  }

  async function manualSave() {
    clearTimeout(saveTimer.current);

    setSaving(true);

    try {
      const updated =
        await updateNotepad(
          note.id,
          form
        );

      setSavedAt(
        updated.updated_at
      );

      onSaved(updated);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const input = (
    label,
    field,
    type = 'text',
    extra = {}
  ) => (
    <label className="field">
      <span>{label}</span>

      <input
        type={type}
        value={form[field]}
        onChange={(e) =>
          change(
            field,
            type === 'number'
              ? e.target.value === ''
                ? ''
                : Number(
                    e.target.value
                  )
              : e.target.value
          )
        }
        {...extra}
        placeholder={
          editable
            ? extra.placeholder
            : undefined
        }
      />
    </label>
  );

  return (
    <div className="modal-backdrop">
      <div className="notepad-modal">
        <div className="modal-top">
          <button
            className="back-btn"
            onClick={onClose}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="save-state">
            {editable &&
              (saving
                ? 'Saving...'
                : '✓ Autosaved')}

            {!editable &&
              'View only'}
          </div>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <div className="paper">
          <div className="paper-rings">
            {Array.from(
              { length: 13 },
              (_, i) => (
                <span key={i}>
                  ○
                </span>
              )
            )}
          </div>

          <div className="paper-inner">
            <h1>
              DIGITAL NOTEPAD
            </h1>

            <div className="paper-grid">
              {input(
                'College Name',
                'college_name',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Event',
                'event_name',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Team Name',
                'team_name',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Team Leader Name',
                'team_leader_name',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Team Leader Contact',
                'team_leader_contact',
                'tel',
                {
                  disabled: !editable,
                }
              )}

              <div className="two-col">
                {input(
                  'Number of Boys',
                  'boys',
                  'number',
                  {
                    min: 0,
                    disabled:
                      !editable,
                  }
                )}

                {input(
                  'Number of Girls',
                  'girls',
                  'number',
                  {
                    min: 0,
                    disabled:
                      !editable,
                  }
                )}
              </div>

              {input(
                'Total Members',
                'total_members',
                'number',
                {
                  min: 0,
                  disabled: !editable,
                }
              )}

              <div className="section-divider">
                MENTOR
              </div>

              {input(
                'Mentor Name (if any)',
                'mentor_name',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Mentor Contact',
                'mentor_contact',
                'tel',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Mentor Room',
                'mentor_room',
                'text',
                {
                  disabled: !editable,
                }
              )}

              <div className="section-divider">
                ACCOMMODATION
              </div>

              <label className="field textarea-field">
                <span>
                  Accommodation
                </span>

                <textarea
                  value={
                    form.accommodation
                  }
                  onChange={(e) =>
                    change(
                      'accommodation',
                      e.target.value
                    )
                  }
                  disabled={!editable}
                  placeholder={
                    editable
                      ? 'e.g. Block 13: 103, 204\nBlock 15: 204, 304'
                      : undefined
                  }
                />
              </label>

              <div className="section-divider">
                PAYMENT
              </div>

              {input(
                'Transaction ID',
                'transaction_id',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'Amount Paid',
                'amount_paid',
                'number',
                {
                  min: 0,
                  step: '0.01',
                  disabled: !editable,
                }
              )}

              <div className="section-divider">
                OM POC
              </div>

              {input(
                'OC POC',
                'oc_poc',
                'text',
                {
                  disabled: !editable,
                }
              )}

              {input(
                'OC POC Contact',
                'oc_poc_contact',
                'tel',
                {
                  disabled: !editable,
                }
              )}

              <div className="section-divider">
                STAY
              </div>

              {input(
                'Duration',
                'duration',
                'text',
                {
                  disabled: !editable,
                  placeholder:
                    'e.g. 2 nights',
                }
              )}

              <div className="two-col">
                {input(
                  'Date of Arrival',
                  'arrival_date',
                  'date',
                  {
                    disabled:
                      !editable,
                  }
                )}

                {input(
                  'Expected Departure',
                  'expected_departure_date',
                  'date',
                  {
                    disabled:
                      !editable,
                  }
                )}
              </div>

              <div className="section-divider">
                ADDITIONAL REMARKS
              </div>

              <label className="field textarea-field">
                <span>
                  Remarks
                </span>

                <textarea
                  value={
                    form.additional_remarks
                  }
                  onChange={(e) =>
                    change(
                      'additional_remarks',
                      e.target.value
                    )
                  }
                  disabled={!editable}
                  placeholder={
                    editable
                      ? 'Any additional information...'
                      : undefined
                  }
                />
              </label>

              <div className="system-info">
                <span>
                  Created:{' '}
                  {note.created_at
                    ? new Date(
                        note.created_at
                      ).toLocaleString(
                        'en-IN'
                      )
                    : '—'}
                </span>

                <span>
                  Last updated:{' '}
                  {savedAt
                    ? new Date(
                        savedAt
                      ).toLocaleString(
                        'en-IN'
                      )
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {editable && (
          <div className="modal-footer">
            <button
              className="primary-action"
              onClick={manualSave}
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : 'Save & Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDelete({
  note,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="light-confirm-backdrop">
      <div className="confirm-box">
        <h2>
          Move to Trash?
        </h2>

        <p>
          {note.team_name ||
            'This notepad'}{' '}
          will be moved to Trash.
          It will not be permanently
          deleted.
        </p>

        <div className="confirm-actions">
          <button
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="danger-action"
            onClick={onConfirm}
          >
            Move to Trash
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashModal({
  trash,
  onClose,
  onRestore,
}) {
  return (
    <div className="modal-backdrop solid-modal-backdrop">
      <div className="trash-modal">
        <div className="trash-modal-top">
          <button
            className="back-btn"
            onClick={onClose}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <div className="trash-title">
          <div className="recent-label">
            TRASH
          </div>

          <h2>
            Deleted Notepads
          </h2>

          <p>
            Deleted notepads stay
            here until they are
            restored.
          </p>
        </div>

        {trash.length === 0 ? (
          <div className="trash-empty">
            Trash is empty.
          </div>
        ) : (
          <div className="trash-list">
            {trash.map((note) => (
              <div
                className="trash-item"
                key={note.id}
              >
                <div>
                  <div className="trash-item-title">
                    {note.college_name ||
                      'College'}{' '}
                    -{' '}
                    {note.event_name ||
                      'Event'}{' '}
                    -{' '}
                    {note.team_name ||
                      'Team'}
                  </div>

                  <div className="trash-item-time">
                    Deleted{' '}
                    {note.deleted_at
                      ? new Date(
                          note.deleted_at
                        ).toLocaleString(
                          'en-IN'
                        )
                      : ''}
                  </div>
                </div>

                <button
                  className="restore-btn"
                  onClick={() =>
                    onRestore(
                      note.id
                    )
                  }
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SuperadminModal({
  currentUser,
  isSuperSuperAdmin,
  onClose,
}) {
  const [admins, setAdmins] =
    useState([]);

  const [email, setEmail] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    getSuperadmins()
      .then(setAdmins)
      .catch((e) =>
        setMessage(e.message)
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  async function handleAdd(e) {
    e.preventDefault();

    if (!isSuperSuperAdmin) {
      return;
    }

    if (!email.trim()) {
      return;
    }

    try {
      const admin =
        await addSuperadmin(
          email.trim()
        );

      setAdmins((current) => {
        const without =
          current.filter(
            (item) =>
              item.id !== admin.id
          );

        return [
          admin,
          ...without,
        ];
      });

      setEmail('');
      setMessage(
        'Superadmin added.'
      );
    } catch (error) {
      setMessage(
        error.message
      );
    }
  }

  async function handleRemove(id) {
    if (!isSuperSuperAdmin) {
      return;
    }

    try {
      const admin =
        await removeSuperadmin(
          id
        );

      setAdmins((current) =>
        current.map((item) =>
          item.id === admin.id
            ? admin
            : item
        )
      );

      setMessage(
        'Superadmin deactivated.'
      );
    } catch (error) {
      setMessage(
        error.message
      );
    }
  }

  return (
    <div className="modal-backdrop solid-modal-backdrop">
      <div className="admin-modal">
        <div className="modal-top">
          <button
            className="back-btn"
            onClick={onClose}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <span className="save-state">
            Superadmin management
          </span>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <div className="admin-content">
          <div className="recent-label">
            SUPERADMINS
          </div>

          {isSuperSuperAdmin && (
            <form
              className="admin-form"
              onSubmit={handleAdd}
            >
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Enter Gmail address"
                autoComplete="off"
                required
              />

              <button
                className="primary-action"
                type="submit"
              >
                Add
              </button>
            </form>
          )}

          {message && (
            <div className="admin-message">
              {message}
            </div>
          )}

          {loading ? (
            <div className="state">
              Loading...
            </div>
          ) : (
            <div className="admin-list">
              {admins.map(
                (admin) => (
                  <div
                    className="admin-item"
                    key={admin.id}
                  >
                    <span>
                      {admin.email}
                    </span>

                    <span className="admin-status">
                      {admin.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </span>

                    {isSuperSuperAdmin &&
                      admin.is_active &&
                      admin.email?.toLowerCase() !==
                        currentUser?.email?.toLowerCase() && (
                        <button
                          className="admin-remove"
                          onClick={() =>
                            handleRemove(
                              admin.id
                            )
                          }
                        >
                          Remove
                        </button>
                      )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}