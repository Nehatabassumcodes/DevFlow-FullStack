'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Users, X, Plus, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { ClientRowSkeleton } from '@/components/states/skeletons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ClientAvatar } from '@/components/clients/client-avatar';
import { ClientStatusBadge } from '@/components/clients/client-status-badge';
import { ClientRowActions } from '@/components/clients/client-row-actions';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ClientViewDialog } from '@/components/clients/client-view-dialog';
import { DeleteClientDialog } from '@/components/clients/delete-client-dialog';
import { cn } from '@/lib/utils';
import type { Client, ClientStatus } from '@/lib/types';

type StatusFilter = 'all' | ClientStatus;
type SortField = 'name' | 'company' | 'projects';
type SortDir = 'asc' | 'desc';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
];

function SortHeader({
  field,
  label,
  sortField,
  sortDir,
  onToggle,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onToggle: (field: SortField) => void;
}) {
  const isActive = sortField === field;
  const Icon = !isActive ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onToggle(field)}
      className={cn(
        'inline-flex items-center gap-1 text-left font-medium transition-colors hover:text-foreground focus-ring rounded-sm',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export default function ClientsPage() {
  const { clients, loading, error, retry, getProjectsByClient } = useData();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [sortField, setSortField] = React.useState<SortField>('name');
  const [sortDir, setSortDir] = React.useState<SortDir>('asc');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [viewingClient, setViewingClient] = React.useState<Client | null>(null);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [deletingClient, setDeletingClient] = React.useState<Client | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const projectCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    clients.forEach((c) => map.set(c.id, getProjectsByClient(c.id).length));
    return map;
  }, [clients, getProjectsByClient]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...result].sort((a, b) => {
      if (sortField === 'projects') {
        return ((projectCounts.get(a.id) || 0) - (projectCounts.get(b.id) || 0)) * dir;
      }
      const aVal = sortField === 'name' ? a.name : a.company;
      const bVal = sortField === 'name' ? b.name : b.company;
      return aVal.localeCompare(bVal) * dir;
    });
  }, [clients, search, statusFilter, sortField, sortDir, projectCounts]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const openCreate = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const openView = (client: Client) => {
    setViewingClient(client);
    setViewOpen(true);
  };

  const openDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Clients
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            Manage your clients, contacts, and project relationships.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            placeholder="Search clients or contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search clients or contacts"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              aria-pressed={statusFilter === f.value}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring',
                statusFilter === f.value
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'border-input bg-background text-muted-fg hover:text-foreground hover:bg-accent'
              )}
            >
              {f.label}
            </button>
          ))}
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0">
              <X className="h-4 w-4 mr-2" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-fg">
        {loading ? 'Loading...' : `${filtered.length} of ${clients.length} clients`}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ClientRowSkeleton key={i} />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No clients yet"
          description="Add your first client to start managing client relationships."
          action={{ label: 'New Client', onClick: openCreate }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No clients found"
          description="Try changing your search or filters."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortHeader
                    field="name"
                    label="Client"
                    sortField={sortField}
                    sortDir={sortDir}
                    onToggle={toggleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    field="company"
                    label="Company"
                    sortField={sortField}
                    sortDir={sortDir}
                    onToggle={toggleSort}
                  />
                </TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <SortHeader
                    field="projects"
                    label="Projects"
                    sortField={sortField}
                    sortDir={sortDir}
                    onToggle={toggleSort}
                  />
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const projectCount = projectCounts.get(client.id) || 0;
                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer"
                    onClick={() => openView(client)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClientAvatar id={client.id} name={client.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {client.name}
                          </p>
                          <p className="truncate text-xs text-muted-fg">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{client.company}</p>
                      <p className="text-xs text-muted-fg">{client.country || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{client.industry}</span>
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell>
                      {projectCount > 0 ? (
                        <Link
                          href="/projects"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-medium text-foreground hover:text-accent-cyan transition-colors"
                        >
                          {projectCount} project{projectCount === 1 ? '' : 's'}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-fg">No projects</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <ClientRowActions
                        client={client}
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={openDelete}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ClientFormDialog open={formOpen} onOpenChange={setFormOpen} client={editingClient} />
      <ClientViewDialog open={viewOpen} onOpenChange={setViewOpen} client={viewingClient} />
      <DeleteClientDialog open={deleteOpen} onOpenChange={setDeleteOpen} client={deletingClient} />
    </div>
  );
}
