import {
  CheckCircle2,
  Clock,
  Wrench,
  PackageCheck,
  XCircle,
  ArrowDownToLine,
  ShieldCheck,
} from 'lucide-react';
import type { ServiceStatus } from '../types';

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const config: Record<
    ServiceStatus,
    { classes: string; icon: typeof Clock }
  > = {
    Pending: {
      classes: 'bg-zinc-100 text-zinc-700 border-zinc-300',
      icon: Clock,
    },
    Confirmed: {
      classes: 'bg-zinc-900 text-white border-zinc-900',
      icon: ShieldCheck,
    },
    'Bike Received': {
      classes: 'bg-zinc-100 text-zinc-900 border-zinc-400',
      icon: ArrowDownToLine,
    },
    'Under Service': {
      classes: 'bg-amber-50 text-amber-800 border-amber-300',
      icon: Wrench,
    },
    'Service Completed': {
      classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
    },
    Delivered: {
      classes: 'bg-zinc-950 text-white border-zinc-950',
      icon: PackageCheck,
    },
    Rejected: {
      classes: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    },
  };

  const { classes, icon: Icon } = config[status] || config.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border whitespace-nowrap shrink-0 ${classes}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: 'Paid' | 'Unpaid' }) {
  if (status === 'Paid') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Paid</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-800 whitespace-nowrap shrink-0">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Unpaid</span>
    </span>
  );
}
