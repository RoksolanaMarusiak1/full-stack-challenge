/** Thrown by a repository when a link with this code already exists. */
export class CodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Short code "${code}" already exists`);
    this.name = "CodeAlreadyExistsError";
  }
}

/** Thrown by the service when no free code could be generated. */
export class CodeGenerationError extends Error {
  constructor(attempts: number) {
    super(`Could not generate a unique short code after ${attempts} attempts`);
    this.name = "CodeGenerationError";
  }
}

export class LinkNotFoundError extends Error {
  constructor(code: string) {
    super(`No link found for code "${code}"`);
    this.name = "LinkNotFoundError";
  }
}

/** The submitted URL is not acceptable. The message is safe to show to the user. */
export class InvalidUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUrlError";
  }
}
