'use client';

import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useData } from '@/lib/data-provider';
import type { Project } from '@/lib/types';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function DeleteProjectDialog({ open, onOpenChange, project }: DeleteProjectDialogProps) {
  const { deleteProject, getTasksByProject } = useData();

  if (!project) return null;

  const taskCount = getTasksByProject(project.id).length;

  const handleDelete = () => {
    try {
      deleteProject(project.id);
      toast.success('Project deleted', {
        description:
          taskCount > 0
            ? `${project.name} and its ${taskCount} task${taskCount === 1 ? '' : 's'} were removed.`
            : `${project.name} was removed.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error('Unable to delete project. Please try again.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `This project has ${taskCount} associated task${
                  taskCount === 1 ? '' : 's'
                } that will also be deleted. This action cannot be easily undone.`
              : 'This will permanently remove this project. This action cannot be easily undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-danger text-white hover:bg-danger/90"
          >
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
