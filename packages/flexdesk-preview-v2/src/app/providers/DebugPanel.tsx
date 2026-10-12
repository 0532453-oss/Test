/**
 * Debug Panel
 *
 * Dev-only floating panel showing sync status, API calls, and errors.
 * Toggled via a small button fixed to the bottom-right corner.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSyncStatus } from '@flexdesk/core/hooks/useSyncStatus'
import { apiDebugStore, type ApiDebugEntry } from '@flexdesk/core/api/apiDebugStore'
import type { SyncEvent } from '@flexdesk/core/api/syncManager'

type Tab = 'sync' | 'api' | 'errors'

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('sync')
  const [apiEntries, setApiEntries] = useState<ApiDebugEntry[]>([])

  const syncStatus = useSyncStatus()

  useEffect(() => {
    setApiEntries(apiDebugStore.getEntries())
    const unsub = apiDebugStore.subscribe(() => {
      setApiEntries(apiDebugStore.getEntries())
    })
    return unsub
  }, [])

  const errorCount = apiEntries.filter((e) => e.status >= 400 || e.error).length
  const totalIssues = syncStatus.failed + errorCount

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 9999,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: totalIssues > 0 ? '#ef4444' : syncStatus.isOnline ? '#10b981' : '#f59e0b',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Debug Panel"
      >
        {totalIssues > 0 ? totalIssues : syncStatus.isOnline ? 'OK' : '!!'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '64px',
            right: '16px',
            zIndex: 9998,
            width: '420px',
            maxHeight: '500px',
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            fontSize: '13px',
            fontFamily: 'monospace',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid #374151', padding: '0' }}>
            {(['sync', 'api', 'errors'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: 'none',
                  background: activeTab === tab ? '#374151' : 'transparent',
                  color: activeTab === tab ? '#f9fafb' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  textTransform: 'uppercase',
                }}
              >
                {tab}
                {tab === 'errors' && errorCount > 0 && (
                  <span style={{ marginLeft: '4px', background: '#ef4444', borderRadius: '8px', padding: '1px 5px', fontSize: '10px' }}>
                    {errorCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ overflow: 'auto', flex: 1, maxHeight: '440px', padding: '8px' }}>
            {activeTab === 'sync' && <SyncTab syncStatus={syncStatus} />}
            {activeTab === 'api' && <ApiTab entries={apiEntries} />}
            {activeTab === 'errors' && <ErrorsTab entries={apiEntries} />}
          </div>
        </div>
      )}
    </>
  )
}

function SyncTab({ syncStatus }: { syncStatus: ReturnType<typeof useSyncStatus> }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
        <StatusBox label="Online" value={syncStatus.isOnline ? 'Yes' : 'No'} color={syncStatus.isOnline ? '#10b981' : '#ef4444'} />
        <StatusBox label="Pending" value={String(syncStatus.pending)} color={syncStatus.pending > 0 ? '#f59e0b' : '#6b7280'} />
        <StatusBox label="Syncing" value={String(syncStatus.syncing)} color={syncStatus.syncing > 0 ? '#3b82f6' : '#6b7280'} />
        <StatusBox label="Failed" value={String(syncStatus.failed)} color={syncStatus.failed > 0 ? '#ef4444' : '#6b7280'} />
      </div>

      {syncStatus.lastSyncAt && (
        <div style={{ marginBottom: '8px', color: '#9ca3af', fontSize: '11px' }}>
          Last sync: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
        </div>
      )}

      {syncStatus.lastError && (
        <div style={{ marginBottom: '8px', color: '#fca5a5', fontSize: '11px' }}>
          Last error: {syncStatus.lastError}
        </div>
      )}

      {syncStatus.recentEvents.length > 0 && (
        <div>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Recent Events</div>
          {syncStatus.recentEvents.slice().reverse().slice(0, 15).map((event, i) => (
            <EventRow key={i} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

function ApiTab({ entries }: { entries: ApiDebugEntry[] }) {
  if (entries.length === 0) {
    return <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No API calls yet</div>
  }

  return (
    <div>
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: '6px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: methodColor(entry.method), fontWeight: 'bold', fontSize: '11px', width: '40px' }}>
            {entry.method}
          </span>
          <span style={{ color: statusColor(entry.status), fontSize: '11px', width: '28px' }}>
            {entry.status || 'ERR'}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#d1d5db', fontSize: '11px' }}>
            {entry.url.replace(/https?:\/\/[^/]+/, '')}
          </span>
          <span style={{ color: '#6b7280', fontSize: '10px', whiteSpace: 'nowrap' }}>
            {entry.durationMs}ms
            {entry.fromCache && ' (cache)'}
          </span>
        </div>
      ))}
    </div>
  )
}

function ErrorsTab({ entries }: { entries: ApiDebugEntry[] }) {
  const errors = entries.filter((e) => e.status >= 400 || e.error)

  if (errors.length === 0) {
    return <div style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No errors</div>
  }

  return (
    <div>
      {errors.map((entry) => (
        <div key={entry.id} style={{ padding: '6px', borderBottom: '1px solid #374151' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '11px' }}>
              {entry.status || 'NET'}
            </span>
            <span style={{ color: methodColor(entry.method), fontSize: '11px' }}>{entry.method}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#d1d5db', fontSize: '11px' }}>
              {entry.url.replace(/https?:\/\/[^/]+/, '')}
            </span>
          </div>
          {entry.error && (
            <div style={{ color: '#fca5a5', fontSize: '10px', marginTop: '2px' }}>{entry.error}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function StatusBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: '#111827', borderRadius: '4px', padding: '6px 8px', textAlign: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontSize: '16px', fontWeight: 'bold' }}>{value}</div>
    </div>
  )
}

function EventRow({ event }: { event: SyncEvent }) {
  const typeColors: Record<string, string> = {
    queued: '#3b82f6',
    syncing: '#f59e0b',
    completed: '#10b981',
    failed: '#ef4444',
    retry: '#f97316',
    online: '#10b981',
    offline: '#ef4444',
    batch_start: '#8b5cf6',
    batch_end: '#8b5cf6',
  }

  return (
    <div style={{ display: 'flex', gap: '6px', padding: '2px 0', fontSize: '11px', color: '#d1d5db' }}>
      <span style={{ color: '#6b7280', width: '55px', flexShrink: 0 }}>
        {new Date(event.timestamp).toLocaleTimeString()}
      </span>
      <span style={{ color: typeColors[event.type] || '#9ca3af', width: '65px', flexShrink: 0, fontWeight: 'bold' }}>
        {event.type}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.entityType || event.error || (event.batchSize ? `batch(${event.batchSize})` : '')}
        {event.durationMs ? ` ${event.durationMs}ms` : ''}
      </span>
    </div>
  )
}

function methodColor(method: string): string {
  switch (method) {
    case 'GET': return '#10b981'
    case 'POST': return '#3b82f6'
    case 'PUT':
    case 'PATCH': return '#f59e0b'
    case 'DELETE': return '#ef4444'
    default: return '#9ca3af'
  }
}

function statusColor(status: number): string {
  if (status === 0) return '#ef4444'
  if (status < 300) return '#10b981'
  if (status < 400) return '#f59e0b'
  return '#ef4444'
}
