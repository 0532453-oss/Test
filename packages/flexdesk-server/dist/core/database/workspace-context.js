"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithWorkspace = runWithWorkspace;
exports.setWorkspaceContext = setWorkspaceContext;
exports.getWorkspaceId = getWorkspaceId;
const async_hooks_1 = require("async_hooks");
const workspaceStorage = new async_hooks_1.AsyncLocalStorage();
function runWithWorkspace(workspaceId, fn) {
    return workspaceStorage.run({ workspaceId: workspaceId ?? null }, fn);
}
function setWorkspaceContext(workspaceId) {
    const store = workspaceStorage.getStore();
    if (store) {
        store.workspaceId = workspaceId ?? null;
    }
    else {
        workspaceStorage.enterWith({ workspaceId: workspaceId ?? null });
    }
}
function getWorkspaceId() {
    return workspaceStorage.getStore()?.workspaceId ?? null;
}
