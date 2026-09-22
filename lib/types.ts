export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export type ProjectHealth = 'on-track' | 'at-risk' | 'blocked';

export type ClientStatus = 'active' | 'prospect' | 'on-hold' | 'archived';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  initials: string;
  university?: string;
  department?: string;
  phone?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  industry: string;
  status: ClientStatus;
  phone?: string;
  notes?: string;
  projectIds: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  health: ProjectHealth;
  dueDate: string;
  createdAt: string;
  clientId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
}

export type ActivityType =
  | 'task-completed'
  | 'task-created'
  | 'task-updated'
  | 'task-deleted'
  | 'project-created'
  | 'project-updated'
  | 'project-deleted'
  | 'comment'
  | 'status-changed'
  | 'member-joined'
  | 'client-created'
  | 'client-updated'
  | 'client-deleted'
  | 'profile-updated';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  targetId: string;
  targetType: 'task' | 'project' | 'client' | 'profile';
  targetName: string;
  timestamp: string;
}

export interface AnalyticsData {
  productivityTrend: { date: string; score: number; tasksCompleted: number }[];
  completionByProject: { project: string; completed: number; total: number }[];
  distributionByPriority: { priority: string; count: number; fill: string }[];
}
