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
import type { Client, ClientStatus } from '@/lib/types';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  country: string;
  industry: string;
  phone: string;
  status: ClientStatus;
  notes: string;
}

const emptyForm: FormState = {
  name: '',
  email: '',
  company: '',
  country: '',
  industry: '',
  phone: '',
  status: 'prospect',
  notes: '',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClientFormDialog({ open, onOpenChange, client }: ClientFormDialogProps) {
  const { addClient, updateClient } = useData();
  const isEdit = !!client;

  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});

  React.useEffect(() => {
    if (open) {
      setForm(
        client
          ? {
              name: client.name,
              email: client.email,
              company: client.company,
              country: client.country,
              industry: client.industry,
              phone: client.phone || '',
              status: client.status,
              notes: client.notes || '',
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, client]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = 'Full name is required.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!emailRegex.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.company.trim()) nextErrors.company = 'Company is required.';
    if (!form.industry.trim()) nextErrors.industry = 'Industry is required.';
    if (!form.status) nextErrors.status = 'Status is required.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        country: form.country.trim(),
        industry: form.industry.trim(),
        phone: form.phone.trim() || undefined,
        status: form.status,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit && client) {
        updateClient(client.id, payload);
        toast.success('Client updated', {
          description: `${payload.name}'s details have been saved.`,
        });
      } else {
        addClient(payload);
        toast.success('Client created', {
          description: `${payload.name} has been added to your clients.`,
        });
      }
      onOpenChange(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error('Unable to save client. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'New Client'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this client\u2019s details.'
              : 'Add a new client to manage their contacts and projects.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="client-name">Full Name *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'client-name-error' : undefined}
              />
              {errors.name && (
                <p id="client-name-error" className="text-xs text-danger">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email *</Label>
              <Input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'client-email-error' : undefined}
              />
              {errors.email && (
                <p id="client-email-error" className="text-xs text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-company">Company *</Label>
              <Input
                id="client-company"
                value={form.company}
                onChange={(e) => setField('company', e.target.value)}
                aria-invalid={!!errors.company}
                aria-describedby={errors.company ? 'client-company-error' : undefined}
              />
              {errors.company && (
                <p id="client-company-error" className="text-xs text-danger">
                  {errors.company}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-country">Country</Label>
              <Input
                id="client-country"
                value={form.country}
                onChange={(e) => setField('country', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-industry">Industry *</Label>
              <Input
                id="client-industry"
                value={form.industry}
                onChange={(e) => setField('industry', e.target.value)}
                aria-invalid={!!errors.industry}
                aria-describedby={errors.industry ? 'client-industry-error' : undefined}
              />
              {errors.industry && (
                <p id="client-industry-error" className="text-xs text-danger">
                  {errors.industry}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-status">Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField('status', v as ClientStatus)}
              >
                <SelectTrigger id="client-status" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="client-notes">Notes</Label>
              <Textarea
                id="client-notes"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save Changes' : 'Create Client'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
