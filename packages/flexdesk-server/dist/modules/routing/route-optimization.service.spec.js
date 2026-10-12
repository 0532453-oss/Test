"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const route_optimization_service_1 = require("./route-optimization.service");
const prisma_service_1 = require("../../core/database/prisma.service");
const workspaceContext = require("../../core/database/workspace-context");
const mockFetch = jest.fn();
global.fetch = mockFetch;
describe('RouteOptimizationService', () => {
    let service;
    let configService;
    let prismaService;
    const mockPrismaService = {
        technician: {
            findFirst: jest.fn(),
        },
        job: {
            findMany: jest.fn(),
        },
    };
    const mockConfigService = {
        get: jest.fn(),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        mockFetch.mockClear();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                route_optimization_service_1.RouteOptimizationService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(route_optimization_service_1.RouteOptimizationService);
        configService = module.get(config_1.ConfigService);
        prismaService = module.get(prisma_service_1.PrismaService);
    });
    describe('isGoogleMapsConfigured', () => {
        it('should return false when API key is not configured', () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            expect(testService.isGoogleMapsConfigured()).toBe(false);
        });
        it('should return true when API key is configured', () => {
            mockConfigService.get.mockReturnValue('test-api-key');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            expect(testService.isGoogleMapsConfigured()).toBe(true);
        });
    });
    describe('optimizeWithNearestNeighbor', () => {
        const origin = {
            id: 'origin',
            location: { lat: 37.7749, lng: -122.4194 },
        };
        const waypoints = [
            {
                id: 'wp1',
                location: { lat: 37.8044, lng: -122.2712 },
                name: 'Oakland',
            },
            {
                id: 'wp2',
                location: { lat: 37.5485, lng: -121.9886 },
                name: 'Fremont',
            },
            {
                id: 'wp3',
                location: { lat: 37.6879, lng: -122.4702 },
                name: 'Daly City',
            },
        ];
        it('should optimize route using nearest-neighbor algorithm', () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = testService.optimizeWithNearestNeighbor(origin, waypoints);
            expect(result.waypointOrder).toHaveLength(4);
            expect(result.waypointOrder[0]).toBe('origin');
            expect(result.legs).toHaveLength(3);
            expect(result.totalDistanceMeters).toBeGreaterThan(0);
            expect(result.totalDurationSeconds).toBeGreaterThan(0);
            expect(result.optimizationMethod).toBe('haversine');
        });
        it('should start from origin and visit nearest point first', () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = testService.optimizeWithNearestNeighbor(origin, waypoints);
            expect(result.waypointOrder[1]).toBe('wp3');
        });
        it('should include destination when provided', () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const destination = {
                id: 'dest',
                location: { lat: 37.3382, lng: -121.8863 },
            };
            const result = testService.optimizeWithNearestNeighbor(origin, waypoints, destination);
            expect(result.waypointOrder).toHaveLength(5);
            expect(result.waypointOrder[result.waypointOrder.length - 1]).toBe('dest');
            expect(result.legs).toHaveLength(4);
        });
        it('should calculate correct leg distances', () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = testService.optimizeWithNearestNeighbor(origin, waypoints);
            for (const leg of result.legs) {
                expect(leg.distanceMeters).toBeGreaterThan(0);
                expect(leg.durationSeconds).toBeGreaterThan(0);
                expect(leg.fromWaypointId).toBeDefined();
                expect(leg.toWaypointId).toBeDefined();
            }
            const sumDistance = result.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
            expect(result.totalDistanceMeters).toBe(sumDistance);
        });
    });
    describe('optimizeRoute', () => {
        const origin = {
            id: 'origin',
            location: { lat: 37.7749, lng: -122.4194 },
        };
        const waypoints = [
            { id: 'wp1', location: { lat: 37.8044, lng: -122.2712 } },
        ];
        it('should throw error for empty waypoints', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            await expect(testService.optimizeRoute(origin, [])).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw error for invalid origin location', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const invalidOrigin = {
                id: 'origin',
                location: { lat: 200, lng: -122.4194 },
            };
            await expect(testService.optimizeRoute(invalidOrigin, waypoints)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw error for invalid waypoint location', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const invalidWaypoints = [
                { id: 'wp1', location: { lat: 37.8044, lng: -300 } },
            ];
            await expect(testService.optimizeRoute(origin, invalidWaypoints)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should use nearest-neighbor when Google Maps is not configured', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = await testService.optimizeRoute(origin, waypoints);
            expect(result.optimizationMethod).toBe('haversine');
        });
        it('should fall back to nearest-neighbor when Google Maps fails', async () => {
            mockConfigService.get.mockReturnValue('test-api-key');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            const result = await testService.optimizeRoute(origin, waypoints);
            expect(result.optimizationMethod).toBe('nearest_neighbor');
        });
        it('should use Google Maps when configured and successful', async () => {
            mockConfigService.get.mockReturnValue('test-api-key');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const mockGoogleResponse = {
                routes: [
                    {
                        distanceMeters: 15000,
                        duration: '1800s',
                        optimizedIntermediateWaypointIndex: [0],
                        legs: [
                            { distanceMeters: 15000, duration: '1800s' },
                        ],
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockGoogleResponse),
            });
            const result = await testService.optimizeRoute(origin, waypoints);
            expect(mockFetch).toHaveBeenCalled();
            expect(result.optimizationMethod).toBe('google_maps');
            expect(result.totalDistanceMeters).toBe(15000);
            expect(result.totalDurationSeconds).toBe(1800);
        });
    });
    describe('getDistanceMatrix', () => {
        const origins = [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.8044, lng: -122.2712 },
        ];
        const destinations = [
            { lat: 37.5485, lng: -121.9886 },
            { lat: 37.3382, lng: -121.8863 },
        ];
        it('should calculate distance matrix using Haversine when API not configured', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = await testService.getDistanceMatrix(origins, destinations);
            expect(result).toHaveLength(4);
            for (const entry of result) {
                expect(entry.originIndex).toBeGreaterThanOrEqual(0);
                expect(entry.destinationIndex).toBeGreaterThanOrEqual(0);
                expect(entry.distanceMeters).toBeGreaterThan(0);
                expect(entry.durationSeconds).toBeGreaterThan(0);
            }
        });
        it('should throw error for invalid origin location', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const invalidOrigins = [{ lat: 200, lng: -122.4194 }];
            await expect(testService.getDistanceMatrix(invalidOrigins, destinations)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getDirections', () => {
        const origin = { lat: 37.7749, lng: -122.4194 };
        const destination = { lat: 37.8044, lng: -122.2712 };
        it('should return directions using Haversine when API not configured', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const result = await testService.getDirections(origin, destination);
            expect(result.distanceMeters).toBeGreaterThan(0);
            expect(result.durationSeconds).toBeGreaterThan(0);
            expect(result.polyline).toBeUndefined();
        });
        it('should throw error for invalid origin', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            await expect(testService.getDirections({ lat: 200, lng: 0 }, destination)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw error for invalid destination', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            await expect(testService.getDirections(origin, { lat: 0, lng: -400 })).rejects.toThrow(common_1.BadRequestException);
        });
        it('should use Google Maps when configured', async () => {
            mockConfigService.get.mockReturnValue('test-api-key');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            const mockResponse = {
                routes: [
                    {
                        distanceMeters: 12000,
                        duration: '900s',
                        polyline: { encodedPolyline: 'abc123' },
                    },
                ],
            };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            });
            const result = await testService.getDirections(origin, destination);
            expect(result.distanceMeters).toBe(12000);
            expect(result.durationSeconds).toBe(900);
            expect(result.polyline).toBe('abc123');
        });
    });
    describe('optimizeTechnicianRoute', () => {
        beforeEach(() => {
            jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue('workspace-123');
        });
        it('should throw error when technician not found', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue(null);
            await expect(testService.optimizeTechnicianRoute('tech-123', new Date())).rejects.toThrow('Technician not found');
        });
        it('should throw error when no jobs scheduled', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue({
                id: 'tech-123',
                currentLocation: { lat: 37.7749, lng: -122.4194 },
            });
            mockPrismaService.job.findMany.mockResolvedValue([]);
            await expect(testService.optimizeTechnicianRoute('tech-123', new Date())).rejects.toThrow('No jobs scheduled');
        });
        it('should throw error when technician has no location and none provided', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue({
                id: 'tech-123',
                currentLocation: null,
            });
            await expect(testService.optimizeTechnicianRoute('tech-123', new Date())).rejects.toThrow('Technician start location not available');
        });
        it('should optimize route for technician with jobs', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue({
                id: 'tech-123',
                currentLocation: { lat: 37.7749, lng: -122.4194 },
            });
            mockPrismaService.job.findMany.mockResolvedValue([
                {
                    id: 'job-1',
                    title: 'Job 1',
                    property: { lat: 37.8044, lng: -122.2712, street: '123 Main', city: 'Oakland' },
                    scheduledAt: new Date(),
                    estimatedDurationMinutes: 60,
                },
                {
                    id: 'job-2',
                    title: 'Job 2',
                    property: { lat: 37.5485, lng: -121.9886, street: '456 Oak', city: 'Fremont' },
                    scheduledAt: new Date(),
                    estimatedDurationMinutes: 45,
                },
            ]);
            const result = await testService.optimizeTechnicianRoute('tech-123', new Date());
            expect(result.waypointOrder).toHaveLength(3);
            expect(result.waypointOrder[0]).toBe('technician_start');
            expect(result.legs).toHaveLength(2);
        });
        it('should use provided start location when available', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue({
                id: 'tech-123',
                currentLocation: null,
            });
            mockPrismaService.job.findMany.mockResolvedValue([
                {
                    id: 'job-1',
                    title: 'Job 1',
                    property: { lat: 37.8044, lng: -122.2712 },
                    scheduledAt: new Date(),
                },
            ]);
            const result = await testService.optimizeTechnicianRoute('tech-123', new Date(), { lat: 37.7749, lng: -122.4194 });
            expect(result.waypointOrder).toContain('technician_start');
        });
        it('should handle jobs with legacy location field', async () => {
            mockConfigService.get.mockReturnValue('');
            const testService = new route_optimization_service_1.RouteOptimizationService(mockConfigService, mockPrismaService);
            mockPrismaService.technician.findFirst.mockResolvedValue({
                id: 'tech-123',
                currentLocation: { lat: 37.7749, lng: -122.4194 },
            });
            mockPrismaService.job.findMany.mockResolvedValue([
                {
                    id: 'job-1',
                    title: 'Job 1',
                    property: null,
                    location: { lat: 37.8044, lng: -122.2712, address: '123 Main St' },
                    scheduledAt: new Date(),
                },
            ]);
            const result = await testService.optimizeTechnicianRoute('tech-123', new Date());
            expect(result.waypointOrder).toHaveLength(2);
        });
    });
});
