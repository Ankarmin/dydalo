// E2E Fase 3: flujo auth con cookies + CRUD de direcciones.
// Usa la DB local real (`dydalo`) con emails `e2e+*` y limpieza al final.
// Correr con: `pnpm --filter api test:e2e` (DB levantada: `db:up`).

import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

const prisma = new PrismaClient();
const stamp = Date.now();
const email = `e2e+${stamp}@dydalo.test`;
const password = 'E2eTest123';

// supertest tipa `body` como any: castear una vez por respuesta para
// que el lint type-checked no grite en cada acceso.
type Json = Record<string, unknown>;
const json = (res: request.Response): Json => res.body as Json;

describe('Auth + Addresses (e2e)', () => {
  let app: Awaited<ReturnType<TestingModule['createNestApplication']>>;
  let agent: request.Agent;
  // getHttpServer() se tipa como any: castear una vez aquí.
  const anon = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    agent = request.agent(app.getHttpServer() as App);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'e2e+' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /auth/register crea customer y setea cookie httpOnly', async () => {
    const res = await agent.post('/auth/register').send({
      firstName: 'E2e',
      lastName: 'Tester',
      email,
      phone: '999888777',
      password,
    });
    expect(res.status).toBe(201);
    expect(json(res).email).toBe(email);
    expect(json(res).role).toBe('customer');
    expect(json(res).passwordHash).toBeUndefined();
    const cookies = [res.headers['set-cookie']].flat().join(';');
    expect(cookies).toMatch(/access_token=.*;.*HttpOnly/i);
  });

  it('POST /auth/register duplicado → 409', async () => {
    const res = await anon().post('/auth/register').send({
      firstName: 'E2e',
      lastName: 'Tester',
      email,
      phone: '999888777',
      password,
    });
    expect(res.status).toBe(409);
  });

  it('POST /auth/register con email inválido → 400', async () => {
    const res = await anon().post('/auth/register').send({
      firstName: 'E2e',
      lastName: 'Tester',
      email: 'no-es-email',
      phone: '999888777',
      password,
    });
    expect(res.status).toBe(400);
  });

  it('GET /auth/me sin cookie → 401', async () => {
    const res = await anon().get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /auth/login con clave errónea → 401', async () => {
    const res = await anon()
      .post('/auth/login')
      .send({ email, password: 'Wrong1234' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login OK + GET /auth/me con cookie → 200', async () => {
    const login = await agent.post('/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(json(login).role).toBe('customer');
    const me = await agent.get('/auth/me');
    expect(me.status).toBe(200);
    expect(json(me).email).toBe(email);
  });

  it('CRUD /addresses exige sesión y respeta default', async () => {
    const anonRes = await anon().get('/addresses');
    expect(anonRes.status).toBe(401);

    const base = {
      label: 'Casa',
      fullName: 'E2e Tester',
      street: 'Av. Prueba 123',
      district: 'Miraflores',
      city: 'Lima',
      state: 'Lima',
      phone: '999888777',
    };
    const created = await agent.post('/addresses').send(base);
    expect(created.status).toBe(201);
    // Primera dirección: default automática.
    expect(json(created).isDefault).toBe(true);

    const second = await agent
      .post('/addresses')
      .send({ ...base, label: 'Oficina' });
    expect(second.status).toBe(201);
    expect(json(second).isDefault).toBe(false);

    const secondId = (second.body as { id: string }).id;
    const promoted = await agent.post(`/addresses/${secondId}/default`);
    expect(promoted.status).toBe(201);
    expect(json(promoted).isDefault).toBe(true);

    const list = await agent.get('/addresses');
    expect(list.status).toBe(200);
    const items = list.body as Array<{ isDefault: boolean }>;
    expect(items).toHaveLength(2);
    expect(items.filter((a) => a.isDefault)).toHaveLength(1);
  });

  it('POST /auth/logout limpia la cookie', async () => {
    const logout = await agent.post('/auth/logout');
    expect(logout.status).toBe(200);
    const me = await agent.get('/auth/me');
    expect(me.status).toBe(401);
  });
});
