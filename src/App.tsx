import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

interface Task {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

type Priority = 'low' | 'medium' | 'high'

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: 'var(--success-600)', bg: 'var(--success-50)' },
  medium: { label: 'Medium', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
  high: { label: 'High', color: 'var(--error-600)', bg: 'var(--error-50)' },
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [submitting, setSubmitting] = useState(false)

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async () => {
    if (!newTitle.trim()) return
    setSubmitting(true)

    const { error } = await supabase.from('tasks').insert({
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      completed: false,
    })

    if (error) {
      console.error('Error adding task:', error)
    } else {
      setNewTitle('')
      setNewDescription('')
      setNewPriority('medium')
      await fetchTasks()
    }
    setSubmitting(false)
  }

  const toggleTask = async (task: Task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)

    if (error) {
      console.error('Error toggling task:', error)
    } else {
      await fetchTasks()
    }
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
    } else {
      await fetchTasks()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addTask()
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed
    if (filter === 'completed') return task.completed
    return true
  })

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">TaskFlow</h1>
          <p className="app-subtitle">Stay organized, get things done</p>
        </div>
      </header>

      <main className="app-main">
        <div className="card add-task-card">
          <div className="add-task-row">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-title"
            />
            <button
              onClick={addTask}
              disabled={!newTitle.trim() || submitting}
              className="btn-add"
            >
              {submitting ? '...' : 'Add'}
            </button>
          </div>
          <div className="add-task-details">
            <input
              type="text"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-description"
            />
            <div className="priority-selector">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`priority-btn ${newPriority === p ? 'active' : ''}`}
                  style={{
                    '--pri-color': PRIORITY_CONFIG[p].color,
                    '--pri-bg': PRIORITY_CONFIG[p].bg,
                  } as React.CSSProperties}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="stats-bar">
          <div className="filter-tabs">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {totalCount > 0 && (
            <span className="stats-text">
              {completedCount}/{totalCount} completed
            </span>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === 'completed' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </div>
            <p className="empty-title">
              {filter === 'completed'
                ? 'No completed tasks yet'
                : filter === 'active'
                  ? 'All tasks completed!'
                  : 'No tasks yet'}
            </p>
            <p className="empty-subtitle">
              {filter === 'all' ? 'Add your first task above to get started' : ''}
            </p>
          </div>
        ) : (
          <ul className="task-list">
            {filteredTasks.map((task) => {
              const pri = PRIORITY_CONFIG[task.priority]
              return (
                <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <button
                    onClick={() => toggleTask(task)}
                    className={`checkbox ${task.completed ? 'checked' : ''}`}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    )}
                  </button>
                  <div className="task-content">
                    <span className="task-title">{task.title}</span>
                    {task.description && (
                      <span className="task-description">{task.description}</span>
                    )}
                  </div>
                  <span
                    className="priority-badge"
                    style={{ color: pri.color, backgroundColor: pri.bg }}
                  >
                    {pri.label}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="btn-delete"
                    aria-label="Delete task"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}

export default App
