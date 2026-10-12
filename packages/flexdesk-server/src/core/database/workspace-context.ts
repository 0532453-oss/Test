import { AsyncLocalStorage } from 'async_hooks';

type WorkspaceContext = {
  workspaceId: string | null;
};

const workspaceStorage = new AsyncLocalStorage<WorkspaceContext>();

export function runWithWorkspace<T>(workspaceId: string | null, fn: () => T): T {
  return workspaceStorage.run({ workspaceId: workspaceId ?? null }, fn);
}

export function setWorkspaceContext(workspaceId: string | null): void {
  const store = workspaceStorage.getStore();

  if (store) {
    store.workspaceId = workspaceId ?? null;
  } else {
    workspaceStorage.enterWith({ workspaceId: workspaceId ?? null });
  }
}

export function getWorkspaceId(): string | null {
  return workspaceStorage.getStore()?.workspaceId ?? null;
}

