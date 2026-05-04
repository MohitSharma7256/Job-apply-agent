"use client";

import React, { useState, useEffect } from 'react';
import { useJobUpdates } from '../hooks/useSocket';
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2, RefreshCw, X } from 'lucide-react';

const statusConfig = {
  queued: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Queued'
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Processing'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Completed'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Failed'
  },
  cancelled: {
    icon: X,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Cancelled'
  }
};

export function JobProgressTracker({ jobId, onCancel, onRetry, className = '' }) {
  const [showDetails, setShowDetails] = useState(false);
  const jobUpdate = useJobUpdates(jobId);

  if (!jobUpdate) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-gray-500">Loading job status...</span>
        </div>
      </div>
    );
  }

  const status = jobUpdate.status || 'queued';
  const config = statusConfig[status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Main Status Display */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${config.bgColor}`}>
              <StatusIcon className={`w-5 h-5 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-sm text-gray-500">
                  {jobUpdate.type?.replace('_', ' ') || 'Processing'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {jobUpdate.message || 'Processing...'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {(status === 'failed' || status === 'cancelled') && onRetry && (
              <button
                onClick={() => onRetry(jobId)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Retry Job"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {(status === 'queued' || status === 'processing') && onCancel && (
              <button
                onClick={() => onCancel(jobId)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Cancel Job"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Toggle Details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {status === 'processing' && jobUpdate.progress && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>{jobUpdate.step || 'Processing'}</span>
              <span>{jobUpdate.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${jobUpdate.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {status === 'failed' && jobUpdate.error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <div className="font-medium">Error</div>
                <div>{jobUpdate.error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700">Job Details</div>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Job ID:</span>
                  <span className="font-mono text-gray-800">{jobId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-800">{jobUpdate.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-800">
                    {jobUpdate.timestamp ? new Date(jobUpdate.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Processing Metrics */}
            {jobUpdate.processingTimeMs && (
              <div>
                <div className="text-sm font-medium text-gray-700">Processing Metrics</div>
                <div className="mt-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="text-gray-800">
                      {(jobUpdate.processingTimeMs / 1000).toFixed(2)}s
                    </span>
                  </div>
                  {jobUpdate.tokensUsed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tokens Used:</span>
                      <span className="text-gray-800">{jobUpdate.tokensUsed.toLocaleString()}</span>
                    </div>
                  )}
                  {jobUpdate.costCents && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Cost:</span>
                      <span className="text-gray-800">${(jobUpdate.costCents / 100).toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job-specific data */}
            {jobUpdate.data && Object.keys(jobUpdate.data).length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700">Job Data</div>
                <div className="mt-1">
                  <pre className="text-xs bg-gray-100 p-2 rounded border overflow-auto max-h-32">
                    {JSON.stringify(jobUpdate.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Job Progress List Component
export function JobProgressList({ jobIds, className = '' }) {
  if (!jobIds || jobIds.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="mb-2">No active jobs</div>
        <div className="text-sm">Start a job search or application to see progress here</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {jobIds.map(jobId => (
        <JobProgressTracker key={jobId} jobId={jobId} />
      ))}
    </div>
  );
}

// Compact Job Progress Indicator
export function CompactJobProgress({ jobId, className = '' }) {
  const jobUpdate = useJobUpdates(jobId);

  if (!jobUpdate) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  const status = jobUpdate.status || 'queued';
  const config = statusConfig[status] || statusConfig.queued;
  const StatusIcon = config.icon;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <StatusIcon className={`w-4 h-4 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`} />
      <span className={`text-sm ${config.color}`}>
        {config.label}
      </span>
      {jobUpdate.progress && status === 'processing' && (
        <span className="text-xs text-gray-500">
          {jobUpdate.progress}%
        </span>
      )}
    </div>
  );
}
