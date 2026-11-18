import { Check, XCircle } from 'lucide-react';
import { SERVICE_PIPELINE, type ServiceStatus } from '../types';

export function ServiceProgressTracker({ status }: { status: ServiceStatus }) {
  if (status === 'Rejected') {
    return (
      <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-800">
        <XCircle className="w-4 h-4 shrink-0 text-red-600" />
        <span>
          This service appointment was declined by the workshop. Please contact the service desk or book a new slot.
        </span>
      </div>
    );
  }

  const currentIdx = SERVICE_PIPELINE.indexOf(status);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {SERVICE_PIPELINE.map((step, index) => {
          const isCompleted = index < currentIdx;
          const isCurrent = index === currentIdx;
          return (
            <div
              key={step}
              className={`flex flex-col justify-between p-3 rounded-lg border transition-colors ${
                isCurrent
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : isCompleted
                  ? 'border-zinc-300 bg-zinc-100 text-zinc-900'
                  : 'border-zinc-200 bg-white text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs tabular-nums">
                  0{index + 1}
                </span>
                {isCompleted ? (
                  <span className="w-4 h-4 rounded-sm bg-zinc-900 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                ) : isCurrent ? (
                  <span className="text-[11px] font-medium text-zinc-300">
                    Active
                  </span>
                ) : null}
              </div>
              <p
                className={`text-xs font-medium leading-snug ${
                  isCurrent
                    ? 'text-white'
                    : isCompleted
                    ? 'text-zinc-900'
                    : 'text-zinc-400'
                }`}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
