import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner
export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = '' }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

// Empty state
export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }> = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center text-white/30">
      {icon}
    </div>
    <div>
      <p className="font-display font-semibold text-lg text-white/70 mb-1">{title}</p>
      <p className="text-sm text-white/30">{desc}</p>
    </div>
    {action}
  </div>
);

// Status badge
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    live: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    draft: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    published: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  };
  return (
    <span className={`badge ${styles[status] || 'bg-white/10 text-white/50'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
      {status || 'draft'}
    </span>
  );
};

// Page header
export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="font-display font-semibold text-2xl text-white mb-1">{title}</h1>
      {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// Step indicator
export const StepIndicator: React.FC<{ steps: string[]; current: number }> = ({ steps, current }) => (
  <div className="flex items-center gap-0 mb-8">
    {steps.map((step, i) => (
      <React.Fragment key={step}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
            i < current ? 'bg-brand-600 border-brand-600 text-white' :
            i === current ? 'bg-brand-600/20 border-brand-500 text-brand-400' :
            'bg-surface-3 border-white/10 text-white/30'
          }`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-sm font-medium ${i === current ? 'text-white' : i < current ? 'text-white/60' : 'text-white/25'}`}>{step}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`flex-1 h-px mx-3 min-w-8 ${i < current ? 'bg-brand-600' : 'bg-white/10'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

// Form field wrapper
export const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="label">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);
