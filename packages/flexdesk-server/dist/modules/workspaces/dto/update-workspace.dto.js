"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkspaceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_workspace_dto_1 = require("./create-workspace.dto");
class UpdateWorkspaceDto extends (0, swagger_1.PartialType)(create_workspace_dto_1.CreateWorkspaceDto) {
}
exports.UpdateWorkspaceDto = UpdateWorkspaceDto;
