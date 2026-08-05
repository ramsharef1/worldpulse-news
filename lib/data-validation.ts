// ============================================
// DATA VALIDATION SCHEMAS & UTILITIES
// ============================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================
// VALIDATION RULES
// ============================================

export const ValidationRules = {
  // String validators
  required: (value: any): boolean => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  },

  minLength: (min: number) => (value: string): boolean => {
    return value && value.length >= min;
  },

  maxLength: (max: number) => (value: string): boolean => {
    return !value || value.length <= max;
  },

  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  pattern: (regex: RegExp) => (value: string): boolean => {
    return regex.test(value);
  },

  // Number validators
  minValue: (min: number) => (value: number): boolean => {
    return value >= min;
  },

  maxValue: (max: number) => (value: number): boolean => {
    return value <= max;
  },

  integer: (value: any): boolean => {
    return Number.isInteger(value);
  },

  positive: (value: number): boolean => {
    return value > 0;
  },

  // Array validators
  minItems: (min: number) => (value: any[]): boolean => {
    return value && value.length >= min;
  },

  maxItems: (max: number) => (value: any[]): boolean => {
    return !value || value.length <= max;
  },

  // Bilingual validators
  requiredBilingual: (value: { en?: string; ar?: string }): boolean => {
    return (value?.en?.trim().length || 0) > 0 || (value?.ar?.trim().length || 0) > 0;
  },

  // Custom validators
  isoDate: (value: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  },

  colorHex: (value: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
  },

  timezone: (value: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: value });
      return true;
    } catch {
      return false;
    }
  },

  languageCode: (value: string): boolean => {
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(value);
  },

  ipAddress: (value: string): boolean => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(value);
  },

  phoneNumber: (value: string): boolean => {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(value);
  },
};

// ============================================
// FIELD VALIDATOR CLASS
// ============================================

export class FieldValidator {
  private rules: Array<{
    validate: (value: any) => boolean;
    message: string;
  }> = [];

  required(message: string = 'This field is required'): this {
    this.rules.push({
      validate: ValidationRules.required,
      message,
    });
    return this;
  }

  minLength(min: number, message?: string): this {
    this.rules.push({
      validate: ValidationRules.minLength(min),
      message: message || `Minimum length is ${min} characters`,
    });
    return this;
  }

  maxLength(max: number, message?: string): this {
    this.rules.push({
      validate: ValidationRules.maxLength(max),
      message: message || `Maximum length is ${max} characters`,
    });
    return this;
  }

  email(message?: string): this {
    this.rules.push({
      validate: ValidationRules.email,
      message: message || 'Invalid email address',
    });
    return this;
  }

  url(message?: string): this {
    this.rules.push({
      validate: ValidationRules.url,
      message: message || 'Invalid URL',
    });
    return this;
  }

  pattern(regex: RegExp, message: string): this {
    this.rules.push({
      validate: ValidationRules.pattern(regex),
      message,
    });
    return this;
  }

  minValue(min: number, message?: string): this {
    this.rules.push({
      validate: ValidationRules.minValue(min),
      message: message || `Minimum value is ${min}`,
    });
    return this;
  }

  maxValue(max: number, message?: string): this {
    this.rules.push({
      validate: ValidationRules.maxValue(max),
      message: message || `Maximum value is ${max}`,
    });
    return this;
  }

  integer(message?: string): this {
    this.rules.push({
      validate: ValidationRules.integer,
      message: message || 'Value must be an integer',
    });
    return this;
  }

  custom(
    validator: (value: any) => boolean,
    message: string
  ): this {
    this.rules.push({
      validate: validator,
      message,
    });
    return this;
  }

