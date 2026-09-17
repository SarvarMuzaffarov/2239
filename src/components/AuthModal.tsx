import React, { useEffect } from 'react';
import { AuthView } from './AuthView';
import type { SupervisorProfile, UserAccount } from '../types';

interface Props {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  supervisors: SupervisorProfile[];
  onClose: () => void;
  onAuthSuccess: (user: UserAccount) => void;
  onNotify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'login',
  supervisors,
  onClose,
  onAuthSuccess,
  onNotify,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg my-8">
        <AuthView
          supervisors={supervisors}
          onAuthSuccess={user => {
            onClose();
            onAuthSuccess(user);
          }}
          onNotify={onNotify}
          initialTab={initialTab}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
