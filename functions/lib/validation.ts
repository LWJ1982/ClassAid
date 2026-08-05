/**
 * Zod validation schemas for all API request bodies
 */

import { z } from 'zod';

/** Chat request validation */
export const chatRequestSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required'),
  message: z.string().min(1, 'message is required').max(2000, 'Message exceeds maximum length of 2000 characters'),
  conversationId: z.string().optional(),
  learnerId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Assessment submission validation */
export const assessmentRequestSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required'),
  learnerId: z.string().min(1, 'learnerId is required'),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedAnswer: z.string().min(1),
    })
  ).min(1, 'answers are required'),
});

export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;

/** Upload request validation (for formData fields) */
export const uploadFieldsSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required'),
  uploadedBy: z.string().min(1, 'uploadedBy is required'),
  sourceTitle: z.string().optional(),
});

export type UploadFields = z.infer<typeof uploadFieldsSchema>;

/** Generate questions request validation */
export const generateRequestSchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required'),
  requestedBy: z.string().min(1, 'requestedBy is required'),
  questionKind: z.enum(['assessment', 'checkpoint']).optional().default('checkpoint'),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/** Checkpoint PATCH request validation */
export const checkpointPatchSchema = z.object({
  questionId: z.string().min(1, 'questionId is required'),
  action: z.enum(['approve', 'reject'], { message: 'action must be "approve" or "reject"' }),
  approvedBy: z.string().optional(),
});

export type CheckpointPatch = z.infer<typeof checkpointPatchSchema>;

/** Modules query params validation */
export const modulesQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export type ModulesQuery = z.infer<typeof modulesQuerySchema>;

/** Insights query params validation */
export const insightsQuerySchema = z.object({
  moduleId: z.string().min(1, 'moduleId is required'),
});

export type InsightsQuery = z.infer<typeof insightsQuerySchema>;
