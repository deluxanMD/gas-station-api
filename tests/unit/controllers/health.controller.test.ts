import type { Request, Response } from 'express';
import { getHealth, getLiveness, getReadiness } from '@/controllers/health.controller';

const mockRequest = (): Request => ({}) as Request;

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Health Controller', () => {
  describe('getHealth', () => {
    it('should return 200 with health status', () => {
      const req = mockRequest();
      const res = mockResponse();

      getHealth(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
          environment: expect.any(String),
          uptime: expect.any(Number),
          version: expect.any(String),
        }),
      );
    });

    it('should include a valid ISO timestamp', () => {
      const req = mockRequest();
      const res = mockResponse();

      getHealth(req, res);

      const [call] = (res.json as jest.Mock).mock.calls as [{ timestamp: string }][];
      const body = call?.[0];
      expect(body).toBeDefined();
      expect(new Date(body?.timestamp ?? '').toISOString()).toBe(body?.timestamp);
    });
  });

  describe('getReadiness', () => {
    it('should return 200 with ready status', () => {
      const req = mockRequest();
      const res = mockResponse();

      getReadiness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'ready' });
    });
  });

  describe('getLiveness', () => {
    it('should return 200 with alive status', () => {
      const req = mockRequest();
      const res = mockResponse();

      getLiveness(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'alive' });
    });
  });
});
