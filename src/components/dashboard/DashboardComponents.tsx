'use client'

import { Bell, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================
// KPI CARD
// ============================================================

interface KpiCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  status?: 'above' | 'normal' | 'below' | 'default'
  isLoading?: boolean
}

export function KpiCard({ label, value, unit, status = 'default', isLoading }: KpiCardProps) {
  const statusColor = {
    above: 'text-success',
    normal: 'text-on-surface',
    below: 'text-critical',
    default: 'text-on-surface',
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 card-shadow border border-outline-variant/30">
      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="h-8 w-24 mt-1" />
      ) : (
        <div className={`tabular-nums ${statusColor[status]}`}>
          <span className="text-2xl font-extrabold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
          </span>
          {unit && <span className="text-sm font-semibold text-on-surface-variant ml-1">{unit}</span>}
        </div>
      )}
    </div>
  )
}

// ============================================================
// STATUS BADGE
// ============================================================

interface ProductionBadgeProps {
  status: 'ABOVE' | 'NORMAL' | 'BELOW'
}

export function ProductionBadge({ status }: ProductionBadgeProps) {
  const config = {
    ABOVE: { label: 'Above Standard', className: 'bg-primary/10 text-primary border-primary/20' },
    NORMAL: { label: 'Normal', className: 'bg-secondary/10 text-secondary border-secondary/20' },
    BELOW: { label: 'Below Standard', className: 'bg-error-container text-on-error-container border-error/20' },
  }
  const { label, className } = config[status]
  return (
    <Badge variant="outline" className={`font-semibold rounded-full ${className}`}>
      {label}
    </Badge>
  )
}

// ============================================================
// ALERT CARD
// ============================================================

interface AlertCardProps {
  type: 'warning' | 'critical' | 'info' | 'success'
  message: string
}

export function AlertCard({ type, message }: AlertCardProps) {
  const config = {
    warning: { bg: 'bg-amber-50 border-amber-200', text: 'text-orange-700', icon: '⚠' },
    critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: '⚠' },
    info: { bg: 'bg-primary/5 border-primary/20', text: 'text-primary', icon: 'ℹ' },
    success: { bg: 'bg-primary/5 border-primary/20', text: 'text-primary', icon: '✓' },
  }
  const { bg, text, icon } = config[type]
  return (
    <div className={`flex gap-2 p-3 rounded-xl border ${bg}`}>
      <span className={`text-sm font-bold ${text}`}>{icon}</span>
      <p className={`text-sm font-medium ${text}`}>{message}</p>
    </div>
  )
}

// ============================================================
// TOP BAR
// ============================================================

interface TopBarProps {
  title: string
  subtitle?: string
  showSettings?: boolean
  alertCount?: number
}

export function TopBar({ title, subtitle, showSettings = false, alertCount = 0 }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-6 pb-3">
      <div>
        <h1 className="text-xl font-extrabold text-on-surface tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-on-surface-variant font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
          <Bell size={20} className="text-on-surface-variant" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-critical rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {alertCount}
            </span>
          )}
        </button>
        {showSettings && (
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors">
            <Settings size={20} className="text-on-surface-variant" />
          </button>
        )}
      </div>
    </div>
  )
}
