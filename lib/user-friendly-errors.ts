export class UserFriendlyError extends Error {
  constructor(
    message: string,
    public code?: string,
    public userMessage?: string,
    public severity?: 'info' | 'warning' | 'error' | 'success',
    public title?: string,
    public suggestion?: string,
    public action?: string
  ) {
    super(message);
    this.name = 'UserFriendlyError';
  }
}

export function createUserFriendlyError(message: string, code?: string, userMessage?: string) {
  return new UserFriendlyError(message, code, userMessage);
}
