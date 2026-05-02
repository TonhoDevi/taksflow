import './TaskCard.css'

const PRIORITY_LABEL = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' }
const STATUS_LABEL = { TODO: 'A Fazer', IN_PROGRESS: 'Em Progresso', DONE: 'Concluída' }

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString())
}

export default function TaskCard({ task, onDelete, onStatusChange, onEdit }) {
  const overdue = task.status !== 'DONE' && isOverdue(task.dueDate)

  return (
    <div className={`task-card status-${task.status.toLowerCase()}`}>
      <div className="card-top">
        <div className="card-badges">
          <span className={`badge priority-${task.priority?.toLowerCase()}`}>
            {PRIORITY_LABEL[task.priority] || task.priority}
          </span>
          <span className={`badge status-badge status-${task.status?.toLowerCase()}`}>
            {STATUS_LABEL[task.status] || task.status}
          </span>
        </div>
        <div className="card-actions">
          <button className="icon-btn edit-btn" onClick={() => onEdit(task)} title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button className="icon-btn delete-btn" onClick={() => onDelete(task.id)} title="Excluir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      <h3 className="card-title">{task.title}</h3>
      {task.description && <p className="card-description">{task.description}</p>}

      <div className="card-footer">
        {task.dueDate && (
          <span className={`due-date ${overdue ? 'overdue' : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {overdue ? 'Atrasada · ' : ''}{formatDate(task.dueDate)}
          </span>
        )}

        <select
          className="status-select"
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value)}
          onClick={e => e.stopPropagation()}
        >
          <option value="TODO">A Fazer</option>
          <option value="IN_PROGRESS">Em Progresso</option>
          <option value="DONE">Concluída</option>
        </select>
      </div>
    </div>
  )
}
