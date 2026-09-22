'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/lib/data-provider';
import type { Project, ProjectHealth } from '@/lib/types';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

interface FormState {
  name: string;
  description: string;
  health: ProjectHealth;
  dueDate: string;
  clientId: string;
}

function toDateInputValue(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

const emptyForm: FormState = {
  name: '',
  description: '',
  health: 'on-track',
  dueDate: '',
  clientId: 'unassigned',
};

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const { addProject, updateProject, clients } = useData();
  const isEdit = !!project;

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  React.useEffect(() => {
    if (open) {
      setForm(
        project
          ? {
              name: project.name,
              description: project.description,
              health: project.health,
              dueDate: toDateInputValue(project.dueDate),
              clientId: project.clientId || 'unassigned',
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, project]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Project name is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.health) nextErrors.health = 'Status is required.';
    if (!form.dueDate) nextErrors.dueDate = 'Due date is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const clientId = form.clientId === 'unassigned' ? undefined : form.clientId;
      const dueDateIso = new Date(form.dueDate).toISOString();

      if (isEdit && project) {
        updateProject(project.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          health: form.health,
          dueDate: dueDateIso,
          clientId,
        });
        toast.success('Project updated', {
          description: `${form.name.trim()}'s details have been saved.`,
        });
      } else {
        addProject({
          name: form.name.trim(),
          description: form.description.trim(),
          health: form.health,
          dueDate: dueDateIso,
          clientId,
          memberIds: [],
        });
        toast.success('Project created', {
          description: `${form.name.trim()} has been added to your projects.`,
        });
      }
      onOpenChange(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error('Unable to save project. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this project\u2019s details.'
              : 'Add a new project to start tracking tasks and progress.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'project-name-error' : undefined}
              />
              {errors.name && (
                <p id="project-name-error" className="text-xs text-danger">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="project-description">Description *</Label>
              <Textarea
                id="project-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={3}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'project-description-error' : undefined}
              />
              {errors.description && (
                <p id="project-description-error" className="text-xs text-danger">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-health">Status *</Label>
              <Select
                value={form.health}
                onValueChange={(v) => setField('health', v as ProjectHealth)}
              >
                <SelectTrigger id="project-health" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              {errors.health && (
                <p className="text-xs text-danger">{errors.health}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-due-date">Due Date *</Label>
              <Input
                id="project-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) => setField('dueDate', e.target.value)}
                aria-invalid={!!errors.dueDate}
                aria-describedby={errors.dueDate ? 'project-due-date-error' : undefined}
              />
              {errors.dueDate && (
                <p id="project-due-date-error" className="text-xs text-danger">
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="project-client">Client</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setField('clientId', v)}
              >
                <SelectTrigger id="project-client" aria-label="Client">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
