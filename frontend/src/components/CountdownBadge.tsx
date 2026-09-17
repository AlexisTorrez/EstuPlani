import React from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface Props {
  daysRemaining: number;
  isOverdue: boolean;
}

export const CountdownBadge: React.FC<Props> = ({ daysRemaining, isOverdue }) => {
  if (isOverdue || daysRemaining < 0) {
    return (
      <span className="countdown-badge overdue">
        <AlertCircle size={13} />
        Vencido
      </span>
    );
  }

  if (daysRemaining === 0) {
    return (
      <span className="countdown-badge today">
        <Clock size={13} />
        ¡Es hoy!
      </span>
    );
  }

  if (daysRemaining === 1) {
    return (
      <span className="countdown-badge soon">
        <Clock size={13} />
        Falta 1 día
      </span>
    );
  }

  if (daysRemaining <= 7) {
    return (
      <span className="countdown-badge soon">
        <Clock size={13} />
        Faltan {daysRemaining} días
      </span>
    );
  }

  return (
    <span className="countdown-badge normal">
      <CheckCircle size={13} />
      Faltan {daysRemaining} días
    </span>
  );
};
