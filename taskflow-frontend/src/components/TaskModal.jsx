import { useState, useEffect } from 'react'
import api from '../api/axios'
import './TaskModal.css'

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
}

export default function TaskModal({ task, onClose, onSaved }) {
  const isEdit = !!task
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate || '',
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [task])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Título é obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
      }
      let data
      if (isEdit) {
        ({ data } = await api.put(`/tasks/${task.id}`, payload))
      } else {
        ({ data } = await api.post('/tasks', payload))
      }
      onSaved(data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao salvar tarefa. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="field-group">
            <label className="field-label">Título *</label>
            <input
              type="text"
              name="title"
              placeholder="Descreva a tarefa..."
              value={form.title}
              onChange={handleChange}
              autoFocus
              maxLength={120}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Descrição</label>
            <textarea
              name="description"
              placeholder="Detalhes adicionais (opcional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-row">
            <div className="field-group">
              <label className="field-label">Prioridade</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="LOW">🟢 Baixa</option>
                <option value="MEDIUM">🟡 Média</option>
                <option value="HIGH">🔴 Alta</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="TODO">A Fazer</option>
                <option value="IN_PROGRESS">Em Progresso</option>
                <option value="DONE">Concluída</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Prazo</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading
                ? <span className="spinner-sm" />
                : isEdit ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
