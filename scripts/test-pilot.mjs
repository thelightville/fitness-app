import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import test from 'node:test';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const origin = new URL(process.env.FITNESS_FIXTURE_ORIGIN);
const database = new URL(process.env.DATABASE_URL);
assert.equal(origin.origin, 'http://127.0.0.1:3100');
assert.equal(database.host, '127.0.0.1:55447');
assert.equal(database.pathname, '/fitnessfixture');
assert.equal(database.username, 'fitnessfixture');
const db = new PrismaClient();
const password = `Fixture-only-${randomUUID()}`;
const runId = randomUUID();

async function request(path, { method = 'GET', body, auth, expected = 200 } = {}) {
  const response = await fetch(new URL(path, origin), {
    method,
    redirect: 'manual',
    headers: { ...(auth?.Cookie && { Cookie: auth.Cookie }),
      ...(auth?.Authorization && { Authorization: auth.Authorization }), ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });
  const content = await response.text();
  assert.equal(response.status, expected, `${method} ${path}: ${content.slice(0, 300)}`);
  return response.headers.get('content-type')?.includes('application/json') ? JSON.parse(content) : content;
}

async function webLogin(email) {
  const csrfResponse = await fetch(new URL('/api/auth/csrf', origin));
  const { csrfToken } = await csrfResponse.json();
  const csrfCookie = csrfResponse.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
  const response = await fetch(new URL('/api/auth/callback/credentials', origin), {
    method: 'POST', redirect: 'manual', headers: { Cookie: csrfCookie },
    body: new URLSearchParams({ email, password, csrfToken, callbackUrl: origin.href }),
  });
  const cookie = response.headers.getSetCookie().find((value) => /authjs\.session-token=/.test(value));
  assert.ok(cookie, `Web sign-in returned ${response.status} without a session cookie`);
  return { Cookie: cookie.split(';')[0] };
}

async function mobileLogin(email, expected = 200) {
  const session = await request('/api/mobile/auth/login', { method: 'POST', body: { email, password }, expected });
  return { Authorization: `Bearer ${session.accessToken}`, refreshToken: session.refreshToken };
}

async function fixtureUser(name, role, profile) {
  const email = `${name}.${runId}@example.test`;
  return db.user.create({
    data: { name, email, role, password: await bcrypt.hash(password, 4), ...profile },
    include: { client: true, trainer: true },
  });
}

function slot(offset) {
  const starts = Date.now() + offset * 3600000;
  return { startsAt: new Date(starts).toISOString(), endsAt: new Date(starts + 3600000).toISOString() };
}

test('pilot role boundaries and booking lifecycle through the built server', async (t) => {
  t.after(() => db.$disconnect());
  for (let attempt = 0; attempt < 45; attempt++) {
    try {
      if ((await fetch(new URL('/api/health', origin))).ok) break;
    } catch { /* Server is still starting. */ }
    await sleep(1000);
  }
  assert.equal((await request('/api/health')).database, 'connected');
  assert.match(await request('/'), /Fitness PT Tracker/);
  const registerPage = await request('/register');
  assert.match(registerPage, /Create your account/);
  assert.doesNotMatch(registerPage, /<option[^>]*value="TRAINER"/);
  await request('/api/clients', { expected: 401 });
  await request('/api/mobile/clients', { expected: 401 });

  const newUser = { email: `new.${runId}@example.test`, name: 'New client', password };
  await request('/api/register', { method: 'POST', body: { ...newUser, role: 'TRAINER' }, expected: 400 });
  assert.equal((await request('/api/register', { method: 'POST', body: newUser, expected: 201 })).role, 'CLIENT');

  const [admin, client, other, approved, legacy] = await Promise.all([
    fixtureUser('admin', 'ADMIN'),
    fixtureUser('client', 'CLIENT', { client: { create: {} } }),
    fixtureUser('other', 'CLIENT', { client: { create: {} } }),
    fixtureUser('approved', 'TRAINER', { trainer: { create: { approvedAt: new Date(), specialties: [] } } }),
    fixtureUser('legacy', 'TRAINER', { trainer: { create: { specialties: [] } } }),
  ]);
  const gym = await db.gymLocation.create({ data: { name: `Fixture studio ${runId}`, latitude: 43.65, longitude: -79.38 } });
  const adminWeb = await webLogin(admin.email);
  const trainerWeb = await webLogin(approved.email);
  const clientWeb = await webLogin(client.email);
  const trainerMobile = await mobileLogin(approved.email);
  await mobileLogin(legacy.email, 401);
  await assert.rejects(webLogin(legacy.email), /without a session cookie/);
  const adminUsers = await request('/api/admin/users', { auth: adminWeb });
  assert.ok(adminUsers.some(({ id }) => id === legacy.id));
  assert.ok(adminUsers.every((user) => !Object.hasOwn(user, 'password')));

  const manageTrainer = `/api/admin/users/${approved.id}`;
  const ids = (rows) => rows.map(({ id }) => id);
  const foreign = await db.appointment.create({ data: {
    clientId: other.client.id, trainerId: approved.trainer.id, gymLocationId: gym.id, ...slot(30), status: 'CONFIRMED',
  } });
  await request(manageTrainer, { method: 'PATCH', auth: trainerWeb, body: { trainerClientIds: [other.client.id] }, expected: 403 });
  assert.deepEqual(ids(await request('/api/clients', { auth: trainerWeb })), []);
  await request(`/api/appointments/${foreign.id}`, { auth: trainerWeb, expected: 403 });
  await request(`/api/mobile/appointments/${foreign.id}`, { auth: trainerMobile, expected: 403 });
  await request(manageTrainer, { method: 'PATCH', auth: adminWeb, body: { trainerClientIds: [client.client.id] } });
  assert.deepEqual(ids(await request('/api/clients', { auth: trainerWeb })), [client.client.id]);
  assert.deepEqual(ids(await request('/api/mobile/clients', { auth: trainerMobile })), [client.client.id]);
  assert.deepEqual(ids(await request('/api/trainers', { auth: clientWeb })), [approved.trainer.id]);

  const booking = { gymLocationId: gym.id, ...slot(24) };
  for (const [path, auth] of [['/api/appointments', trainerWeb], ['/api/mobile/appointments', trainerMobile]]) {
    await request(path, { method: 'POST', auth, body: { ...booking, clientId: other.client.id }, expected: 404 });
  }
  await request(`/api/clients/${other.client.id}/measurements`, { method: 'POST', auth: trainerWeb, body: { weightKg: 72 }, expected: 403 });
  await request(`/api/mobile/progress?clientId=${other.client.id}`, { auth: trainerMobile, expected: 404 });
  for (const [path, auth] of [['/api/appointments', trainerWeb], ['/api/mobile/appointments', trainerMobile]]) {
    await request(`${path}/${foreign.id}/checkin`, { method: 'POST', auth, body: { manual: true, latitude: 0, longitude: 0 }, expected: 403 });
    await request(`${path}/${foreign.id}/workout`, { method: 'POST', auth, body: { workoutType: 'STRENGTH', durationMinutes: 45 }, expected: 403 });
  }

  const appointment = await request('/api/appointments', { method: 'POST', auth: clientWeb, body: { ...booking, trainerId: approved.trainer.id }, expected: 201 });
  assert.equal(appointment.status, 'PENDING');
  const appointmentPath = `/api/appointments/${appointment.id}`;
  const confirmed = await request(appointmentPath, { method: 'PATCH', auth: trainerWeb, body: { status: 'CONFIRMED', ...slot(26) } });
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.ok(Array.isArray(confirmed.checkIns));
  assert.ok(Array.isArray(confirmed.auditLogs));
  assert.equal((await request(appointmentPath, { auth: clientWeb })).startsAt, confirmed.startsAt);
  assert.match(await request('/dashboard', { auth: trainerWeb }), /Record measurements|Recent client progress/);
  assert.equal((await request('/api/mobile/appointments', { method: 'POST', auth: trainerMobile,
    body: { ...booking, ...slot(40), clientId: client.client.id }, expected: 201 })).status, 'CONFIRMED');
  assert.equal((await request(`/api/clients/${client.client.id}/measurements`, { method: 'POST', auth: trainerWeb,
    body: { weightKg: 72, bodyFatPct: 0 }, expected: 201 })).bodyFatPct, 0);
  const clientMobile = await mobileLogin(client.email);
  assert.equal((await request('/api/mobile/progress', { auth: clientMobile })).latestMeasurement.weightKg, 72);

  await request(manageTrainer, { method: 'PATCH', auth: adminWeb, body: { trainerClientIds: [] } });
  assert.deepEqual(await request('/api/mobile/clients', { auth: trainerMobile }), []);
  await request(appointmentPath, { auth: trainerWeb, expected: 403 });
  await request(manageTrainer, { method: 'PATCH', auth: adminWeb, body: { trainerApproved: false } });
  await request('/api/clients', { auth: trainerWeb, expected: 401 });
  await request('/api/mobile/clients', { auth: trainerMobile, expected: 401 });
  await request('/api/mobile/auth/refresh', { method: 'POST', body: { refreshToken: trainerMobile.refreshToken }, expected: 401 });
  await request(manageTrainer, { method: 'PATCH', auth: adminWeb, body: { trainerApproved: true, trainerClientIds: [client.client.id] } });
  await request('/api/clients', { auth: trainerWeb, expected: 401 });
  await request('/api/mobile/clients', { auth: trainerMobile, expected: 401 });
  assert.deepEqual(ids(await request('/api/mobile/clients', { auth: await mobileLogin(approved.email) })), [client.client.id]);
});
