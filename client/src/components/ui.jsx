export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const Button = ({ as: Component = 'button', children, className = '', variant = 'primary', size = 'md', ...props }) => (
  <Component className={cn('btn', `btn-${variant}`, `btn-${size}`, className)} {...props}>
    {children}
  </Component>
);

export const Card = ({ children, className = '', ...props }) => (
  <section className={cn('card', className)} {...props}>
    {children}
  </section>
);

export const CardHeader = ({ title, action, icon }) => (
  <div className="card-header">
    <div className="card-title-wrap">
      {icon}
      <h2 className="card-title">{title}</h2>
    </div>
    {action}
  </div>
);

export const CardContent = ({ children, className = '' }) => <div className={cn('card-content', className)}>{children}</div>;

export const Alert = ({ children, variant = 'info', className = '' }) => (
  <div className={cn('alert', `alert-${variant}`, className)}>{children}</div>
);

export const Field = ({ label, error, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {error && <small className="field-error">{error}</small>}
  </label>
);

export const Input = ({ className = '', ...props }) => <input className={cn('input', className)} {...props} />;

export const Textarea = ({ className = '', ...props }) => <textarea className={cn('input textarea', className)} {...props} />;

export const Select = ({ className = '', children, ...props }) => (
  <select className={cn('input select', className)} {...props}>
    {children}
  </select>
);

export const Badge = ({ children, className = '', tone = 'default' }) => (
  <span className={cn('badge', `badge-${tone}`, className)}>{children}</span>
);

export const Dialog = ({ children, open, title, onClose }) => {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <h2 id="dialog-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const Spinner = () => <span className="spinner" aria-label="Loading" />;
