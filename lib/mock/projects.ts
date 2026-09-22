import type { Project } from '@/lib/types';

const now = Date.now();
const daysFromNow = (days: number) =>
  new Date(now + days * 86400000).toISOString();
const daysAgo = (days: number) =>
  new Date(now - days * 86400000).toISOString();

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Atlas Mobile App',
    description:
      'Cross-platform mobile client for the Atlas platform with offline sync and push notifications.',
    ownerId: 'u1',
    memberIds: ['u1', 'u2', 'u3'],
    health: 'on-track',
    dueDate: daysFromNow(21),
    createdAt: daysAgo(45),
    clientId: 'c1',
  },
  {
    id: 'p2',
    name: 'Orbit Analytics Engine',
    description:
      'Real-time data pipeline and analytics dashboard for internal metrics tracking.',
    ownerId: 'u4',
    memberIds: ['u4', 'u1', 'u6'],
    health: 'at-risk',
    dueDate: daysFromNow(12),
    createdAt: daysAgo(60),
    clientId: 'c2',
  },
  {
    id: 'p3',
    name: 'Nimbus Design System',
    description:
      'Component library and design tokens for consistent UI across all DevFlow products.',
    ownerId: 'u2',
    memberIds: ['u2', 'u3', 'u5'],
    health: 'on-track',
    dueDate: daysFromNow(35),
    createdAt: daysAgo(30),
    clientId: 'c5',
  },
  {
    id: 'p4',
    name: 'Pulse API Gateway',
    description:
      'Unified API gateway with rate limiting, authentication, and request routing.',
    ownerId: 'u4',
    memberIds: ['u4', 'u6'],
    health: 'blocked',
    dueDate: daysFromNow(7),
    createdAt: daysAgo(75),
  },
  {
    id: 'p5',
    name: 'Verge Onboarding Flow',
    description:
      'New user onboarding experience with interactive walkthroughs and progress tracking.',
    ownerId: 'u2',
    memberIds: ['u2', 'u3', 'u1', 'u5'],
    health: 'on-track',
    dueDate: daysFromNow(28),
    createdAt: daysAgo(20),
    clientId: 'c4',
  },
  {
    id: 'p6',
    name: 'Helix CI/CD Pipeline',
    description:
      'Automated build, test, and deployment pipeline with parallel execution.',
    ownerId: 'u5',
    memberIds: ['u5', 'u4'],
    health: 'at-risk',
    dueDate: daysFromNow(18),
    createdAt: daysAgo(50),
  },
  {
    id: 'p7',
    name: 'Nova Customer Portal',
    description:
      'Self-service portal for customers to manage accounts, billing, and support tickets.',
    ownerId: 'u3',
    memberIds: ['u3', 'u1', 'u6'],
    health: 'on-track',
    dueDate: daysFromNow(40),
    createdAt: daysAgo(15),
    clientId: 'c1',
  },
  {
    id: 'p8',
    name: 'Aurora Data Platform',
    description:
      'Centralized data lake with ETL pipelines, data governance, and visualization tools.',
    ownerId: 'u4',
    memberIds: ['u4', 'u5', 'u1'],
    health: 'on-track',
    dueDate: daysFromNow(55),
    createdAt: daysAgo(10),
    clientId: 'c10',
  },
  {
    id: 'p9',
    name: 'Vertex Cloud Migration',
    description:
      'Migrate legacy infrastructure to cloud-native architecture with zero downtime.',
    ownerId: 'u5',
    memberIds: ['u5', 'u4', 'u3'],
    health: 'at-risk',
    dueDate: daysFromNow(30),
    createdAt: daysAgo(25),
    clientId: 'c7',
  },
  {
    id: 'p10',
    name: 'Horizon E-commerce Platform',
    description:
      'Full-featured online store with inventory management, payments, and order tracking.',
    ownerId: 'u2',
    memberIds: ['u2', 'u3', 'u1'],
    health: 'on-track',
    dueDate: daysFromNow(14),
    createdAt: daysAgo(35),
    clientId: 'c9',
  },
];
