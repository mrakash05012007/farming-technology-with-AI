import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactNode;
  gradient?: string;
  animClass?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  gradient = 'from-emerald-500 to-teal-600',
  animClass = 'anim-1',
}) => (
  <div className={`glass-card kpi-card ${animClass}`}>
    {/* Icon */}
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, var(--icon-a), var(--icon-b))`,
      }}
        className={`bg-gradient-to-br ${gradient}`}
      >
        <span style={{ color: 'white', display: 'flex' }}>{icon}</span>
      </div>
    </div>

    {/* Value */}
    <p style={{
      fontSize: '26px',
      fontWeight: 800,
      fontFamily: "'Outfit', sans-serif",
      letterSpacing: '-0.03em',
      color: 'var(--text-primary)',
      lineHeight: 1.1,
      marginBottom: '4px',
    }}>{value}</p>

    {/* Title */}
    <p style={{
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--text-muted)',
      marginBottom: subtitle ? '4px' : '0',
    }}>{title}</p>

    {/* Subtitle */}
    {subtitle && (
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{subtitle}</p>
    )}
  </div>
);
