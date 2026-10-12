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
exports.DistanceMatrixDto = exports.GetDirectionsDto = exports.OptimizeTechnicianRouteDto = exports.OptimizeRouteDto = exports.WaypointDto = exports.LocationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class LocationDto {
}
exports.LocationDto = LocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Latitude', example: 37.7749 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], LocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Longitude', example: -122.4194 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], LocationDto.prototype, "lng", void 0);
class WaypointDto {
}
exports.WaypointDto = WaypointDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique identifier for the waypoint', example: 'job-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WaypointDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Location coordinates' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", LocationDto)
], WaypointDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Waypoint name', example: 'Johnson Residence' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WaypointDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Address string', example: '123 Main St, San Francisco, CA' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WaypointDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estimated duration at this stop in minutes', example: 60 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], WaypointDto.prototype, "estimatedDurationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Time window start (ISO date string)' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WaypointDto.prototype, "timeWindowStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Time window end (ISO date string)' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], WaypointDto.prototype, "timeWindowEnd", void 0);
class OptimizeRouteDto {
}
exports.OptimizeRouteDto = OptimizeRouteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Starting point for the route' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WaypointDto),
    __metadata("design:type", WaypointDto)
], OptimizeRouteDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Waypoints to optimize', type: [WaypointDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WaypointDto),
    __metadata("design:type", Array)
], OptimizeRouteDto.prototype, "waypoints", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End point (defaults to origin if not provided)' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => WaypointDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", WaypointDto)
], OptimizeRouteDto.prototype, "destination", void 0);
class OptimizeTechnicianRouteDto {
}
exports.OptimizeTechnicianRouteDto = OptimizeTechnicianRouteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Technician user ID', example: 'user-123' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], OptimizeTechnicianRouteDto.prototype, "technicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date to optimize route for (ISO date string)', example: '2024-01-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], OptimizeTechnicianRouteDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Override technician start location' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", LocationDto)
], OptimizeTechnicianRouteDto.prototype, "startLocation", void 0);
class GetDirectionsDto {
}
exports.GetDirectionsDto = GetDirectionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Origin location' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", LocationDto)
], GetDirectionsDto.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Destination location' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", LocationDto)
], GetDirectionsDto.prototype, "destination", void 0);
class DistanceMatrixDto {
}
exports.DistanceMatrixDto = DistanceMatrixDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Origin locations', type: [LocationDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", Array)
], DistanceMatrixDto.prototype, "origins", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Destination locations', type: [LocationDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", Array)
], DistanceMatrixDto.prototype, "destinations", void 0);
