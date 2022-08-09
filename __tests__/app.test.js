const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

const mockUser = {
  firstName: 'demo',
  lastName: 'user',
  email: 'demo@test.com',
  password: '123456',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;

  // Create an "agent" that gives us the ability
  // to store cookies between requests in a test
  const agent = request.agent(app);

  // Create a user to sign in with
  const user = await UserService.create({ ...mockUser, ...userProps });

  // ...then sign in
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
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

  it('/protected should return the current user if authenticated', async () => {
    const [agent] = await registerAndLogin();
    const response = await agent.get('/api/v1/users/protected');
    expect(response.status).toBe(200);
  });

  it('/users should return 403 if user is not admin', async () => {
    const [agent] = await registerAndLogin();
    const response = await agent.get('/api/v1/users/');
    expect(response.status).toBe(403);
  });

  it('/users should return 200 if user is admin', async () => {
    const [agent] = await registerAndLogin({ email: 'admin' });
    const response = await agent.get('/api/v1/users');
    expect(response.status).toBe(200);
  });

  it('#SIGN OUT /users should return 401 if not signed in', async () => {
    const response = await request(app).delete('/api/v1/users');
    expect(response.status).toBe(401);
  });

  it('#SIGN OUT /users should sign out an existing user', async () => {
    const [agent] = await registerAndLogin();
    const response = await agent.delete('/api/v1/users');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Signed out successfully',
      success: true,
    });
  });

  it('/secrets should return 401 if user is not authenticated', async () => {
    const response = await request(app).get('/api/v1/secrets');
    expect(response.status).toBe(401);
  });

  it('/secrets should return a list of secrets if user is authenticated', async () => {
    const [agent] = await registerAndLogin();
    const response = await agent.get('/api/v1/secrets');
    expect(response.status).toBe(200);
    expect(response.body.length).toEqual(3);
    expect(response.body[0]).toEqual({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      created_at: expect.any(String),
    });
  });

  afterAll(() => {
    pool.end();
  });
});
