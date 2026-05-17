import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ResourceItem = { href: string; label: string };

const ITEMS: readonly ResourceItem[] = [
  { href: '/resources/license', label: 'License' },
  { href: '/resources/code-of-conduct', label: 'Code of conduct' },
  { href: '/resources/contributing', label: 'Contributing' },
  { href: '/resources/brand-owners', label: 'Brand owners' },
];

type ResourcesMenuProps = {
  active?: boolean;
};

const ResourcesMenu = ({ active = false }: ResourcesMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      className={`inline-flex items-center gap-1.5 text-13 font-medium outline-none ${
        active ? 'border-b-2 border-accent pb-1 text-accent' : 'text-ink'
      }`}
    >
      Resources
      <span className="font-mono text-mono" aria-hidden="true">
        ▾
      </span>
    </DropdownMenuTrigger>
    <DropdownMenuContent variant="bureau" align="end" sideOffset={10}>
      {ITEMS.map((item) => (
        <DropdownMenuItem key={item.href} variant="bureau" asChild>
          <a href={item.href}>
            <span>{item.label}</span>
            <span className="font-mono text-mono opacity-60" aria-hidden="true">
              →
            </span>
          </a>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default ResourcesMenu;
