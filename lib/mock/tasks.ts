import type { Task } from '@/lib/types';

const now = Date.now();
const daysFromNow = (days: number) =>
  new Date(now + days * 86400000).toISOString();
const daysAgo = (days: number) =>
  new Date(now - days * 86400000).toISOString();

export const tasks: Task[] = [
  // Atlas Mobile App (p1)
  { id: 't1', title: 'Implement push notification service', status: 'in-progress', priority: 'high', projectId: 'p1', assigneeId: 'u1', dueDate: daysFromNow(2), createdAt: daysAgo(8) },
  { id: 't2', title: 'Design offline sync indicator', status: 'in-review', priority: 'medium', projectId: 'p1', assigneeId: 'u2', dueDate: daysFromNow(5), createdAt: daysAgo(10) },
  { id: 't3', title: 'Set up authentication flow', status: 'done', priority: 'high', projectId: 'p1', assigneeId: 'u3', dueDate: daysAgo(3), completedAt: daysAgo(3), createdAt: daysAgo(20) },
  { id: 't4', title: 'Build settings screen', status: 'todo', priority: 'low', projectId: 'p1', assigneeId: 'u3', dueDate: daysFromNow(10), createdAt: daysAgo(5) },
  { id: 't5', title: 'Write integration tests for sync', status: 'backlog', priority: 'medium', projectId: 'p1', assigneeId: 'u1', dueDate: daysFromNow(15), createdAt: daysAgo(2) },

  // Orbit Analytics Engine (p2)
  { id: 't6', title: 'Optimize query performance for large datasets', status: 'in-progress', priority: 'high', projectId: 'p2', assigneeId: 'u4', dueDate: daysFromNow(0), createdAt: daysAgo(12) },
  { id: 't7', title: 'Create real-time chart components', status: 'done', priority: 'medium', projectId: 'p2', assigneeId: 'u1', dueDate: daysAgo(5), completedAt: daysAgo(5), createdAt: daysAgo(15) },
  { id: 't8', title: 'Set up data pipeline workers', status: 'todo', priority: 'high', projectId: 'p2', assigneeId: 'u4', dueDate: daysFromNow(4), createdAt: daysAgo(7) },
  { id: 't9', title: 'Write API documentation', status: 'backlog', priority: 'low', projectId: 'p2', assigneeId: 'u6', dueDate: daysFromNow(12), createdAt: daysAgo(1) },

  // Nimbus Design System (p3)
  { id: 't10', title: 'Document color token system', status: 'done', priority: 'medium', projectId: 'p3', assigneeId: 'u2', dueDate: daysAgo(2), completedAt: daysAgo(2), createdAt: daysAgo(12) },
  { id: 't11', title: 'Build Button component variants', status: 'in-review', priority: 'medium', projectId: 'p3', assigneeId: 'u3', dueDate: daysFromNow(3), createdAt: daysAgo(6) },
  { id: 't12', title: 'Create Tooltip and Popover components', status: 'todo', priority: 'low', projectId: 'p3', assigneeId: 'u3', dueDate: daysFromNow(8), createdAt: daysAgo(3) },
  { id: 't13', title: 'Accessibility audit of core components', status: 'backlog', priority: 'high', projectId: 'p3', assigneeId: 'u2', dueDate: daysFromNow(20), createdAt: daysAgo(1) },

  // Pulse API Gateway (p4)
  { id: 't14', title: 'Fix rate limiting memory leak', status: 'in-progress', priority: 'high', projectId: 'p4', assigneeId: 'u4', dueDate: daysFromNow(1), createdAt: daysAgo(5) },
  { id: 't15', title: 'Implement JWT refresh token flow', status: 'backlog', priority: 'high', projectId: 'p4', assigneeId: 'u6', dueDate: daysFromNow(0), createdAt: daysAgo(10) },
  { id: 't16', title: 'Add request routing rules UI', status: 'backlog', priority: 'medium', projectId: 'p4', assigneeId: 'u4', dueDate: daysFromNow(14), createdAt: daysAgo(2) },

  // Verge Onboarding Flow (p5)
  { id: 't17', title: 'Design welcome screen illustrations', status: 'done', priority: 'medium', projectId: 'p5', assigneeId: 'u2', dueDate: daysAgo(4), completedAt: daysAgo(4), createdAt: daysAgo(15) },
  { id: 't18', title: 'Build interactive walkthrough component', status: 'in-progress', priority: 'high', projectId: 'p5', assigneeId: 'u3', dueDate: daysFromNow(6), createdAt: daysAgo(8) },
  { id: 't19', title: 'Track onboarding completion metrics', status: 'todo', priority: 'medium', projectId: 'p5', assigneeId: 'u1', dueDate: daysFromNow(9), createdAt: daysAgo(4) },
  { id: 't20', title: 'Write copy for onboarding steps', status: 'backlog', priority: 'low', projectId: 'p5', assigneeId: 'u2', dueDate: daysFromNow(11), createdAt: daysAgo(1) },

  // Helix CI/CD Pipeline (p6)
  { id: 't21', title: 'Set up parallel test execution', status: 'in-progress', priority: 'high', projectId: 'p6', assigneeId: 'u5', dueDate: daysFromNow(3), createdAt: daysAgo(9) },
  { id: 't22', title: 'Configure deployment staging environments', status: 'done', priority: 'medium', projectId: 'p6', assigneeId: 'u5', dueDate: daysAgo(7), completedAt: daysAgo(7), createdAt: daysAgo(18) },
  { id: 't23', title: 'Add rollback mechanism', status: 'todo', priority: 'high', projectId: 'p6', assigneeId: 'u4', dueDate: daysFromNow(8), createdAt: daysAgo(3) },
  { id: 't24', title: 'Write pipeline documentation', status: 'backlog', priority: 'low', projectId: 'p6', assigneeId: 'u5', dueDate: daysFromNow(16), createdAt: daysAgo(1) },

  // Nova Customer Portal (p7)
  { id: 't25', title: 'Build account management dashboard', status: 'in-progress', priority: 'high', projectId: 'p7', assigneeId: 'u3', dueDate: daysFromNow(7), createdAt: daysAgo(5) },
  { id: 't26', title: 'Implement billing integration', status: 'todo', priority: 'high', projectId: 'p7', assigneeId: 'u1', dueDate: daysFromNow(12), createdAt: daysAgo(3) },
  { id: 't27', title: 'Create support ticket system', status: 'backlog', priority: 'medium', projectId: 'p7', assigneeId: 'u6', dueDate: daysFromNow(18), createdAt: daysAgo(2) },
  { id: 't28', title: 'Design portal landing page', status: 'done', priority: 'medium', projectId: 'p7', assigneeId: 'u2', dueDate: daysAgo(1), completedAt: daysAgo(1), createdAt: daysAgo(10) },

  // Aurora Data Platform (p8)
  { id: 't29', title: 'Set up data lake infrastructure', status: 'in-progress', priority: 'high', projectId: 'p8', assigneeId: 'u4', dueDate: daysFromNow(10), createdAt: daysAgo(4) },
  { id: 't30', title: 'Build ETL pipeline framework', status: 'todo', priority: 'high', projectId: 'p8', assigneeId: 'u5', dueDate: daysFromNow(15), createdAt: daysAgo(2) },
  { id: 't31', title: 'Create data governance policies', status: 'backlog', priority: 'medium', projectId: 'p8', assigneeId: 'u1', dueDate: daysFromNow(25), createdAt: daysAgo(1) },
  { id: 't32', title: 'Build visualization dashboard', status: 'backlog', priority: 'low', projectId: 'p8', assigneeId: 'u3', dueDate: daysFromNow(30), createdAt: daysAgo(1) },

  // Vertex Cloud Migration (p9)
  { id: 't33', title: 'Assess current infrastructure', status: 'done', priority: 'high', projectId: 'p9', assigneeId: 'u5', dueDate: daysAgo(5), completedAt: daysAgo(5), createdAt: daysAgo(20) },
  { id: 't34', title: 'Design cloud architecture', status: 'in-review', priority: 'high', projectId: 'p9', assigneeId: 'u4', dueDate: daysFromNow(5), createdAt: daysAgo(8) },
  { id: 't35', title: 'Migrate database layer', status: 'todo', priority: 'high', projectId: 'p9', assigneeId: 'u5', dueDate: daysFromNow(14), createdAt: daysAgo(3) },
  { id: 't36', title: 'Set up monitoring and alerts', status: 'backlog', priority: 'medium', projectId: 'p9', assigneeId: 'u4', dueDate: daysFromNow(20), createdAt: daysAgo(1) },

  // Horizon E-commerce Platform (p10)
  { id: 't37', title: 'Build product catalog', status: 'done', priority: 'high', projectId: 'p10', assigneeId: 'u3', dueDate: daysAgo(2), completedAt: daysAgo(2), createdAt: daysAgo(15) },
  { id: 't38', title: 'Implement shopping cart', status: 'in-progress', priority: 'high', projectId: 'p10', assigneeId: 'u1', dueDate: daysFromNow(4), createdAt: daysAgo(6) },
  { id: 't39', title: 'Integrate payment gateway', status: 'todo', priority: 'high', projectId: 'p10', assigneeId: 'u3', dueDate: daysFromNow(8), createdAt: daysAgo(3) },
  { id: 't40', title: 'Create order tracking system', status: 'backlog', priority: 'medium', projectId: 'p10', assigneeId: 'u2', dueDate: daysFromNow(12), createdAt: daysAgo(1) },
];
