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
import type { Client } from '@/lib/types';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function DeleteClientDialog({ open, onOpenChange, client }: DeleteClientDialogProps) {
  const { deleteClient, getProjectsByClient } = useData();

  if (!client) return null;

  const projectCount = getProjectsByClient(client.id).length;

  const handleDelete = () => {
    try {
      deleteClient(client.id);
      toast.success('Client deleted', {
        description:
          projectCount > 0
            ? `${client.name} was removed. ${projectCount} project${projectCount === 1 ? '' : 's'} moved to Unassigned.`
            : `${client.name} was removed.`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error('Unable to delete client. Please try again.');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {client.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {projectCount > 0
              ? `This client has ${projectCount} associated project${
                  projectCount === 1 ? '' : 's'
                }. The project${
                  projectCount === 1 ? '' : 's'
                } will not be deleted \u2014 they'll be marked as Unassigned. This action cannot be undone.`
              : 'This will permanently remove this client. This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-danger text-white hover:bg-danger/90"
          >
            Delete Client
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
