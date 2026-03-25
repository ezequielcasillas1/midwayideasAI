'use client'

import { useState, useEffect, useCallback } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { AdminLayout } from '@/features/admin'
import { Card, Badge } from '@/components/ui'
import { ShieldCheck, ShieldAlert, AlertTriangle, Filter, RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { ADMIN_ENABLED } from '@/lib/admin-config'
import { getModerationLogs, reviewModerationLog, type ModerationLog } from '@/features/admin/services/admin-service'

export default function ModerationPage() {
  if (!ADMIN_ENABLED) {
    notFound()
  }

  const [logs, setLogs] = useState<ModerationLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<{
    contentType?: string
    approved?: boolean
    severity?: string
  }>({})

  const LIMIT = 20

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const result = await getModerationLogs(filters, LIMIT, page * LIMIT)
    setLogs(result.logs)
    setTotal(result.total)
    setLoading(false)
  }, [filters, page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleReview = async (logId: string, approved: boolean) => {
    const success = await reviewModerationLog(logId, approved)
    if (success) {
      fetchLogs()
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        <AdminLayout>
          <div className="space-y-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl bg-violet-500/10 p-3">
                  <ShieldCheck className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Moderation Logs</h1>
                  <p className="text-sm text-zinc-400">Review content moderation results</p>
                </div>
              </div>
              <button
                onClick={fetchLogs}
                className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>

            <Card hover={false} className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm text-zinc-400">Filters:</span>
                </div>
                
                <select
                  value={filters.contentType || ''}
                  onChange={(e) => setFilters({ ...filters, contentType: e.target.value || undefined })}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Types</option>
                  <option value="listing">Listing</option>
                  <option value="comment">Comment</option>
                  <option value="message">Message</option>
                </select>

                <select
                  value={filters.approved === undefined ? '' : filters.approved.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    approved: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Status</option>
                  <option value="true">Approved</option>
                  <option value="false">Flagged</option>
                </select>

                <select
                  value={filters.severity || ''}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined })}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
                >
                  <option value="">All Severity</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {Object.keys(filters).some(k => filters[k as keyof typeof filters] !== undefined) && (
                  <button
                    onClick={() => setFilters({})}
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </Card>

            <Card hover={false} className="overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-zinc-400">
                  No moderation logs found
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-zinc-800/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant={log.approved ? 'secondary' : 'destructive'}>
                              {log.approved ? 'Approved' : 'Flagged'}
                            </Badge>
                            <Badge variant="outline">{log.content_type}</Badge>
                            {log.severity && (
                              <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                                log.severity === 'high'
                                  ? 'bg-red-500/20 text-red-400'
                                  : log.severity === 'medium'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-zinc-700 text-zinc-400'
                              }`}>
                                {log.severity === 'high' && <AlertTriangle className="h-3 w-3" />}
                                {log.severity === 'medium' && <ShieldAlert className="h-3 w-3" />}
                                {log.severity}
                              </span>
                            )}
                          </div>

                          <div className="mb-2 text-sm">
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400">
                              {log.tisane_flagged && (
                                <span className="text-violet-400">Tisane flagged</span>
                              )}
                              {log.openai_flagged && (
                                <span className="text-blue-400">OpenAI flagged</span>
                              )}
                              {log.custom_flagged && (
                                <span className="text-amber-400">Custom rules flagged</span>
                              )}
                            </div>
                          </div>

                          {log.custom_reasons && log.custom_reasons.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-zinc-500">Reasons:</p>
                              <p className="text-sm text-zinc-300">
                                {log.custom_reasons.join(', ')}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span>
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                            {log.user && (
                              <span>
                                User: {log.user.display_name || log.user.email}
                              </span>
                            )}
                            {log.reviewed_at && (
                              <span className="text-green-400">
                                Reviewed {new Date(log.reviewed_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(log.id, true)}
                            className="rounded-lg border border-green-700 bg-green-900/30 p-2 text-green-400 transition-colors hover:bg-green-900/50"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReview(log.id, false)}
                            className="rounded-lg border border-red-700 bg-red-900/30 p-2 text-red-400 transition-colors hover:bg-red-900/50"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                  <p className="text-sm text-zinc-400">
                    Showing {page * LIMIT + 1} - {Math.min((page + 1) * LIMIT, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </AdminLayout>
      </main>
    </div>
  )
}
