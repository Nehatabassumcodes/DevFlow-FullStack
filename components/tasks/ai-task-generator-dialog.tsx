'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Sparkles, Loader2, RotateCcw } from 'lucide-react';
import type { TaskPriority } from '@/lib/types';
import { useData } from '@/lib/data-provider';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AiTaskGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Project selected on the Tasks page, if any — preselects the dialog's project. */
  defaultProjectId?: string;
}

// Shape returned by POST /api/ai/generate-tasks (backend/src/services/ai.service.ts).
// These are suggestions only — nothing is saved until the user reviews and accepts them.
interface AiTaskSuggestion {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

// A suggestion the user can still edit/uncheck before it is saved.
interface ReviewItem extends AiTaskSuggestion {
  id: string;
  selected: boolean;
}

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 4000;

function toFrontendPriority(priority: AiTaskSuggestion['priority']): TaskPriority {
  return priority.toLowerCase() as TaskPriority;
}

export function AiTaskGeneratorDialog({ open, onOpenChange, defaultProjectId }: AiTaskGeneratorDialogProps) {
  const { projects, addTask } = useData();
  const [projectId, setProjectId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [items, setItems] = React.useState<ReviewItem[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId && defaultProjectId !== 'all' ? defaultProjectId : projects[0]?.id ?? '');
    setDescription('');
    setLoading(false);
    setError('');
    setItems(null);
  }, [open, defaultProjectId, projects]);

  const canGenerate = projectId !== '' && description.trim().length >= DESCRIPTION_MIN && !loading;

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId) { setError('Select a project first.'); return; }
    const trimmed = description.trim();
    if (trimmed.length < DESCRIPTION_MIN) { setError(`Describe the feature in at least ${DESCRIPTION_MIN} characters.`); return; }

    setLoading(true);
    setError('');
    setItems(null);
    try {
      const result = await apiRequest<{ tasks: AiTaskSuggestion[] }>('/ai/generate-tasks', {
        method: 'POST',
        body: JSON.stringify({ projectId, description: trimmed }),
      });
      setItems(
        result.tasks.map((task, index) => ({ ...task, id: `suggestion-${index}-${Date.now()}`, selected: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function updateItem(id: string, patch: Partial<ReviewItem>) {
    setItems((prev) => (prev ? prev.map((item) => (item.id === id ? { ...item, ...patch } : item)) : prev));
  }

  const selectedCount = items?.filter((item) => item.selected).length ?? 0;

  function saveSelected() {
    if (!items) return;
    const toSave = items.filter((item) => item.selected && item.title.trim());
    if (toSave.length === 0) { setError('Select at least one task to add.'); return; }
    for (const item of toSave) {
      addTask({
        title: item.title.trim(),
        description: item.description.trim() || undefined,
        status: 'todo',
        priority: toFrontendPriority(item.priority),
        projectId,
        dueDate: '',
      });
    }
    toast.success(`Added ${toSave.length} task${toSave.length === 1 ? '' : 's'}`, {
      description: 'Generated with AI and saved to the project.',
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-violet" />
            Generate tasks with AI
          </DialogTitle>
          <DialogDescription>
            Describe a project or feature and get task suggestions to review before saving.
          </DialogDescription>
        </DialogHeader>

        {!items ? (
          <form onSubmit={generate} className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-feature-description">Feature or project description</Label>
              <Textarea
                id="ai-feature-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Add threaded comments to posts: users can reply to a comment, and moderators can delete abusive ones."
                rows={5}
                maxLength={DESCRIPTION_MAX}
                disabled={loading}
              />
              <p className="text-xs text-muted-fg">{description.trim().length}/{DESCRIPTION_MAX} characters</p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canGenerate}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Generate tasks</>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-fg">
              Review the suggestions below. Uncheck or edit anything before adding them to the project.
            </p>
            <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border bg-card p-3">
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={(checked) => updateItem(item.id, { selected: checked === true })}
                    className="mt-1"
                    aria-label={`Include "${item.title}"`}
                  />
                  <div className="flex-1 space-y-2">
                    <Input
                      value={item.title}
                      onChange={(event) => updateItem(item.id, { title: event.target.value })}
                      className="font-medium"
                      aria-label="Task title"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(event) => updateItem(item.id, { description: event.target.value })}
                      rows={2}
                      className="text-sm"
                      aria-label="Task description"
                    />
                    <Select
                      value={item.priority}
                      onValueChange={(value) => updateItem(item.id, { priority: value as AiTaskSuggestion['priority'] })}
                    >
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low priority</SelectItem>
                        <SelectItem value="MEDIUM">Medium priority</SelectItem>
                        <SelectItem value="HIGH">High priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'} className="h-fit shrink-0">
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setItems(null)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={saveSelected} disabled={selectedCount === 0}>
                  Add {selectedCount || ''} task{selectedCount === 1 ? '' : 's'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
