'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Clock, MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { CofounderStatus } from '@/features/cofounder'
import { updateCofounderRequestStatus } from '../services/admin-service'
import type { CofounderRequest, User as UserType, CofounderRequestStatus as StatusType } from '@/types'

interface CofounderRequestsListProps {
  requests: (CofounderRequest & { user: UserType })[]
  onUpdate: () => void
}

export function CofounderRequestsList({ requests, onUpdate }: CofounderRequestsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusUpdate = async (requestId: string, status: StatusType) => {
    setUpdatingId(requestId)
    const success = await updateCofounderRequestStatus(requestId, status)
    if (success) {
      onUpdate()
    }
    setUpdatingId(null)
  }

  if (requests.length === 0) {
    return (
      <Card hover={false} className="p-8">
        <div className="text-center text-zinc-500">
          No co-founder requests yet
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request, index) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card hover={false} className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {request.user?.avatar_url ? (
                  <img
                    src={request.user.avatar_url}
                    alt={request.user.display_name || 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-white">
                    {request.user?.display_name || request.user?.email?.split('@')[0] || 'Unknown'}
                  </p>
                  <p className="text-sm text-zinc-500">{request.user?.email}</p>
                </div>
              </div>
              <CofounderStatus status={request.status} size="sm" />
            </div>

            {request.message && (
              <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <p className="mb-1 text-xs font-medium text-zinc-400">Message</p>
                <p className="text-sm text-zinc-300">{request.message}</p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
              <p className="text-xs text-zinc-500">
                Submitted {new Date(request.created_at).toLocaleDateString()}
              </p>
              
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    disabled={updatingId === request.id}
                  >
                    {updatingId === request.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusUpdate(request.id, 'in_discussion')}
                    disabled={updatingId === request.id}
                  >
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Discuss
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                    disabled={updatingId === request.id}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}

              {request.status === 'in_discussion' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    disabled={updatingId === request.id}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                    disabled={updatingId === request.id}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
