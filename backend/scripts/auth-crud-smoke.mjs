import { strict as assert } from 'node:assert';

const base = 'http://localhost:4000/api';
let cookie = '';
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}), ...(cookie ? { cookie } : {}) },
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const body = response.status === 204 ? null : await response.json();
  assert.ok(response.ok, `${response.status}: ${JSON.stringify(body)}`);
  return body?.data;
}
const email = `api-integration-${Date.now()}@example.com`;
const user = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'API Integration', email, password: 'correct-horse-battery' }) });
const project = await request('/projects', { method: 'POST', body: JSON.stringify({ name: 'API Project', description: 'integration', ownerId: user.id, dueDate: null }) });
const task = await request('/tasks', { method: 'POST', body: JSON.stringify({ title: 'API Task', projectId: project.id, assigneeId: user.id, status: 'IN_REVIEW', priority: 'HIGH', dueDate: null }) });
const moved = await request(`/tasks/${task.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'DONE' }) });
assert.equal(moved.status, 'DONE');
const edited = await request(`/projects/${project.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'API Project Updated' }) });
assert.equal(edited.name, 'API Project Updated');
await request(`/tasks/${task.id}`, { method: 'DELETE' });
await request(`/projects/${project.id}`, { method: 'DELETE' });
console.log('CRUD smoke test passed:', { userId: user.id, projectId: project.id, taskId: task.id });
