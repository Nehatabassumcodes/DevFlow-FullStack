// Full-stack integration test for Task 4 (AI-assisted task generation).
//
// Exercises the whole chain: Frontend (simulated by these HTTP calls, using the same
// contract lib/api.ts uses) -> API (Express routes) -> Backend (controllers/services) ->
// Database (Prisma/SQLite) -> AI (Google Gemini API).
//
// The real Gemini API is never called: a tiny local HTTP server stands in for it and speaks
// the same wire format (a `functionCall` part named `submit_tasks`), so GEMINI_API_KEY/
// GEMINI_BASE_URL point at localhost. This proves the plumbing end-to-end without needing
// real credentials or network access, and without spending money on every test run.
//
// Run with `npm run test:ai` (builds first). Uses a throwaway SQLite database
// (prisma/ai-test.db) so development data is not touched. Optional env vars: TEST_PORT
// (default 4200), MOCK_AI_PORT (default 4201), KEEP_TEST_DB=1.

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.TEST_PORT ?? '4200';
const MOCK_AI_PORT = process.env.MOCK_AI_PORT ?? '4201';
const DB_NAME = 'ai-test.db';
const BASE = `http://127.0.0.1:${PORT}/api`;

let cookie = '';
let passed = 0;
let server;
let mockAiServer;
let mockAiCalls = [];
let mockAiResponder = defaultMockResponder;

const childEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT,
  DATABASE_URL: `file:./${DB_NAME}`,
  FRONTEND_ORIGIN: 'http://localhost:3000',
  GEMINI_API_KEY: 'test-mock-key-not-real',
  GEMINI_BASE_URL: `http://127.0.0.1:${MOCK_AI_PORT}`,
  GEMINI_MODEL: 'gemini-3.1-flash-lite',
};

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
    headers: {
      ...(body === undefined ? undefined : { 'Content-Type': 'application/json' }),
      ...(cookie ? { cookie } : undefined),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
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
    child.kill('SIGTERM');
  });
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

// ---------- mock AI provider ----------
// Speaks just enough of POST /v1beta/models/{model}:generateContent to exercise
// services/ai.service.ts: a JSON body with a `functionCall` part named `submit_tasks`, whose
// `args.tasks` is the array the service parses. `mockAiResponder(requestBody)` decides what
// comes back for each test.

