import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createRequest } from 'node-mocks-http';

describe('/api/jobs/search API Integration Tests', () => {
  let originalFetch;

  beforeEach(() => {
    // Mock global fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // Restore global fetch
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('POST /api/jobs/search', () => {
    it('should return jobId for valid search request', async () => {
      // Mock the API route handler
      const { POST } = await import('../jobs/search/route.js');
      
      // Create mock request
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'x-correlation-id': 'test-correlation-id'
        },
        body: JSON.stringify({
          keywords: 'React Developer',
          locations: ['Remote', 'Bangalore'],
          platforms: ['linkedin', 'naukri'],
          maxResults: 10,
          profile: {
            skills: ['React', 'Node.js'],
            experience: 5,
            targetRoles: ['Senior Developer']
          }
        })
      });

      // Mock user authentication
      request.user = { id: 'test-user-id', email: 'test@example.com' };

      // Mock queue addJob function
      jest.doMock('@/shared/queue', () => ({
        addJob: jest.fn().mockResolvedValue({
          jobId: 'test-job-id',
          queue: 'job-search',
          status: 'queued'
        }),
        QUEUES: {
          JOB_SEARCH: 'job-search'
        }
      }));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        jobId: expect.any(String),
        queue: 'job-search',
        status: 'queued',
        estimatedDuration: '30-60 seconds',
        checkUrl: expect.stringContaining('/api/jobs/')
      });
      expect(data.meta).toMatchObject({
        message: 'Job search queued successfully',
        idempotencyKey: expect.any(String)
      });
    });

    it('should validate required fields', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          // Missing required keywords field
          locations: ['Remote']
        })
      });

      request.user = { id: 'test-user-id' };

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed'
      });
    });

    it('should require authentication', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: 'React Developer'
        })
      });

      // No user object - should fail authentication
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle queue errors gracefully', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          keywords: 'React Developer'
        })
      });

      request.user = { id: 'test-user-id' };

      // Mock queue failure
      jest.doMock('@/shared/queue', () => ({
        addJob: jest.fn().mockRejectedValue(new Error('Queue connection failed')),
        QUEUES: {
          JOB_SEARCH: 'job-search'
        }
      }));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should include correlation ID in response', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'x-correlation-id': 'test-correlation-id'
        },
        body: JSON.stringify({
          keywords: 'React Developer'
        })
      });

      request.user = { id: 'test-user-id' };

      // Mock successful queue operation
      jest.doMock('@/shared/queue', () => ({
        addJob: jest.fn().mockResolvedValue({
          jobId: 'test-job-id'
        }),
        QUEUES: {
          JOB_SEARCH: 'job-search'
        }
      }));

      const response = await POST(request);
      
      expect(response.headers.get('x-correlation-id')).toBe('test-correlation-id');
    });
  });

  describe('GET /api/jobs/search', () => {
    it('should return job status for valid job ID', async () => {
      const { GET } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/jobs/search?jobId=test-job-id',
        headers: {
          'Authorization': 'Bearer mock-token',
          'x-correlation-id': 'test-correlation-id'
        }
      });

      request.user = { id: 'test-user-id' };

      // Mock getJobInfo function
      jest.doMock('@/shared/queue', () => ({
        getJobInfo: jest.fn().mockResolvedValue({
          id: 'test-job-id',
          type: 'job_search',
          status: 'completed',
          userId: 'test-user-id',
          input: { keywords: 'React Developer' },
          output: { jobs: [] },
          timestamp: '2024-01-01T00:00:00Z'
        })
      }));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'test-job-id',
        type: 'job_search',
        status: 'completed',
        userId: 'test-user-id'
      });
    });

    it('should reject access to other users jobs', async () => {
      const { GET } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/jobs/search?jobId=test-job-id',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      request.user = { id: 'different-user-id' };

      // Mock job belonging to different user
      jest.doMock('@/shared/queue', () => ({
        getJobInfo: jest.fn().mockResolvedValue({
          id: 'test-job-id',
          userId: 'original-user-id', // Different user
          status: 'completed'
        })
      }));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Access denied to this job');
    });

    it('should handle missing job ID', async () => {
      const { GET } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/jobs/search', // No jobId parameter
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      request.user = { id: 'test-user-id' };

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Job ID is required');
    });

    it('should handle non-existent job', async () => {
      const { GET } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/jobs/search?jobId=non-existent-job',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      });

      request.user = { id: 'test-user-id' };

      // Mock job not found
      jest.doMock('@/shared/queue', () => ({
        getJobInfo: jest.fn().mockResolvedValue(null)
      }));

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Job not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: 'invalid-json-{'
      });

      request.user = { id: 'test-user-id' };

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle large payloads', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const largeProfile = {
        resumeText: 'A'.repeat(1000000), // 1MB string
        skills: Array.from({ length: 1000 }, (_, i) => `skill-${i}`)
      };

      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          keywords: 'React Developer',
          profile: largeProfile
        })
      });

      request.user = { id: 'test-user-id' };

      // Should handle large payloads or return appropriate error
      const response = await POST(request);
      
      // Either succeeds or returns size limit error
      expect([200, 413]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting', async () => {
      const { POST } = await import('../jobs/search/route.js');
      
      const request = createRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/jobs/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token'
        },
        body: JSON.stringify({
          keywords: 'React Developer'
        })
      });

      request.user = { id: 'test-user-id' };

      // Mock rate limiting
      jest.doMock('@/shared/queue', () => ({
        addJob: jest.fn().mockResolvedValue({ jobId: 'test-job-id' }),
        QUEUES: { JOB_SEARCH: 'job-search' }
      }));

      // Make multiple rapid requests
      const responses = await Promise.all([
        POST(request),
        POST(request),
        POST(request),
        POST(request),
        POST(request)
      ]);

      // At least some should succeed, rate limiting might kick in
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBe(5);
    });
  });
});
