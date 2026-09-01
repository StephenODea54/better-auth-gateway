import { Switch } from "@/components/ui/switch.tsx";

interface RoleSwitchListProps {
  held: Set<string>;
  onToggle: (role: string) => void;
  roles: string[];
}

export function RoleSwitchList({ held, onToggle, roles }: RoleSwitchListProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      {roles.map(role => (
        <div
          className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
          key={role}
        >
          <span className="truncate text-sm font-medium">{role}</span>
          <Switch
            aria-label={role}
            checked={held.has(role)}
            onCheckedChange={() => onToggle(role)}
          />
        </div>
      ))}
    </div>
  );
}
