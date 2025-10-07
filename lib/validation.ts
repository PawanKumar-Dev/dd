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
   * Validate and sanitize phone number
   */
  static validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];

    if (!phone || typeof phone !== "string") {
      errors.push("Phone number is required");
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (phone.length > 50) {
      errors.push("Phone number is too long");
      return { isValid: false, errors };
    }

    // Trim whitespace
    const sanitized = phone.trim();

    // Remove common phone number formatting
    const cleaned = sanitized.replace(/[\s\-\(\)\.]/g, "");

    // Check if it's a valid phone number (digits only, with optional + at start)
    if (!/^\+?[0-9]+$/.test(cleaned)) {
      errors.push(
        "Phone number must contain only digits and optional + prefix"
      );
    }

    // Check length (minimum 7 digits, maximum 15 digits)
    const digitsOnly = cleaned.replace(/^\+/, "");
    if (digitsOnly.length < 7) {
      errors.push("Phone number must be at least 7 digits long");
    }
    if (digitsOnly.length > 15) {
      errors.push("Phone number is too long");
    }

    // Enhanced security validation
    const securityCheck =
      SecurityValidator.containsMaliciousPatterns(sanitized);
    if (securityCheck.isMalicious) {
      errors.push("Phone number contains potentially malicious content");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: securityCheck.sanitized,
    };
  }

  /**
   * Validate and sanitize phone country code
   */
  static validatePhoneCc(phoneCc: string): ValidationResult {
    const errors: string[] = [];

    if (!phoneCc || typeof phoneCc !== "string") {
      errors.push("Phone country code is required");
      return { isValid: false, errors };
    }

    // Buffer overflow protection - limit input size
    if (phoneCc.length > 10) {
      errors.push("Phone country code is too long");
      return { isValid: false, errors };
    }

    // Trim whitespace
    const sanitized = phoneCc.trim();

    // Validate country code format (+XX or +XXX)
    if (!/^\+[1-9]\d{0,3}$/.test(sanitized)) {
      errors.push("Phone country code must be in format +XX or +XXX (e.g., +91, +1, +44)");
    }

    // Enhanced security validation
    const securityCheck = SecurityValidator.containsMaliciousPatterns(sanitized);
    if (securityCheck.isMalicious) {
      errors.push("Phone country code contains potentially malicious content");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: securityCheck.sanitized,
    };
  }

  /**
   * Validate and sanitize address
   */
  static validateAddress(address: {
    line1: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  }): ValidationResult {
    const errors: string[] = [];

    if (!address || typeof address !== "object") {
      errors.push("Address is required");
      return { isValid: false, errors };
    }

    // Validate each address field
    const requiredFields = [
      { key: "line1", name: "Address Line 1" },
      { key: "city", name: "City" },
      { key: "state", name: "State" },
      { key: "country", name: "Country" },
      { key: "zipcode", name: "ZIP Code" },
    ];

    const sanitized: any = {};

    for (const field of requiredFields) {
      const value = address[field.key as keyof typeof address];

      if (!value || typeof value !== "string") {
        errors.push(`${field.name} is required`);
        continue;
      }

      // Buffer overflow protection
      if (value.length > 200) {
        errors.push(`${field.name} is too long`);
        continue;
      }

      // Trim whitespace
      const trimmed = value.trim();

      if (trimmed.length < 2) {
        errors.push(`${field.name} must be at least 2 characters long`);
        continue;
      }

      // Enhanced security validation
      const securityCheck =
        SecurityValidator.containsMaliciousPatterns(trimmed);
      if (securityCheck.isMalicious) {
        errors.push(`${field.name} contains potentially malicious content`);
        continue;
      }

      sanitized[field.key] = securityCheck.sanitized;
    }

    // Additional validation for specific fields
    if (sanitized.country && !/^[A-Z]{2}$/.test(sanitized.country)) {
      errors.push("Country must be a 2-letter country code (e.g., IN, US)");
    }

    if (sanitized.zipcode && !/^[A-Z0-9\s\-]{3,10}$/i.test(sanitized.zipcode)) {
      errors.push("ZIP code format is invalid");
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
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
      sanitized: domainIds.join(","),
    };
  }
}
