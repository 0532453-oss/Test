"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNextJobResponseDto = exports.NextJobResponseDto = exports.JobLocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class JobLocationDto {
}
exports.JobLocationDto = JobLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Street address' }),
    __metadata("design:type", String)
], JobLocationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Latitude coordinate', example: 40.7128 }),
    __metadata("design:type", Number)
], JobLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Longitude coordinate', example: -74.006 }),
    __metadata("design:type", Number)
], JobLocationDto.prototype, "lng", void 0);
class NextJobResponseDto {
}
exports.NextJobResponseDto = NextJobResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job ID', format: 'uuid' }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer name' }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job title' }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job address' }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude coordinate' }),
    __metadata("design:type", Number)
], NextJobResponseDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude coordinate' }),
    __metadata("design:type", Number)
], NextJobResponseDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Scheduled start time (ISO 8601)' }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Estimated travel time in minutes from Google Distance Matrix API',
    }),
    __metadata("design:type", Number)
], NextJobResponseDto.prototype, "travelTimeMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Travel distance in meters',
    }),
    __metadata("design:type", Number)
], NextJobResponseDto.prototype, "travelDistanceMeters", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Minutes until job starts (can be negative if past start time)',
    }),
    __metadata("design:type", Number)
], NextJobResponseDto.prototype, "minutesUntilStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Google Maps directions URL',
        example: 'https://www.google.com/maps/dir/?api=1&destination=40.7128,-74.006&travelmode=driving',
    }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "directionsUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the technician is currently working on another job',
    }),
    __metadata("design:type", Boolean)
], NextJobResponseDto.prototype, "hasJobInProgress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the job currently in progress (if any)',
    }),
    __metadata("design:type", String)
], NextJobResponseDto.prototype, "inProgressJobId", void 0);
class NoNextJobResponseDto {
}
exports.NoNextJobResponseDto = NoNextJobResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Indicates no upcoming job', example: false }),
    __metadata("design:type", Boolean)
], NoNextJobResponseDto.prototype, "hasNextJob", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human-readable message' }),
    __metadata("design:type", String)
], NoNextJobResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Whether the technician is currently working on a job',
    }),
    __metadata("design:type", Boolean)
], NoNextJobResponseDto.prototype, "hasJobInProgress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID of the job currently in progress (if any)',
    }),
    __metadata("design:type", String)
], NoNextJobResponseDto.prototype, "inProgressJobId", void 0);
