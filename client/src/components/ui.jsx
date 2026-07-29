import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Button = ({ className, variant = 'default', size = 'default', type = 'button', ...props }) => {
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  };
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-5'
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
};

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm', className)} {...props} />
);

export const CardHeader = ({ className, ...props }) => <div className={cn('p-5 pb-2', className)} {...props} />;
export const CardTitle = ({ className, ...props }) => <h2 className={cn('text-lg font-semibold', className)} {...props} />;
export const CardContent = ({ className, ...props }) => <div className={cn('p-5', className)} {...props} />;

export const Input = ({ className, ...props }) => (
  <input
    className={cn(
      'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export const Textarea = ({ className, ...props }) => (
  <textarea
    className={cn(
      'flex min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
);

export const Label = ({ className, ...props }) => (
  <label className={cn('text-sm font-medium text-slate-700', className)} {...props} />
);

export const Field = ({ label, children, className }) => (
  <label className={cn('grid gap-1.5', className)}>
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

export const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default: 'border-transparent bg-slate-900 text-white',
    secondary: 'border-transparent bg-slate-100 text-slate-700',
    outline: 'border-slate-300 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700'
  };

  return (
    <span
      className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', variants[variant], className)}
      {...props}
    />
  );
};

export const Alert = ({ className, variant = 'info', ...props }) => {
  const variants = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800'
  };

  return <div className={cn('rounded-md border px-4 py-3 text-sm', variants[variant], className)} {...props} />;
};

export const Dialog = ({ open, title, children, footer, onClose, className }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className={cn('w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl', className)}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
};
