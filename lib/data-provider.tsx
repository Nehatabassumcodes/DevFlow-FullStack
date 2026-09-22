'use client';

import * as React from 'react';
import type {
  AnalyticsData,
  Project,
  Task,
  Activity,
  Client,
  User,
  TaskStatus,
  TaskPriority,
  ProjectHealth,
  ClientStatus,
  ActivityType,
} from '@/lib/types';
import { activities as mockActivities } from '@/lib/mock/activity';
import { clients as mockClients } from '@/lib/mock/clients';
import { currentUser as mockCurrentUser } from '@/lib/mock/user';
import { useAuth, type AuthUser } from '@/lib/auth';
import { apiRequest } from '@/lib/api';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const DEFAULT_LOAD_ERROR = 'Failed to load data. Please try again.';

interface DataSnapshot {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  clients: Client[];
  currentUser: User;
}

interface ApiUser { id: string; name: string; email: string; createdAt: string; updatedAt: string }
interface ApiProject { id: string; name: string; description: string | null; ownerId: string | null; dueDate: string | null; createdAt: string; owner?: ApiUser | null }
interface ApiTask { id: string; title: string; description: string | null; status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'; priority: 'LOW' | 'MEDIUM' | 'HIGH'; projectId: string; assigneeId: string | null; dueDate: string | null; createdAt: string; updatedAt: string }

function mapUser(user: ApiUser): User {
  return { ...mockCurrentUser, id: user.id, name: user.name, email: user.email, initials: getInitials(user.name) };
}
function mapProject(project: ApiProject): Project {
  return { id: project.id, name: project.name, description: project.description ?? '', ownerId: project.ownerId ?? '', memberIds: project.ownerId ? [project.ownerId] : [], health: 'on-track', dueDate: project.dueDate ?? '', createdAt: project.createdAt };
}
function mapStatus(status: ApiTask['status']): TaskStatus {
  return status.toLowerCase().replace('_', '-') as TaskStatus;
}
function mapTask(task: ApiTask): Task {
  return { id: task.id, title: task.title, description: task.description ?? undefined, status: mapStatus(task.status), priority: task.priority.toLowerCase() as TaskPriority, projectId: task.projectId, assigneeId: task.assigneeId ?? '', dueDate: task.dueDate ?? '', createdAt: task.createdAt, completedAt: task.status === 'DONE' ? task.updatedAt : undefined };
}
function apiStatus(status: TaskStatus): ApiTask['status'] { return status.toUpperCase().replace('-', '_') as ApiTask['status']; }
function apiPriority(priority: TaskPriority): ApiTask['priority'] { return priority.toUpperCase() as ApiTask['priority']; }

// `/users` is fetched for legitimate list purposes only (member/assignee selection, etc.) —
// the signed-in user's identity comes from `authUser` (AuthProvider), never from this list.
async function fetchAppData(authUser: AuthUser | null): Promise<DataSnapshot> {
  const [usersResponse, projectsResponse, tasksResponse] = await Promise.all([
    apiRequest<ApiUser[]>('/users'),
    apiRequest<ApiProject[]>('/projects'),
    apiRequest<ApiTask[]>('/tasks'),
  ]);
  const apiUsers = usersResponse ?? [];
  return {
    users: apiUsers.map(mapUser),
    projects: (projectsResponse ?? []).map(mapProject),
    tasks: (tasksResponse ?? []).map(mapTask),
    activities: [...mockActivities],
    clients: [...mockClients],
    currentUser: authUser
      ? { ...mockCurrentUser, id: authUser.id, name: authUser.name, email: authUser.email, initials: getInitials(authUser.name) }
      : mockCurrentUser,
  };
}

type ProductivityTrend = AnalyticsData['productivityTrend'];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Builds the productivity trend from task data. 'week' = the last 7 days (one
// point per day), 'month' = the last 4 weeks (one point per week). Per point:
// - tasksCompleted: tasks completed inside that period
// - score: % of tasks created by the end of that period that were completed
//   by then (the completion rate as of that point in time)
function buildProductivityTrend(
  tasks: Task[],
  range: 'week' | 'month'
): ProductivityTrend {
  const bucketCount = range === 'week' ? 7 : 4;
  const bucketDays = range === 'week' ? 1 : 7;
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const done = tasks
    .filter((t) => t.status === 'done')
    .map((t) => ({
      createdAt: new Date(t.createdAt).getTime(),
      completedAt: new Date(t.completedAt ?? t.createdAt).getTime(),
    }));

  return Array.from({ length: bucketCount }, (_, i) => {
    const end = addDays(tomorrow, -(bucketCount - 1 - i) * bucketDays);
    const start = addDays(end, -bucketDays);
    const endMs = end.getTime();
    const startMs = start.getTime();

    const created = tasks.filter(
      (t) => new Date(t.createdAt).getTime() < endMs
    ).length;
    const completedByEnd = done.filter(
      (t) => t.createdAt < endMs && t.completedAt < endMs
    ).length;
    const tasksCompleted = done.filter(
      (t) => t.completedAt >= startMs && t.completedAt < endMs
    ).length;

    return {
      date: range === 'week' ? DAY_LABELS[start.getDay()] : `Week ${i + 1}`,
      score: created > 0 ? Math.round((completedByEnd / created) * 100) : 0,
      tasksCompleted,
    };
  });
}

interface NewProjectInput {
  name: string;
  description: string;
  health: ProjectHealth;
  dueDate: string;
  memberIds: string[];
  clientId?: string;
}

interface NewTaskInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  dueDate: string;
}

interface NewClientInput {
  name: string;
  email: string;
  company: string;
  country: string;
  industry: string;
  status: ClientStatus;
  phone?: string;
  notes?: string;
}

interface ProfileInput {
  name: string;
  email: string;
  role: string;
  university?: string;
  department?: string;
  phone?: string;
}

interface DataContextValue {
  users: User[];
  projects: Project[];
  tasks: Task[];
  activities: Activity[];
  clients: Client[];
  currentUser: User;
  loading: boolean;
  error: string | null;
  retry: () => void;
  simulateError: () => void;
  toggleTaskComplete: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (task: NewTaskInput) => string;
  updateTask: (taskId: string, updates: Partial<NewTaskInput>) => void;
  deleteTask: (taskId: string) => void;
  addProject: (project: NewProjectInput) => string;
  updateProject: (projectId: string, updates: Partial<NewProjectInput>) => void;
  deleteProject: (projectId: string) => void;
  addClient: (client: NewClientInput) => string;
  updateClient: (clientId: string, updates: Partial<NewClientInput>) => void;
  deleteClient: (clientId: string) => void;
  updateProfile: (profile: ProfileInput) => void;
  getUser: (userId: string) => User | undefined;
  getProject: (projectId: string) => Project | undefined;
  getClient: (clientId: string) => Client | undefined;
  getTasksByProject: (projectId: string) => Task[];
  getProjectProgress: (projectId: string) => number;
  getProjectsByClient: (clientId: string) => Project[];
  getProductivityTrend: (range: 'week' | 'month') => ProductivityTrend;
  stats: {
    totalProjects: number;
    tasksCompleted: number;
    tasksDueToday: number;
    productivityScore: number;
    totalClients: number;
    totalProjectsTrend: number;
    tasksCompletedTrend: number;
    tasksDueTodayTrend: number;
    productivityScoreTrend: number;
  };
  statusDistribution: { status: string; count: number; fill: string }[];
  priorityDistribution: { priority: string; count: number; fill: string }[];
  completionByProject: { project: string; completed: number; total: number }[];
}

const DataContext = React.createContext<DataContextValue | null>(null);

export function useData() {
  const ctx = React.useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User>(mockCurrentUser);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authUser) return;
    setCurrentUser((previous) => ({
      ...previous,
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      initials: getInitials(authUser.name),
    }));
  }, [authUser]);

  // Identifies the latest load so a stale/unmounted request can't overwrite state.
  const loadIdRef = React.useRef(0);
  // When set, the next load rejects (drives simulateError through the real flow).
  const failNextLoadRef = React.useRef(false);

  const logActivity = React.useCallback(
    (
      type: ActivityType,
      targetId: string,
      targetType: Activity['targetType'],
      targetName: string
    ) => {
      const newActivity: Activity = {
        id: `a${Date.now()}`,
        type,
        userId: 'u1',
        targetId,
        targetType,
        targetName,
        timestamp: new Date().toISOString(),
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 50));
    },
    []
  );

  const toggleTaskComplete = React.useCallback((taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks((items) => items.map((item) => item.id === taskId ? { ...item, status: nextStatus, completedAt: nextStatus === 'done' ? new Date().toISOString() : undefined } : item));
    void apiRequest<ApiTask>(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: apiStatus(nextStatus) }) }).then((updated) => { setTasks((items) => items.map((item) => item.id === taskId ? mapTask(updated) : item)); logActivity(nextStatus === 'done' ? 'task-completed' : 'status-changed', taskId, 'task', task.title); }).catch((err) => { setTasks((items) => items.map((item) => item.id === taskId ? task : item)); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
  }, [tasks, logActivity]);

  const updateTaskStatus = React.useCallback(async (taskId: string, status: TaskStatus) => {
    const previous = tasks.find((item) => item.id === taskId);
    if (!previous) return;
    setTasks((items) => items.map((item) => item.id === taskId ? { ...item, status, completedAt: status === 'done' ? new Date().toISOString() : undefined } : item));
    try {
      const updated = await apiRequest<ApiTask>(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify({ status: apiStatus(status) }) });
      setTasks((items) => items.map((item) => item.id === taskId ? mapTask(updated) : item));
      logActivity('status-changed', taskId, 'task', previous.title);
    } catch (err) {
      setTasks((items) => items.map((item) => item.id === taskId ? previous : item));
      setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR);
    }
  }, [tasks, logActivity]);

  const addTask = React.useCallback((task: NewTaskInput): string => {
    const temporaryId = `pending-task-${Date.now()}`;
    const optimistic: Task = { ...task, id: temporaryId, assigneeId: task.assigneeId || currentUser.id, createdAt: new Date().toISOString() };
    setTasks((items) => [...items, optimistic]);
    void apiRequest<ApiTask>('/tasks', { method: 'POST', body: JSON.stringify({ title: task.title, description: task.description ?? null, projectId: task.projectId, assigneeId: task.assigneeId || currentUser.id, priority: apiPriority(task.priority), status: apiStatus(task.status), dueDate: task.dueDate || null }) }).then((created) => {
      setTasks((items) => items.map((item) => item.id === temporaryId ? mapTask(created) : item));
      logActivity('task-created', created.id, 'task', task.title);
    }).catch((err) => { setTasks((items) => items.filter((item) => item.id !== temporaryId)); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
    return temporaryId;
  }, [currentUser.id, logActivity]);

  const updateTask = React.useCallback((taskId: string, updates: Partial<NewTaskInput>) => {
    const previous = tasks.find((item) => item.id === taskId);
    if (!previous) return;
    setTasks((items) => items.map((item) => item.id === taskId ? { ...item, ...updates } : item));
    const payload = { ...updates, ...(updates.priority ? { priority: apiPriority(updates.priority) } : {}), ...(updates.status ? { status: apiStatus(updates.status) } : {}), ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate || null } : {}) };
    void apiRequest<ApiTask>(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((updated) => { setTasks((items) => items.map((item) => item.id === taskId ? mapTask(updated) : item)); logActivity('task-updated', taskId, 'task', previous.title); }).catch((err) => { setTasks((items) => items.map((item) => item.id === taskId ? previous : item)); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
  }, [tasks, logActivity]);

  const deleteTask = React.useCallback((taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    setTasks((items) => items.filter((item) => item.id !== taskId));
    void apiRequest(`/tasks/${taskId}`, { method: 'DELETE' }).then(() => logActivity('task-deleted', taskId, 'task', task.title)).catch((err) => { setTasks((items) => [task, ...items]); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
  }, [tasks, logActivity]);

  const addProject = React.useCallback(
    (project: NewProjectInput): string => {
      const temporaryId = `pending-project-${Date.now()}`;
      const optimistic: Project = { ...project, id: temporaryId, ownerId: currentUser.id, createdAt: new Date().toISOString() };
      setProjects((items) => [...items, optimistic]);
      void apiRequest<ApiProject>('/projects', { method: 'POST', body: JSON.stringify({ name: project.name, description: project.description || null, ownerId: currentUser.id, dueDate: project.dueDate || null }) }).then((created) => { setProjects((items) => items.map((item) => item.id === temporaryId ? mapProject(created) : item)); logActivity('project-created', created.id, 'project', project.name); }).catch((err) => { setProjects((items) => items.filter((item) => item.id !== temporaryId)); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
      return temporaryId;
    },
    [currentUser.id, logActivity]
  );

  const updateProject = React.useCallback(
    (projectId: string, updates: Partial<NewProjectInput>) => {
      const previous = projects.find((item) => item.id === projectId);
      if (!previous) return;
      setProjects((items) => items.map((item) => item.id === projectId ? { ...item, ...updates } : item));
      const payload = { ...(updates.name !== undefined ? { name: updates.name } : {}), ...(updates.description !== undefined ? { description: updates.description || null } : {}), ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate || null } : {}) };
      void apiRequest<ApiProject>(`/projects/${projectId}`, { method: 'PATCH', body: JSON.stringify(payload) }).then((updated) => { setProjects((items) => items.map((item) => item.id === projectId ? mapProject(updated) : item)); logActivity('project-updated', projectId, 'project', previous.name); }).catch((err) => { setProjects((items) => items.map((item) => item.id === projectId ? previous : item)); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
    },
    [projects, logActivity]
  );

  const deleteProject = React.useCallback(
    (projectId: string) => {
      const project = projects.find((item) => item.id === projectId);
      if (!project) return;
      const removedTasks = tasks.filter((item) => item.projectId === projectId);
      setProjects((items) => items.filter((item) => item.id !== projectId));
      setTasks((items) => items.filter((item) => item.projectId !== projectId));
      void apiRequest(`/projects/${projectId}`, { method: 'DELETE' }).then(() => logActivity('project-deleted', projectId, 'project', project.name)).catch((err) => { setProjects((items) => [project, ...items]); setTasks((items) => [...removedTasks, ...items]); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
    },
    [projects, tasks, logActivity]
  );

  const addClient = React.useCallback(
    (client: NewClientInput): string => {
      const id = `c${Date.now()}`;
      const newClient: Client = {
        ...client,
        id,
        projectIds: [],
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [...prev, newClient]);
      logActivity('client-created', id, 'client', client.name);
      return id;
    },
    [logActivity]
  );

  const updateClient = React.useCallback(
    (clientId: string, updates: Partial<NewClientInput>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
      );
      const client = clients.find((c) => c.id === clientId);
      if (client) logActivity('client-updated', clientId, 'client', client.name);
    },
    [clients, logActivity]
  );

  const deleteClient = React.useCallback(
    (clientId: string) => {
      const client = clients.find((c) => c.id === clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setProjects((prev) =>
        prev.map((p) =>
          p.clientId === clientId ? { ...p, clientId: undefined } : p
        )
      );
      if (client) logActivity('client-deleted', clientId, 'client', client.name);
    },
    [clients, logActivity]
  );

  const updateProfile = React.useCallback(
    (profile: ProfileInput) => {
      const previous = currentUser;
      setCurrentUser((prev) => ({
        ...prev,
        ...profile,
        initials: getInitials(profile.name),
      }));
      void apiRequest<ApiUser>(`/users/${currentUser.id}`, { method: 'PATCH', body: JSON.stringify({ name: profile.name, email: profile.email }) }).then((updated) => { setCurrentUser((item) => ({ ...item, ...mapUser(updated) })); logActivity('profile-updated', currentUser.id, 'profile', profile.name); }).catch((err) => { setCurrentUser(previous); setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR); });
    },
    [currentUser, logActivity]
  );

  const loadData = React.useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const shouldFail = failNextLoadRef.current;
    failNextLoadRef.current = false;

    setLoading(true);
    setError(null);

    try {
      if (shouldFail) throw new Error(DEFAULT_LOAD_ERROR);
      const data = await fetchAppData(authUser);
      if (loadId !== loadIdRef.current) return;
      setUsers(data.users);
      setProjects(data.projects);
      setTasks(data.tasks);
      setActivities(data.activities);
      setClients(data.clients);
      setCurrentUser(authUser ? { ...data.currentUser, id: authUser.id, name: authUser.name, email: authUser.email, initials: getInitials(authUser.name) } : data.currentUser);
      setLoading(false);
    } catch (err) {
      if (loadId !== loadIdRef.current) return;
      setProjects([]);
      setTasks([]);
      setActivities([]);
      setClients([]);
      setError(err instanceof Error ? err.message : DEFAULT_LOAD_ERROR);
      setLoading(false);
    }
  }, [authUser]);

  // Initial load; also invalidates any in-flight load on unmount.
  React.useEffect(() => {
    void loadData();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadData]);

  // Clears the error and reloads everything from the data source.
  const retry = React.useCallback(() => {
    void loadData();
  }, [loadData]);

  // Makes the next load fail so the error UI is exercised via the normal flow.
  const simulateError = React.useCallback(() => {
    failNextLoadRef.current = true;
    void loadData();
  }, [loadData]);

  const getUser = React.useCallback(
    (userId: string) =>
      userId === currentUser.id
        ? currentUser
        : users.find((u) => u.id === userId),
    [currentUser, users]
  );

  const getProject = React.useCallback(
    (projectId: string) => projects.find((p) => p.id === projectId),
    [projects]
  );

  const getClient = React.useCallback(
    (clientId: string) => clients.find((c) => c.id === clientId),
    [clients]
  );

  const getTasksByProject = React.useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId),
    [tasks]
  );

  const getProjectProgress = React.useCallback(
    (projectId: string) => {
      const projectTasks = tasks.filter((t) => t.projectId === projectId);
      if (projectTasks.length === 0) return 0;
      const done = projectTasks.filter((t) => t.status === 'done').length;
      return Math.round((done / projectTasks.length) * 100);
    },
    [tasks]
  );

  const getProjectsByClient = React.useCallback(
    (clientId: string) => projects.filter((p) => p.clientId === clientId),
    [projects]
  );

  const getProductivityTrend = React.useCallback(
    (range: 'week' | 'month') => buildProductivityTrend(tasks, range),
    [tasks]
  );

  const stats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = tasks.filter((t) => {
      if (t.status === 'done') return false;
      const due = new Date(t.dueDate);
      return due >= today && due < tomorrow;
    }).length;

    const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
    const totalTasks = tasks.length;
    const completionRate =
      totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
    const inProgressCount = tasks.filter(
      (t) => t.status === 'in-progress' || t.status === 'in-review'
    ).length;
    const productivityScore = Math.round(
      completionRate * 0.5 + (inProgressCount / Math.max(totalTasks, 1)) * 50
    );

    return {
      totalProjects: projects.length,
      tasksCompleted,
      tasksDueToday,
      productivityScore,
      totalClients: clients.length,
      totalProjectsTrend: 8,
      tasksCompletedTrend: 12,
      tasksDueTodayTrend: -5,
      productivityScoreTrend: 4,
    };
  }, [projects, tasks, clients]);

  const statusDistribution = React.useMemo(
    () => [
      {
        status: 'To Do',
        count: tasks.filter((t) => t.status === 'todo').length,
        fill: 'hsl(217 91% 60%)',
      },
      {
        status: 'In Progress',
        count: tasks.filter(
          (t) => t.status === 'in-progress' || t.status === 'in-review'
        ).length,
        fill: 'hsl(258 90% 66%)',
      },
      {
        status: 'Backlog',
        count: tasks.filter((t) => t.status === 'backlog').length,
        fill: 'hsl(215 16% 47%)',
      },
      {
        status: 'Done',
        count: tasks.filter((t) => t.status === 'done').length,
        fill: 'hsl(160 84% 39%)',
      },
    ],
    [tasks]
  );

  const priorityDistribution = React.useMemo(
    () => [
      { priority: 'Low', count: tasks.filter((t) => t.priority === 'low').length, fill: 'hsl(187 85% 53%)' },
      { priority: 'Medium', count: tasks.filter((t) => t.priority === 'medium').length, fill: 'hsl(38 92% 50%)' },
      { priority: 'High', count: tasks.filter((t) => t.priority === 'high').length, fill: 'hsl(0 72% 51%)' },
    ],
    [tasks]
  );

  const completionByProject = React.useMemo(
    () =>
      projects.map((p) => ({
        project: p.name.split(' ')[0],
        completed: tasks.filter(
          (t) => t.projectId === p.id && t.status === 'done'
        ).length,
        total: tasks.filter((t) => t.projectId === p.id).length,
      })),
    [projects, tasks]
  );

  const value: DataContextValue = {
    users,
    projects,
    tasks,
    activities,
    clients,
    currentUser,
    loading,
    error,
    retry,
    simulateError,
    toggleTaskComplete,
    updateTaskStatus,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    addClient,
    updateClient,
    deleteClient,
    updateProfile,
    getUser,
    getProject,
    getClient,
    getTasksByProject,
    getProjectProgress,
    getProjectsByClient,
    getProductivityTrend,
    stats,
    statusDistribution,
    priorityDistribution,
    completionByProject,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