function defaultMockResponder() {
  return {
    status: 200,
    body: {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'submit_tasks',
                  args: {
                    tasks: [
                      { title: 'Design database schema for comments', description: 'Model comments, replies and authorship.', priority: 'HIGH' },
                      { title: 'Build POST /comments endpoint', description: 'Validate input and persist a new comment.', priority: 'HIGH' },
                      { title: 'Render comment thread in the UI', description: 'Show nested replies with author and timestamp.', priority: 'MEDIUM' },
                      // Deliberately duplicates an existing task title (different case/spacing) to
                      // prove the service's de-duplication against existingTitles.
                      { title: '  Seed Initial Project Data  ', description: 'Should be filtered out as a duplicate.', priority: 'LOW' },
                    ],
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function startMockAiServer() {
  mockAiServer = createServer((req, res) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      let parsed = {};
      try {
        parsed = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      } catch {
        // ignore - responder can still run with an empty body
      }
      mockAiCalls.push({ path: req.url, method: req.method, headers: req.headers, body: parsed });
      const { status, body } = mockAiResponder(parsed);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  await new Promise((resolve) => mockAiServer.listen(Number(MOCK_AI_PORT), '127.0.0.1', resolve));
}

async function stopMockAiServer() {
  if (!mockAiServer) return;
  await new Promise((resolve) => mockAiServer.close(resolve));
  mockAiServer = undefined;
}

// ---------- the test ----------

async function main() {
  console.log(`\nDevFlow AI task-generation integration test (port ${PORT}, mock AI on ${MOCK_AI_PORT})\n`);

  console.log('Setup: fresh database + mock AI provider + server (Frontend -> API -> Backend -> Database -> AI)');
  removeTestDb();
  migrateDatabase();
  await startMockAiServer();
  await startServer();

  const email = `ai-integration-${Date.now()}@devflow.test`;
  const ids = {};

  console.log('\n1. Auth + fixtures (project the tasks will be generated for)');

  await check('POST /auth/register creates and signs in a user', async () => {
    const res = await api('POST', '/auth/register', { name: 'AI Integration', email, password: 'correct-horse-battery' });
    assert.equal(res.status, 201);
    assert.ok(cookie, 'expected a session cookie to be set');
    ids.userId = res.body.data.id;
  });

  await check('POST /projects creates the target project', async () => {
    const res = await api('POST', '/projects', { name: 'Comments Feature', description: 'Threaded comments for posts', ownerId: ids.userId });
    assert.equal(res.status, 201);
    ids.projectId = res.body.data.id;
  });

  await check('POST /tasks seeds one existing task (for de-duplication)', async () => {
    const res = await api('POST', '/tasks', { title: 'Seed initial project data', projectId: ids.projectId, priority: 'LOW' });
    assert.equal(res.status, 201);
    ids.seedTaskId = res.body.data.id;
  });

  console.log('\n2. Unauthenticated / validation / configuration guards');

  await check('POST /ai/generate-tasks without a session returns 401', async () => {
    const savedCookie = cookie;
    cookie = '';
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'Add threaded comments with replies and moderation.' });
    assert.equal(res.status, 401);
    cookie = savedCookie;
  });

  await check('POST /ai/generate-tasks rejects a too-short description with 400', async () => {
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'short' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  await check('POST /ai/generate-tasks rejects an unknown projectId with 400', async () => {
    const res = await api('POST', '/ai/generate-tasks', {
      projectId: '00000000-0000-4000-8000-000000000000',
      description: 'Add threaded comments with replies and moderation.',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.details[0].path, 'projectId');
  });

  console.log('\n3. Happy path: generate -> review -> save (AI never writes to the database)');

  let suggestions;
  await check('POST /ai/generate-tasks returns suggestions built from the mock AI response', async () => {
    mockAiCalls = [];
    mockAiResponder = defaultMockResponder;
    const res = await api('POST', '/ai/generate-tasks', {
      projectId: ids.projectId,
      description: 'Add threaded comments to posts: users can reply to a comment, and moderators can delete abusive ones.',
    });
    assert.equal(res.status, 200);
    suggestions = res.body.data.tasks;
    assert.ok(Array.isArray(suggestions) && suggestions.length > 0, 'expected at least one suggestion');
    for (const task of suggestions) {
      assert.equal(typeof task.title, 'string');
      assert.ok(task.title.length > 0);
      assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(task.priority));
    }
  });

  await check('the AI request carried project context and the existing task title', async () => {
    assert.equal(mockAiCalls.length, 1);
    assert.equal(mockAiCalls[0].path, '/v1beta/models/gemini-3.1-flash-lite:generateContent');
    const sent = mockAiCalls[0].body;
    assert.equal(mockAiCalls[0].headers['x-goog-api-key'], 'test-mock-key-not-real');
    const userMessage = sent.contents?.[0]?.parts?.[0]?.text ?? '';
    assert.ok(userMessage.includes('Comments Feature'), 'expected the project name in the prompt');
    assert.ok(userMessage.includes('Seed initial project data'), 'expected the existing task title in the prompt');
  });

  await check('the duplicate-titled suggestion was filtered out server-side', async () => {
    const titles = suggestions.map((t) => t.title.toLowerCase());
    assert.ok(!titles.includes('seed initial project data'), 'duplicate of the existing task should have been dropped');
  });

  await check('nothing was written to the database by generation alone (review-before-save)', async () => {
    const res = await api('GET', `/tasks?projectId=${ids.projectId}`);
    assert.equal(res.body.meta.total, 1, 'only the seed task should exist before any suggestion is accepted');
  });

  await check('accepting a suggestion saves it through the normal task endpoint', async () => {
    const accepted = suggestions[0];
    const res = await api('POST', '/tasks', {
      title: accepted.title,
      description: accepted.description || undefined,
      projectId: ids.projectId,
      priority: accepted.priority,
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.title, accepted.title);
    assert.equal(res.body.data.priority, accepted.priority);
    ids.savedTaskId = res.body.data.id;
  });

  await check('the saved task is integrated with the existing Task system (shows up under the project, via GET)', async () => {
    const res = await api('GET', `/projects/${ids.projectId}`);
    assert.equal(res.status, 200);
    const taskIds = res.body.data.tasks.map((t) => t.id);
    assert.ok(taskIds.includes(ids.savedTaskId));
    assert.ok(taskIds.includes(ids.seedTaskId));
    assert.equal(res.body.data.taskCount, 2);
  });

  console.log('\n4. Provider failure handling (errors surface as clean API errors, not crashes)');

  await check('a malformed provider response (no functionCall part) surfaces as 502 AI_BAD_RESPONSE', async () => {
    mockAiResponder = () => ({
      status: 200,
      body: { candidates: [{ content: { role: 'model', parts: [{ text: 'not a function call' }] } }] },
    });
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'Add a feature that has nothing useful to say.' });
    assert.equal(res.status, 502);
    assert.equal(res.body.error.code, 'AI_BAD_RESPONSE');
  });

  await check('an upstream 500 surfaces as 503 AI_UNAVAILABLE', async () => {
    mockAiResponder = () => ({ status: 500, body: { error: 'boom' } });
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'Add a feature while the AI provider is down.' });
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'AI_UNAVAILABLE');
  });

  await check('an upstream 401 (bad server credentials) surfaces as 502 AI_PROVIDER_ERROR, never the key', async () => {
    mockAiResponder = () => ({ status: 401, body: { error: { message: 'API key not valid. Please pass a valid API key.' } } });
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'Add a feature while credentials are misconfigured.' });
    assert.equal(res.status, 502);
    assert.equal(res.body.error.code, 'AI_PROVIDER_ERROR');
    assert.ok(!JSON.stringify(res.body).includes('test-mock-key-not-real'), 'the API key must never appear in a response');
  });

  await check('an upstream 429 surfaces as 429 AI_RATE_LIMITED', async () => {
    mockAiResponder = () => ({ status: 429, body: { error: 'slow down' } });
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'Add a feature while the AI provider is rate limiting us.' });
    assert.equal(res.status, 429);
    assert.equal(res.body.error.code, 'AI_RATE_LIMITED');
  });

  mockAiResponder = defaultMockResponder;

  console.log('\n5. Per-user rate limiting on the endpoint itself');

  await check('the 11th generation request within a minute is rejected with 429 RATE_LIMITED', async () => {
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: `Rate limit probe request number ${i}, long enough to pass validation.` });
    }
    assert.equal(last.status, 429);
    assert.equal(last.body.error.code, 'RATE_LIMITED');
  });

  console.log('\n6. Key never reaches the client');

  await check('the generate-tasks response never contains the AI API key', async () => {
    mockAiResponder = defaultMockResponder;
    // New user to dodge the rate limit bucket exhausted above.
    cookie = '';
    await api('POST', '/auth/register', { name: 'AI Integration 2', email: `ai-integration-2-${Date.now()}@devflow.test`, password: 'correct-horse-battery' });
    const res = await api('POST', '/ai/generate-tasks', { projectId: ids.projectId, description: 'One more generation to inspect the raw response body.' });
    assert.equal(res.status, 200);
    assert.ok(!JSON.stringify(res.body).includes('test-mock-key-not-real'));
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
  await stopMockAiServer();
  if (process.env.KEEP_TEST_DB !== '1') removeTestDb();
}

if (failed) {
  console.error(`\nAI INTEGRATION TEST FAILED (${passed} checks passed before the failure)\n`);
  process.exit(1);
}
console.log(`\nAI INTEGRATION TEST PASSED: ${passed} checks\n`);
