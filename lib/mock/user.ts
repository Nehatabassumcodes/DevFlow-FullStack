import type { User } from '@/lib/types';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export const currentUser: User = {
  id: 'u1',
  name: 'Alex Rivera',
  email: 'alex.rivera@devflow.io',
  role: 'Senior Engineer',
  university: 'Stanford University',
  department: 'Engineering',
  phone: '+1 (555) 012-3456',
  avatarColor: 'hsl(187 85% 53%)',
  initials: getInitials('Alex Rivera'),
};

export const users: User[] = [
  currentUser,
  {
    id: 'u2',
    name: 'Maya Chen',
    email: 'maya.chen@devflow.io',
    role: 'Product Designer',
    avatarColor: 'hsl(258 90% 66%)',
    initials: 'MC',
  },
  {
    id: 'u3',
    name: 'Jordan Blake',
    email: 'jordan.blake@devflow.io',
    role: 'Frontend Engineer',
    avatarColor: 'hsl(217 91% 60%)',
    initials: 'JB',
  },
  {
    id: 'u4',
    name: 'Sam Patel',
    email: 'sam.patel@devflow.io',
    role: 'Backend Engineer',
    avatarColor: 'hsl(160 84% 39%)',
    initials: 'SP',
  },
  {
    id: 'u5',
    name: 'Nina Foster',
    email: 'nina.foster@devflow.io',
    role: 'DevOps Engineer',
    avatarColor: 'hsl(38 92% 50%)',
    initials: 'NF',
  },
  {
    id: 'u6',
    name: 'Tom Walsh',
    email: 'tom.walsh@devflow.io',
    role: 'QA Engineer',
    avatarColor: 'hsl(0 72% 51%)',
    initials: 'TW',
  },
];
