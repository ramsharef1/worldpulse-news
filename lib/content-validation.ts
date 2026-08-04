// Content validation utilities for admin panel

export interface ContentValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ContentValidationError[];
}

// Article validation
export function validateArticle(data: any): ValidationResult {
  const errors: ContentValidationError[] = [];

  if (!data.title_en || data.title_en.trim().length === 0) {
    errors.push({
      field: 'title_en',
      message: 'English title is required',
      severity: 'error',
    });
  } else if (data.title_en.length > 500) {
    errors.push({
      field: 'title_en',
      message: 'English title must be less than 500 characters',
      severity: 'error',
    });
  }

  if (!data.title_ar || data.title_ar.trim().length === 0) {
    errors.push({
      field: 'title_ar',
      message: 'Arabic title is required',
      severity: 'error',
    });
  } else if (data.title_ar.length > 500) {
    errors.push({
      field: 'title_ar',
      message: 'Arabic title must be less than 500 characters',
      severity: 'error',
    });
  }

  if (!data.content_en || data.content_en.trim().length === 0) {
    errors.push({
      field: 'content_en',
      message: 'English content is required',
      severity: 'error',
    });
  } else if (data.content_en.length < 100) {
    errors.push({
      field: 'content_en',
      message: 'English content must be at least 100 characters',
      severity: 'warning',
    });
  }

  if (!data.content_ar || data.content_ar.trim().length === 0) {
    errors.push({
      field: 'content_ar',
      message: 'Arabic content is required',
      severity: 'error',
    });
  } else if (data.content_ar.length < 100) {
    errors.push({
      field: 'content_ar',
      message: 'Arabic content must be at least 100 characters',
      severity: 'warning',
    });
  }

  if (!data.university_id) {
    errors.push({
      field: 'university_id',
      message: 'University is required',
      severity: 'error',
    });
  }

  if (!data.category_id) {
    errors.push({
      field: 'category_id',
      message: 'Category is required',
      severity: 'error',
    });
  }

  if (data.status && !['draft', 'review', 'published', 'archived'].includes(data.status)) {
    errors.push({
      field: 'status',
      message: 'Invalid status value',
      severity: 'error',
    });
  }

  if (data.featured_image_url && !isValidUrl(data.featured_image_url)) {
    errors.push({
      field: 'featured_image_url',
      message: 'Invalid image URL',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// Event validation
export function validateEvent(data: any): ValidationResult {
  const errors: ContentValidationError[] = [];

  if (!data.title_en || data.title_en.trim().length === 0) {
    errors.push({
      field: 'title_en',
      message: 'English title is required',
      severity: 'error',
    });
  }

  if (!data.title_ar || data.title_ar.trim().length === 0) {
    errors.push({
      field: 'title_ar',
      message: 'Arabic title is required',
      severity: 'error',
    });
  }

  if (!data.description_en || data.description_en.trim().length === 0) {
    errors.push({
      field: 'description_en',
      message: 'English description is required',
      severity: 'error',
    });
  }

  if (!data.description_ar || data.description_ar.trim().length === 0) {
    errors.push({
      field: 'description_ar',
      message: 'Arabic description is required',
      severity: 'error',
    });
  }

  if (!data.start_date) {
    errors.push({
      field: 'start_date',
      message: 'Start date is required',
      severity: 'error',
    });
  } else if (new Date(data.start_date) < new Date()) {
    errors.push({
      field: 'start_date',
      message: 'Start date must be in the future',
      severity: 'warning',
    });
  }

  if (!data.end_date) {
    errors.push({
      field: 'end_date',
      message: 'End date is required',
      severity: 'error',
    });
  } else if (data.start_date && new Date(data.end_date) <= new Date(data.start_date)) {
    errors.push({
      field: 'end_date',
      message: 'End date must be after start date',
      severity: 'error',
    });
  }

  if (!data.university_id) {
    errors.push({
      field: 'university_id',
      message: 'University is required',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// Job validation
export function validateJob(data: any): ValidationResult {
  const errors: ContentValidationError[] = [];

  if (!data.title_en || data.title_en.trim().length === 0) {
    errors.push({
      field: 'title_en',
      message: 'English title is required',
      severity: 'error',
    });
  }

  if (!data.title_ar || data.title_ar.trim().length === 0) {
    errors.push({
      field: 'title_ar',
      message: 'Arabic title is required',
      severity: 'error',
    });
  }

  if (!data.description_en || data.description_en.trim().length === 0) {
    errors.push({
      field: 'description_en',
      message: 'English description is required',
      severity: 'error',
    });
  }

  if (!data.description_ar || data.description_ar.trim().length === 0) {
    errors.push({
      field: 'description_ar',
      message: 'Arabic description is required',
      severity: 'error',
    });
  }

  if (!data.position_type || !['internship', 'fulltime', 'parttime', 'contract'].includes(data.position_type)) {
    errors.push({
      field: 'position_type',
      message: 'Valid position type is required',
      severity: 'error',
    });
  }

  if (!data.university_id) {
    errors.push({
      field: 'university_id',
      message: 'University is required',
      severity: 'error',
    });
  }

  if (!data.expires_at) {
    errors.push({
      field: 'expires_at',
      message: 'Expiration date is required',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// Faculty validation
export function validateFaculty(data: any): ValidationResult {
  const errors: ContentValidationError[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Faculty name is required',
      severity: 'error',
    });
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Valid email is required',
      severity: 'error',
    });
  }

  if (!data.university_id) {
    errors.push({
      field: 'university_id',
      message: 'University is required',
      severity: 'error',
    });
  }

  if (!data.department_id) {
    errors.push({
      field: 'department_id',
      message: 'Department is required',
      severity: 'error',
    });
  }

  if (data.profile_image_url && !isValidUrl(data.profile_image_url)) {
    errors.push({
      field: 'profile_image_url',
      message: 'Invalid image URL',
      severity: 'error',
    });
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
  };
}

// Helper functions
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
