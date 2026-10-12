import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('FlexDesk API (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let authToken: string;

  const testWorkspaceId = 'test-workspace-123';
  const testUserId = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        job: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          count: jest.fn().mockResolvedValue(0),
        },
        customer: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        technician: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          update: jest.fn(),
        },
        invoice: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          update: jest.fn(),
        },
        workspace: {
          findUnique: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          update: jest.fn(),
        },
        workspaceMember: {
          findUnique: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
          delete: jest.fn(),
          update: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        $use: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Generate a test JWT token
    authToken = jwtService.sign({
      sub: testUserId,
      email: 'test@example.com',
      workspaceId: testWorkspaceId,
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs')
        .expect(401);
    });

    it('should accept requests with valid auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Jobs API', () => {
    it('GET /api/v1/jobs should return jobs list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/v1/jobs should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });

    it('POST /api/v1/jobs should create job with valid input', () => {
      (prismaService.job.create as jest.Mock).mockResolvedValue({
        id: 'new-job-123',
        title: 'Test Job',
        customerId: 'customer-123',
        workspaceId: testWorkspaceId,
        status: 'SCHEDULED',
      });

      return request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Job',
          customerId: 'customer-123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('Test Job');
        });
    });
  });

  describe('Customers API', () => {
    it('GET /api/v1/customers should return customers list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/v1/customers should validate name is required', () => {
      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('POST /api/v1/customers should create customer with valid input', () => {
      (prismaService.customer.create as jest.Mock).mockResolvedValue({
        id: 'new-customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        workspaceId: testWorkspaceId,
      });

      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'john@example.com',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('John Doe');
        });
    });
  });

  describe('Technicians API', () => {
    it('GET /api/v1/technicians should return technicians list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/technicians')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Invoices API', () => {
    it('GET /api/v1/invoices should return invoices list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Validation', () => {
    it('should reject invalid UUID parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should strip unknown properties', () => {
      (prismaService.customer.create as jest.Mock).mockResolvedValue({
        id: 'customer-123',
        name: 'Test',
        workspaceId: testWorkspaceId,
      });

      return request(app.getHttpServer())
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test',
          unknownField: 'should be stripped',
        })
        .expect(400); // forbidNonWhitelisted rejects unknown fields
    });
  });
});
