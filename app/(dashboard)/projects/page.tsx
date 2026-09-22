'use client';

import * as React from 'react';
import { Search, FolderX, X, Filter, Plus } from 'lucide-react';
import { useData } from '@/lib/data-provider';
import { ProjectCard } from '@/components/dashboard/project-card';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog';
import { EmptyState } from '@/components/states/empty-state';
import { ErrorState } from '@/components/states/error-state';
import { ProjectCardSkeleton } from '@/components/states/skeletons';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { projects, loading, error, retry } = useData();
  const [search, setSearch] = React.useState('');
  const [healthFilter, setHealthFilter] = React.useState<string>('all');

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = React.useState<Project | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesHealth =
        healthFilter === 'all' || p.health === healthFilter;
      return matchesSearch && matchesHealth;
    });
  }, [projects, search, healthFilter]);

  const hasFilters = search || healthFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setHealthFilter('all');
  };

  const openCreate = () => {
    setEditingProject(null);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const openDelete = (project: Project) => {
    setDeletingProject(project);
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
            Projects
          </h1>
          <p className="mt-1 text-sm text-muted-fg">
            {loading ? 'Loading...' : `${filtered.length} of ${projects.length} projects`}
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search projects"
          />
        </div>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by health">
            <Filter className="h-4 w-4 mr-2 text-muted-fg" />
            <SelectValue placeholder="Health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="on-track">On Track</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderX className="h-8 w-8" />}
          title="No projects yet"
          description="You don't have any projects yet. Create one to start tracking tasks and progress."
          action={{ label: 'Create Project', onClick: openCreate }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderX className="h-8 w-8" />}
          title="No projects found"
          description="No projects match your current filters. Try adjusting your search."
          action={{ label: 'Clear filters', onClick: clearFilters }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ))}
        </div>
      )}

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editingProject} />
      <DeleteProjectDialog open={deleteOpen} onOpenChange={setDeleteOpen} project={deletingProject} />
    </div>
  );
}
