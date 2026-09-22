// End-to-end persistence test for the DevFlow API.
//
// Run with `npm run test:persistence` (builds first). It uses a throwaway SQLite
// database (prisma/persistence-test.db) so your development data is not touched:
//
//   1. creates the database from the committed migrations (`prisma migrate deploy`)
//   2. starts the compiled server and creates / reads / updates data through the API
//   3. stops the server, starts it again, and checks the data is still there
//   4. deletes the data, restarts once more, and checks it is still gone
//
// Optional environment variables: TEST_PORT (default 4100), KEEP_TEST_DB=1 (keep the file).

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.TEST_PORT ?? '4100';
const DB_NAME = 'persistence-test.db'; // created inside backend/prisma/
const BASE = `http://127.0.0.1:${PORT}/api`;

const childEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT,
  DATABASE_URL: `file:./${DB_NAME}`,
  FRONTEND_ORIGIN: 'http://localhost:3000',
};

let passed = 0;
let server;

// ---------- helpers ----------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function removeTestDb() {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    rmSync(path.join(backendDir, 'prisma', DB_NAME + suffix), { force: true });
  }
}

async function api(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, body: json, headers: res.headers };
}

async function check(name, fn) {
  try {
    await fn();
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    throw err;
  }
  passed += 1;
  console.log(`  ok    ${name}`);
}

async function isServerUp() {
  try {
    return (await fetch(`${BASE}/health`)).ok;
  } catch {
    return false;
  }
}

