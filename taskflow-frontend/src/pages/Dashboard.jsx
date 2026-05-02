import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import './Dashboard.css'

const FILTERS = [
  { key: 'ALL', label: 'Todas' },
  { key: 'TODO', label: 'A Fazer' },
  { key: 'IN_PROGRESS', label: 'Em Progresso' },
  { key: 'DONE', label: 'Concluídas' },
]

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }
const STATUS_ORDER = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [sortBy, setSortBy] = useState('status')

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks')
      setTasks(data)
      setError('')
    } catch {
      setError('Erro ao carregar tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  async function handleDelete(id) {
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(ts => ts.filter(t => t.id !== id))
    } catch {
      alert('Erro ao excluir tarefa.')
    }
  }

  async function handleStatusChange(id, status) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    try {
      const { data } = await api.put(`/tasks/${id}`, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        status,
      })
      setTasks(ts => ts.map(t => t.id === id ? data : t))
    } catch {
      alert('Erro ao atualizar status.')
    }
  }

  function openCreate() {
    setEditingTask(null)
    setModalOpen(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleSaved(task) {
    setTasks(ts => {
      const exists = ts.find(t => t.id === task.id)
      return exists ? ts.map(t => t.id === task.id ? task : t) : [task, ...ts]
    })
    setModalOpen(false)
    setEditingTask(null)
  }

  const filtered = tasks
    .filter(t => filter === 'ALL' || t.status === filter)
    .sort((a, b) => {
      if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (sortBy === 'status') return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  }

  const donePercent = tasks.length ? Math.round((counts.DONE / tasks.length) * 100) : 0

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-icon">✦</span>
            <span className="brand-name">TaskFlow</span>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>

          <button className="btn-new-task" onClick={openCreate}>
            <span>+</span> Nova Tarefa
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-label">Filtros</p>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`nav-item ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              <span className="nav-item-label">{f.label}</span>
              <span className={`nav-count ${f.key !== 'ALL' ? `count-${f.key.toLowerCase()}` : ''}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-progress">
          <div className="progress-header">
            <span>Progresso geral</span>
            <span className="progress-percent">{donePercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${donePercent}%` }} />
          </div>
          <p className="progress-sub">{counts.DONE} de {tasks.length} tarefas concluídas</p>
        </div>

        <button className="btn-logout" onClick={logout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </button>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="main-header">
          <div>
            <h2 className="main-title">
              {FILTERS.find(f => f.key === filter)?.label}
              <span className="title-count">{filtered.length}</span>
            </h2>
          </div>
          <div className="header-controls">
            <label className="sort-label">Ordenar por</label>
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="status">Status</option>
              <option value="priority">Prioridade</option>
              <option value="dueDate">Prazo</option>
              <option value="createdAt">Criação</option>
            </select>
          </div>
        </header>

        {error && <div className="alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Carregando tarefas…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">◎</span>
            <p className="empty-title">Nenhuma tarefa aqui</p>
            <p className="empty-sub">
              {filter === 'ALL'
                ? 'Crie sua primeira tarefa para começar'
                : 'Nenhuma tarefa com este status'}
            </p>
            {filter === 'ALL' && (
              <button className="btn-primary-sm" onClick={openCreate}>
                + Criar tarefa
              </button>
            )}
          </div>
        ) : (
          <div className="task-grid">
            {filtered.map((task, i) => (
              <div key={task.id} style={{ animationDelay: `${i * 30}ms` }} className="task-item-anim">
                <TaskCard
                  task={task}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onEdit={openEdit}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => { setModalOpen(false); setEditingTask(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
