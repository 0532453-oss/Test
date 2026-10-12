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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let PropertyController = class PropertyController {
    constructor(propertyService) {
        this.propertyService = propertyService;
    }
    async create(dto) {
        return this.propertyService.createProperty(dto);
    }
    async findAll() {
        return this.propertyService.findAllProperties();
    }
    async search(query) {
        return this.propertyService.searchProperties(query);
    }
    async findByCustomer(customerId) {
        return this.propertyService.findPropertiesByCustomer(customerId);
    }
    async getPrimaryForCustomer(customerId) {
        return this.propertyService.getPrimaryProperty(customerId);
    }
    async findOne(id) {
        return this.propertyService.findPropertyById(id);
    }
    async findOneWithRelations(id) {
        return this.propertyService.getPropertyWithRelations(id);
    }
    async update(id, dto) {
        return this.propertyService.updateProperty(id, dto);
    }
    async setPrimary(id) {
        return this.propertyService.setPrimaryProperty(id);
    }
    async delete(id) {
        return this.propertyService.deleteProperty(id);
    }
    async migrateCustomerAddress(customerId, name) {
        return this.propertyService.migrateCustomerAddressToProperty(customerId, name || 'Primary');
    }
};
exports.PropertyController = PropertyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new property for a customer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Property created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all properties in the workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of properties' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search properties by name or address' }),
    (0, swagger_1.ApiQuery)({ name: 'q', description: 'Search query', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('by-customer/:customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all properties for a specific customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of customer properties' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Get)('by-customer/:customerId/primary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the primary property for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Primary property or null' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "getPrimaryForCustomer", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a property by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Property ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Property not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/with-relations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get property with customer and jobs information' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Property ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property with relations' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Property not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "findOneWithRelations", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a property' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Property ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Property not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/set-primary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Set a property as the primary location for its customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Property ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property set as primary' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Property not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "setPrimary", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a property' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Property ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Property deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete: property is in use' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Property not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('migrate/:customerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Migrate a customer legacy address to a property record',
        description: 'Creates a property from the customer legacy address JSON field. Returns null if no address exists or property already migrated.',
    }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiQuery)({ name: 'name', description: 'Property name', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Migration result' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PropertyController.prototype, "migrateCustomerAddress", null);
exports.PropertyController = PropertyController = __decorate([
    (0, swagger_1.ApiTags)('Properties'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('properties'),
    __metadata("design:paramtypes", [Function])
], PropertyController);