async function startServer() {
  if (await isServerUp()) {
    throw new Error(`Something is already listening on port ${PORT}. Set TEST_PORT to a free port.`);
  }
  const distEntry = path.join(backendDir, 'dist', 'server.js');
  if (!existsSync(distEntry)) throw new Error('dist/server.js not found. Run `npm run build` first.');

  let output = '';
  let exited = false;
  const child = spawn(process.execPath, [distEntry], {
    cwd: backendDir,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => (output += chunk));
  child.stderr.on('data', (chunk) => (output += chunk));
  child.once('exit', () => (exited = true));

  for (let i = 0; i < 80; i += 1) {
    if (exited) throw new Error(`Server exited during startup:\n${output}`);
    if (await isServerUp()) {
      server = child;
      return;
    }
    await sleep(250);
  }
  child.kill('SIGKILL');
  throw new Error(`Server did not become healthy in 20s:\n${output}`);
}

async function stopServer() {
  const child = server;
  if (!child) return;
  server = undefined;
  if (child.exitCode !== null) return;
  await new Promise((resolve) => {
    const timer = setTimeout(() => child.kill('SIGKILL'), 15_000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM'); // graceful shutdown; can take a few seconds for idle connections
  });
}

async function restartServer() {
  await stopServer();
  await startServer();
}

function migrateDatabase() {
  const prismaCli = path.join(backendDir, 'node_modules', 'prisma', 'build', 'index.js');
  if (!existsSync(prismaCli)) throw new Error('Prisma CLI not found. Run `npm install` first.');
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: backendDir,
    env: childEnv,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('`prisma migrate deploy` failed');
}

// ---------- the test ----------

async function main() {
  console.log(`\nDevFlow persistence test (port ${PORT}, database prisma/${DB_NAME})\n`);

  console.log('Setup: creating a fresh database from the migrations');
  removeTestDb();
  migrateDatabase();

  await startServer();

  const emailA = 'persist.a@devflow.test';
  const emailB = 'persist.b@devflow.test';
  const ids = {};

  console.log('\n1. Create data through the API');

  await check('GET /health returns 200', async () => {
    const res = await api('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  await check('POST /users creates user A (201 + Location)', async () => {
    const res = await api('POST', '/users', { name: 'Persist Tester A', email: emailA });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.email, emailA);
    assert.equal(res.headers.get('location'), `/api/users/${res.body.data.id}`);
    ids.userA = res.body.data.id;
  });

  await check('POST /users creates user B', async () => {
    const res = await api('POST', '/users', { name: 'Persist Tester B', email: emailB });
    assert.equal(res.status, 201);
    ids.userB = res.body.data.id;
  });

  await check('duplicate email is rejected with 409 (also when the case differs)', async () => {
    for (const email of [emailA, emailA.toUpperCase()]) {
      const res = await api('POST', '/users', { name: 'Duplicate', email });
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'CONFLICT');
    }
  });

  await check('POST /projects creates a project owned by user A', async () => {
    const res = await api('POST', '/projects', {
      name: 'Persistence Project',
      description: 'Created by the persistence test',
      ownerId: ids.userA,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.ownerId, ids.userA);
    assert.equal(res.body.data.owner.email, emailA);
    assert.equal(res.body.data.taskCount, 0);
    ids.project = res.body.data.id;
  });

  await check('project with an unknown owner is rejected with 400', async () => {
    const res = await api('POST', '/projects', {
      name: 'Orphan',
      ownerId: '00000000-0000-4000-8000-000000000000',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.details[0].path, 'ownerId');
  });

  await check('POST /tasks creates a task assigned to user B (defaults applied)', async () => {
    const res = await api('POST', '/tasks', {
      title: 'First task',
      projectId: ids.project,
      assigneeId: ids.userB,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'TODO');
    assert.equal(res.body.data.priority, 'MEDIUM');
    assert.equal(res.body.data.assignee.id, ids.userB);
    ids.task1 = res.body.data.id;
  });

  await check('POST /tasks creates a second, unassigned task', async () => {
    const res = await api('POST', '/tasks', {
      title: 'Second task',
      projectId: ids.project,
      priority: 'HIGH',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.assigneeId, null);
    ids.task2 = res.body.data.id;
  });

  await check('task with an unknown project is rejected with 400', async () => {
    const res = await api('POST', '/tasks', {
      title: 'Orphan task',
      projectId: '00000000-0000-4000-8000-000000000000',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.details[0].path, 'projectId');
  });

  console.log('\n2. Retrieve it');

  await check('GET /users/:id and GET /users include the users', async () => {
    const one = await api('GET', `/users/${ids.userA}`);
    assert.equal(one.status, 200);
    assert.equal(one.body.data.name, 'Persist Tester A');
    const list = await api('GET', '/users');
    assert.equal(list.status, 200);
    assert.ok(list.body.data.some((u) => u.id === ids.userB));
  });

  await check('GET /projects/:id returns the project with its 2 tasks', async () => {
    const res = await api('GET', `/projects/${ids.project}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.taskCount, 2);
    assert.equal(res.body.data.tasks.length, 2);
  });

  await check('GET /tasks?projectId= filters correctly', async () => {
    const res = await api('GET', `/tasks?projectId=${ids.project}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.meta.total, 2);
  });

  console.log('\n3. Update it');

  await check('PATCH /users/:id renames the user', async () => {
    const res = await api('PATCH', `/users/${ids.userA}`, { name: 'Persist Tester A (updated)' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Persist Tester A (updated)');
  });

  await check('PATCH /projects/:id changes description and due date', async () => {
    const res = await api('PATCH', `/projects/${ids.project}`, {
      description: 'Updated description',
      dueDate: '2026-12-31',
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.dueDate, '2026-12-31T00:00:00.000Z');
  });

  await check('PATCH /tasks/:id changes title and priority', async () => {
    const res = await api('PATCH', `/tasks/${ids.task1}`, { title: 'First task (updated)', priority: 'LOW' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.priority, 'LOW');
  });

  await check('PATCH /tasks/:id/status moves the task to DONE', async () => {
    const res = await api('PATCH', `/tasks/${ids.task1}/status`, { status: 'DONE' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'DONE');
  });

  await check('invalid status -> 400, malformed id -> 400, unknown id -> 404', async () => {
    const badStatus = await api('PATCH', `/tasks/${ids.task1}/status`, { status: 'BLOCKED' });
    assert.equal(badStatus.status, 400);
    const badId = await api('GET', '/tasks/not-a-uuid');
    assert.equal(badId.status, 400);
    const missing = await api('GET', '/tasks/00000000-0000-4000-8000-000000000000');
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'TASK_NOT_FOUND');
  });

  console.log('\n4. Restart the backend: the data must still be there');

  await restartServer();

  await check('users survived the restart, including the update', async () => {
    const a = await api('GET', `/users/${ids.userA}`);
    assert.equal(a.status, 200);
    assert.equal(a.body.data.name, 'Persist Tester A (updated)');
    assert.equal(a.body.data.email, emailA);
    const b = await api('GET', `/users/${ids.userB}`);
    assert.equal(b.status, 200);
  });

  await check('project survived with its updates, owner and both tasks', async () => {
    const res = await api('GET', `/projects/${ids.project}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.description, 'Updated description');
    assert.equal(res.body.data.dueDate, '2026-12-31T00:00:00.000Z');
    assert.equal(res.body.data.owner.id, ids.userA);
    assert.equal(res.body.data.taskCount, 2);
  });

  await check('tasks survived with status, priority and assignee', async () => {
    const t1 = await api('GET', `/tasks/${ids.task1}`);
    assert.equal(t1.status, 200);
    assert.equal(t1.body.data.title, 'First task (updated)');
    assert.equal(t1.body.data.status, 'DONE');
    assert.equal(t1.body.data.priority, 'LOW');
    assert.equal(t1.body.data.assignee.id, ids.userB);
    const t2 = await api('GET', `/tasks/${ids.task2}`);
    assert.equal(t2.status, 200);
    assert.equal(t2.body.data.priority, 'HIGH');
  });

  console.log('\n5. Delete it');

  await check('DELETE /tasks/:id removes a task', async () => {
    const del = await api('DELETE', `/tasks/${ids.task2}`);
    assert.equal(del.status, 200);
    assert.equal(del.body.data.id, ids.task2);
    assert.equal((await api('GET', `/tasks/${ids.task2}`)).status, 404);
  });

  await check('DELETE /users/:id keeps the task and clears assigneeId', async () => {
    const del = await api('DELETE', `/users/${ids.userB}`);
    assert.equal(del.status, 200);
    assert.equal((await api('GET', `/users/${ids.userB}`)).status, 404);
    const task = await api('GET', `/tasks/${ids.task1}`);
    assert.equal(task.status, 200);
    assert.equal(task.body.data.assigneeId, null);
  });

  await check('DELETE /users/:id keeps the project and clears ownerId', async () => {
    const del = await api('DELETE', `/users/${ids.userA}`);
    assert.equal(del.status, 200);
    const project = await api('GET', `/projects/${ids.project}`);
    assert.equal(project.status, 200);
    assert.equal(project.body.data.ownerId, null);
    assert.equal(project.body.data.owner, null);
  });

  await check('DELETE /projects/:id also deletes its remaining tasks', async () => {
    const del = await api('DELETE', `/projects/${ids.project}`);
    assert.equal(del.status, 200);
    assert.equal((await api('GET', `/projects/${ids.project}`)).status, 404);
    assert.equal((await api('GET', `/tasks/${ids.task1}`)).status, 404);
  });

  console.log('\n6. Restart again: deleted data must stay deleted');

  await restartServer();

  await check('nothing that was deleted came back', async () => {
    for (const url of [
      `/users/${ids.userA}`,
      `/users/${ids.userB}`,
      `/projects/${ids.project}`,
      `/tasks/${ids.task1}`,
      `/tasks/${ids.task2}`,
    ]) {
      assert.equal((await api('GET', url)).status, 404, `${url} should be gone`);
    }
    const users = await api('GET', '/users');
    assert.equal(users.body.meta.total, 0);
  });
}

let failed = false;
try {
  await main();
} catch (err) {
  failed = true;
  console.error(`\n${err?.stack ?? err}`);
} finally {
  await stopServer();
  if (process.env.KEEP_TEST_DB !== '1') removeTestDb();
}

if (failed) {
  console.error(`\nPERSISTENCE TEST FAILED (${passed} checks passed before the failure)\n`);
  process.exit(1);
}
console.log(`\nPERSISTENCE TEST PASSED: ${passed} checks\n`);
