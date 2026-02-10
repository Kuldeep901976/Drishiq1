/**
 * DDSA-specific errors.
 */

export class DdsaConcurrencyError extends Error {
  constructor(
    message: string,
    public readonly currentVersion?: number,
    public readonly attemptedVersion?: number
  ) {
    super(message);
    this.name = 'DdsaConcurrencyError';
    Object.setPrototypeOf(this, DdsaConcurrencyError.prototype);
  }
}
