const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');

const mockUser = {
  firstName: 'demo',
  lastName: 'user',
  email: 'demo@test.com',
  password: '123456',
};

describe('backend-express-template routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  it('creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { firstName, lastName, email } = mockUser;

    expect(res.body).toEqual({
      id: expect.any(String),
      firstName,
      lastName,
      email,
    });
  });

  it('signs in an existing user', async () => {
    await request(app).post('/api/v1/users').send(mockUser);
    const response = await request(app)
      .post('/api/v1/users/sessions')
      .send({ email: 'demo@test.com', password: '123456' });
    expect(response.status).toBe(200);
  });

  it('/protected should return a 401 if not authenticated', async () => {
    const response = await request(app).get('/api/v1/users/protected');
    expect(response.status).toBe(401);
  });

  afterAll(() => {
    pool.end();
  });
});
