import request from 'supertest';
import { app } from '../../app.js';

describe('Hello Module Integration Tests', () => {
  describe('GET /api/v1/hello/express', () => {
    it('should return 200 and say Hello World from Express.js with system diagnostics', async () => {
      const response = await request(app).get('/api/v1/hello/express');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.status).toBe('success');
      expect(response.body.framework).toBe('Express.js');
      expect(response.body.data.message).toBe('Hello World from Express.js');
      expect(response.body.data.request.method).toBe('GET');
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.system.nodeVersion).toBeDefined();
    });
  });

  describe('GET /api/v1/hello/node', () => {
    it('should return 200 and say Hello World from Raw Node.js with system diagnostics', async () => {
      const response = await request(app).get('/api/v1/hello/node');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.status).toBe('success');
      expect(response.body.framework).toBe('Raw Node.js (Simulated)');
      expect(response.body.data.message).toBe('Hello World from Raw Node.js');
      expect(response.body.data.request.method).toBe('GET');
      expect(response.body.data.system).toBeDefined();
    });
  });

  describe('GET /api/v1/non-existent-route', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        status: 'error',
        message: 'The requested resource does not exist.',
      });
    });
  });
});
