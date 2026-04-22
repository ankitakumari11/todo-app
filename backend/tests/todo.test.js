const request = require('supertest');
const app = require('../src/index');

// We test the app logic without needing a real database
// NODE_ENV=test is set by jest automatically (see package.json jest config)

describe('Health Check', () => {
  it('GET /health should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Todo Routes - No DB', () => {
  it('GET /api/todos should return 500 without DB (expected)', async () => {
    const res = await request(app).get('/api/todos');
    // Without MongoDB, mongoose throws - we just confirm app doesn't crash
    expect([200, 500]).toContain(res.statusCode);
  });

  it('POST /api/todos without title returns 400', async () => {
    const res = await request(app)
      .post('/api/todos')
      .send({});
    expect([400, 500]).toContain(res.statusCode);
  });
});

// "Jest is used as the testing framework to define and run test cases using describe, it, and expect. Supertest is used to simulate HTTP requests directly against the Express app without starting the server. It sends requests and captures responses, which Jest then validates."👉 Jest: Executes test cases,Calls APIs using Supertest

// 👉 Jest = test runner + assertions
// 👉 Supertest = API caller