import type { ProviderHealth, ProviderTarget } from "../types/chat";

type ProviderStatusProps = {
  active: ProviderTarget;
  providers: ProviderHealth[];
  onSwitch: (target: ProviderTarget) => void;
};

export function ProviderStatus({ active, providers, onSwitch }: ProviderStatusProps) {
  const targets: ProviderTarget[] = ["MOCK", "PREPROD", "PROD"];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {targets.map((target) => {
        const health = providers.find((provider) => provider.target === target);
        const status = health?.status ?? "Unavailable";
        const isActive = active === target;

        return (
          <button
            key={target}
            type="button"
            onClick={() => onSwitch(target)}
            title={`${target} ${status}`}
            className={`inline-flex h-8 items-center gap-2 rounded-md border px-2 font-medium ${
              isActive
                ? "border-zinc-950 bg-zinc-950 text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <span className={status === "Unavailable" ? "text-zinc-400" : status === "Slow" ? "text-amber-500" : "text-emerald-500"}>
              {status === "Unavailable" ? "○" : "●"}
            </span>
            {target}
          </button>
        );
      })}
    </div>
  );
}
