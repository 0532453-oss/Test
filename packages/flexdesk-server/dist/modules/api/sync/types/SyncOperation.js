"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOperationStatus = exports.SyncOperationType = void 0;
var SyncOperationType;
(function (SyncOperationType) {
    SyncOperationType["CREATE"] = "CREATE";
    SyncOperationType["UPDATE"] = "UPDATE";
    SyncOperationType["DELETE"] = "DELETE";
})(SyncOperationType || (exports.SyncOperationType = SyncOperationType = {}));
var SyncOperationStatus;
(function (SyncOperationStatus) {
    SyncOperationStatus["PENDING"] = "PENDING";
    SyncOperationStatus["SYNCING"] = "SYNCING";
    SyncOperationStatus["COMPLETED"] = "COMPLETED";
    SyncOperationStatus["FAILED"] = "FAILED";
})(SyncOperationStatus || (exports.SyncOperationStatus = SyncOperationStatus = {}));
