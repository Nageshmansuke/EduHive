import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

const easeOut = [0.23, 1, 0.32, 1];

export const LoadingState = ({ label = 'Loading…', className = '', compact = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8' : 'py-16'} ${className}`}
      data-testid="page-loading-state"
      role="status"
      aria-live="polite"
    >
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-r-transparent border-b-transparent [animation-duration:0.7s]" />
      </div>
      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mt-3 text-sm font-medium text-muted-foreground font-body"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action, className = '', testId }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: easeOut }}
      className={`eh-panel p-10 sm:p-14 text-center ${className}`}
      data-testid={testId}
    >
      {Icon && (
        <div className="eh-icon-well mx-auto mb-4 h-12 w-12">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      {title && <p className="text-base font-semibold text-foreground font-heading">{title}</p>}
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto font-body leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  description,
  action,
  className = '',
  testId
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: easeOut }}
      className={`eh-panel border-destructive/25 p-10 sm:p-12 text-center ${className}`}
      data-testid={testId}
      role="alert"
    >
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
        <AlertCircle size={20} strokeWidth={2} />
      </div>
      <p className="text-base font-semibold text-foreground font-heading">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto font-body">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export const InlineSpinner = ({ size = 16, className = '' }) => (
  <Loader2 size={size} className={`animate-spin [animation-duration:0.7s] ${className}`} />
);

export default LoadingState;