  validate(value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================
// SCHEMA VALIDATOR
// ============================================

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  email?: boolean;
  url?: boolean;
  enum?: any[];
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ObjectSchema {
  [key: string]: FieldSchema | ObjectSchema;
}

export class SchemaValidator {
  validate(data: any, schema: ObjectSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const [field, fieldSchema] of Object.entries(schema)) {
      const value = data[field];
      const result = this.validateField(field, value, fieldSchema as any);

      if (result.errors) {
        errors.push(...result.errors);
      }
      if (result.warnings) {
        warnings.push(...result.warnings);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateField(
    fieldName: string,
    value: any,
    schema: FieldSchema | ObjectSchema
  ): { errors?: ValidationError[]; warnings?: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check if it's a nested schema
    if (!('type' in schema)) {
      // Nested object validation
      if (value && typeof value === 'object') {
        const nestedResult = this.validate(value, schema as ObjectSchema);
        errors.push(
          ...nestedResult.errors.map((e) => ({
            ...e,
            field: `${fieldName}.${e.field}`,
          }))
        );
        warnings.push(
          ...nestedResult.warnings.map((w) => ({
            ...w,
            field: `${fieldName}.${w.field}`,
          }))
        );
      }
      return { errors, warnings };
    }

    const fieldSchema = schema as FieldSchema;

    // Required validation
    if (fieldSchema.required && (value === null || value === undefined || value === '')) {
      errors.push({
        field: fieldName,
        message: fieldSchema.message || `${fieldName} is required`,
        value,
      });
      return { errors, warnings };
    }

    if (!value) {
      return { errors, warnings };
    }

    // Type validation
    const typeCheck = this.validateType(value, fieldSchema.type);
    if (!typeCheck.valid) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be of type ${fieldSchema.type}`,
        value,
      });
      return { errors, warnings };
    }

    // String validations
    if (fieldSchema.type === 'string' && typeof value === 'string') {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${fieldSchema.minLength} characters`,
          value,
        });
      }

      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${fieldSchema.maxLength} characters`,
          value,
        });
      }

      if (fieldSchema.pattern) {
        const regex = new RegExp(fieldSchema.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: fieldName,
            message: `${fieldName} format is invalid`,
            value,
          });
        }
      }

      if (fieldSchema.email && !ValidationRules.email(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid email`,
          value,
        });
      }

      if (fieldSchema.url && !ValidationRules.url(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid URL`,
          value,
        });
      }
    }

    // Number validations
    if (fieldSchema.type === 'number' && typeof value === 'number') {
      if (
        fieldSchema.minValue !== undefined &&
        value < fieldSchema.minValue
      ) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${fieldSchema.minValue}`,
          value,
        });
      }

      if (
        fieldSchema.maxValue !== undefined &&
        value > fieldSchema.maxValue
      ) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at most ${fieldSchema.maxValue}`,
          value,
        });
      }
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`,
        value,
      });
    }

    // Custom validation
    if (fieldSchema.custom && !fieldSchema.custom(value)) {
      errors.push({
        field: fieldName,
        message: fieldSchema.message || `${fieldName} validation failed`,
        value,
      });
    }

    return { errors, warnings };
  }

  private validateType(
    value: any,
    expectedType: string
  ): { valid: boolean } {
    switch (expectedType) {
      case 'string':
        return { valid: typeof value === 'string' };
      case 'number':
        return { valid: typeof value === 'number' && !isNaN(value) };
      case 'boolean':
        return { valid: typeof value === 'boolean' };
      case 'date':
        return { valid: value instanceof Date || ValidationRules.isoDate(value) };
      case 'array':
        return { valid: Array.isArray(value) };
      case 'object':
        return { valid: typeof value === 'object' && value !== null };
      default:
        return { valid: true };
    }
  }
}

// ============================================
// PREDEFINED SCHEMAS
// ============================================

export const CommonSchemas = {
  adminSettings: {
    organization_name: { type: 'string', maxLength: 255 },
    logo_url: { type: 'string', url: true },
    theme_mode: { type: 'string', enum: ['light', 'dark', 'auto'] },
    default_language: { type: 'string', enum: ['en', 'ar'] },
    timezone: { type: 'string', custom: ValidationRules.timezone },
    primary_color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
    enforce_2fa: { type: 'boolean' },
    session_timeout_minutes: { type: 'number', minValue: 1, maxValue: 1440 },
    data_retention_days: { type: 'number', minValue: 1 },
  },

  customField: {
    entity_type: { type: 'string', required: true },
    field_name: { type: 'string', required: true, maxLength: 255 },
    field_label_en: { type: 'string', required: true, maxLength: 255 },
    field_label_ar: { type: 'string', required: true, maxLength: 255 },
    field_type: {
      type: 'string',
      required: true,
      enum: ['text', 'number', 'email', 'url', 'date', 'select', 'checkbox', 'textarea', 'rich_text'],
    },
    is_required: { type: 'boolean' },
    max_length: { type: 'number', minValue: 1 },
    is_searchable: { type: 'boolean' },
  },

  emailTemplate: {
    template_name: { type: 'string', required: true, maxLength: 255 },
    template_slug: { type: 'string', required: true, maxLength: 255 },
    subject_en: { type: 'string', required: true, maxLength: 500 },
    subject_ar: { type: 'string', required: true, maxLength: 500 },
    body_html_en: { type: 'string', required: true },
    body_html_ar: { type: 'string', required: true },
    is_active: { type: 'boolean' },
  },

  backupSchedule: {
    schedule_name: { type: 'string', required: true, maxLength: 255 },
    frequency: {
      type: 'string',
      required: true,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
    },
    retention_days: { type: 'number', required: true, minValue: 1 },
    is_active: { type: 'boolean' },
  },

  customPermissionRule: {
    rule_name: { type: 'string', required: true, maxLength: 255 },
    resource: { type: 'string', required: true },
    action: { type: 'string', required: true },
    allow: { type: 'boolean', required: true },
    is_active: { type: 'boolean' },
  },

  dataExport: {
    export_name: { type: 'string', required: true, maxLength: 255 },
    entity_type: { type: 'string', required: true },
    export_format: { type: 'string', required: true, enum: ['csv', 'json', 'xml'] },
  },

  dataImport: {
    import_name: { type: 'string', required: true, maxLength: 255 },
    entity_type: { type: 'string', required: true },
    import_format: { type: 'string', required: true, enum: ['csv', 'json', 'xml'] },
  },
};

export default {
  ValidationRules,
  FieldValidator,
  SchemaValidator,
  CommonSchemas,
};
