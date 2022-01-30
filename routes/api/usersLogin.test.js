const mongoose = require('mongoose');
const request = require('supertest');
require('dotenv').config();

const app = require('../../app');

const { DB_TEST_HOST } = process.env;

describe('test login', () => {
  let server;
  beforeAll(() => (server = app.listen(3000)));
  afterAll(() => server.close());

  beforeEach(done => {
    mongoose.connect(DB_TEST_HOST).then(() => done());
  });

  afterEach(done => {
    mongoose.connection.db.dropDatabase(() => {
      mongoose.connection.close(() => done());
    });
  });

  test('test login route', async () => {
    const loginData = {
      email: 'petro@gmail.com',
      password: '1234567890',
    };
    const response = await request(app)
      .post('/api/users/login')
      .send(loginData);

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user).toEqual(
      expect.objectContaining({
        email: expect.any(String),
        subscription: expect.any(String),
      }),
    );
  });
});
