import validator from "validator";
import { SecurityValidator } from "./security";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
}

export class InputValidator {
  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || typeof email !== "string") {
      errors.push("Email is required");
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (email.length > 1000) {
      errors.push("Email input is too large");
      return { isValid: false, errors };
    }

    // Trim and normalize
    const sanitizedEmail = email.trim().toLowerCase();

    if (!validator.isEmail(sanitizedEmail)) {
      errors.push("Invalid email format");
    }

    if (sanitizedEmail.length > 254) {
      errors.push("Email is too long");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: sanitizedEmail,
    };
  }

  /**
   * Validate and sanitize password
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password || typeof password !== "string") {
      errors.push("Password is required");
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (password.length > 1000) {
      errors.push("Password input is too large");
      return { isValid: false, errors };
    }

    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long");
    }

    if (password.length > 128) {
      errors.push("Password is too long");
    }

    // Check for common weak passwords
    const weakPasswords = ["password", "123456", "admin", "user", "test"];
    if (weakPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too weak");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: password,
    };
  }

  /**
   * Validate and sanitize name fields
   */
  static validateName(
    name: string,
    fieldName: string = "Name"
  ): ValidationResult {
    const errors: string[] = [];

    if (!name || typeof name !== "string") {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (name.length > 1000) {
      errors.push(`${fieldName} input is too large`);
      return { isValid: false, errors };
    }

    // Trim whitespace
    const sanitized = name.trim();

    if (sanitized.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`);
    }

    if (sanitized.length > 50) {
      errors.push(`${fieldName} is too long`);
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    // Enhanced security validation
    const securityCheck =
      SecurityValidator.containsMaliciousPatterns(sanitized);
    if (securityCheck.isMalicious) {
      errors.push(`${fieldName} contains potentially malicious content`);
    }

    // Use sanitized version from security check
    const finalSanitized = securityCheck.sanitized;

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: finalSanitized,
    };
  }

  /**
   * Validate and sanitize domain name
   */
  static validateDomainName(domainName: string): ValidationResult {
    const errors: string[] = [];

    if (!domainName || typeof domainName !== "string") {
      errors.push("Domain name is required");
      return { isValid: false, errors };
    }

    const sanitized = domainName.trim().toLowerCase();

    if (sanitized.length < 3) {
      errors.push("Domain name is too short");
    }

    if (sanitized.length > 253) {
      errors.push("Domain name is too long");
    }

    // Basic domain validation
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(sanitized)) {
      errors.push("Invalid domain name format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate and sanitize contact form message
   */
  static validateMessage(
    message: string,
    fieldName: string = "Message"
  ): ValidationResult {
    const errors: string[] = [];

    if (!message || typeof message !== "string") {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (message.length > 10000) {
      errors.push(`${fieldName} input is too large`);
      return { isValid: false, errors };
    }

    const sanitized = message.trim();

    if (sanitized.length < 10) {
      errors.push(`${fieldName} must be at least 10 characters long`);
    }

    if (sanitized.length > 2000) {
      errors.push(`${fieldName} is too long`);
    }

    // Enhanced security validation
    const securityCheck =
      SecurityValidator.containsMaliciousPatterns(sanitized);
    if (securityCheck.isMalicious) {
      errors.push(`${fieldName} contains potentially malicious content`);
    }

    // Use sanitized version from security check
    const finalSanitized = securityCheck.sanitized;

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: finalSanitized,
    };
  }

  /**
   * Validate MongoDB ObjectId
   */
  static validateObjectId(id: string): ValidationResult {
    const errors: string[] = [];

    if (!id || typeof id !== "string") {
      errors.push("ID is required");
      return { isValid: false, errors };
    }

    if (!validator.isMongoId(id)) {
      errors.push("Invalid ID format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: id,
    };
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    return html
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Validate array of domain IDs
   */
  static validateDomainIds(domainIds: any): ValidationResult {
    const errors: string[] = [];

    if (!Array.isArray(domainIds)) {
      errors.push("Domain IDs must be an array");
      return { isValid: false, errors };
    }

    if (domainIds.length === 0) {
      errors.push("At least one domain ID is required");
      return { isValid: false, errors };
    }

    if (domainIds.length > 10) {
      errors.push("Too many domains selected");
      return { isValid: false, errors };
    }

    for (const id of domainIds) {
      const idValidation = this.validateObjectId(id);
      if (!idValidation.isValid) {
        errors.push(`Invalid domain ID: ${id}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: domainIds,
    };
  }
}
