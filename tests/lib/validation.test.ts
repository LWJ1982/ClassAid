import { describe, it, expect } from 'vitest';
import {
  chatRequestSchema,
  assessmentRequestSchema,
  uploadFieldsSchema,
  generateRequestSchema,
  checkpointPatchSchema,
} from '../../functions/lib/validation';

describe('Validation Schemas', () => {
  describe('chatRequestSchema', () => {
    it('accepts valid chat request', () => {
      const input = {
        moduleId: 'mod-123',
        message: 'What is the difference between TCP and UDP?',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts chat request with optional fields', () => {
      const input = {
        moduleId: 'mod-123',
        message: 'Hello',
        conversationId: 'conv-456',
        learnerId: 'user-789',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects empty message', () => {
      const input = {
        moduleId: 'mod-123',
        message: '',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects message exceeding 2000 characters', () => {
      const input = {
        moduleId: 'mod-123',
        message: 'x'.repeat(2001),
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('accepts message at exactly 2000 characters', () => {
      const input = {
        moduleId: 'mod-123',
        message: 'x'.repeat(2000),
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects missing moduleId', () => {
      const input = {
        message: 'Hello',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty moduleId', () => {
      const input = {
        moduleId: '',
        message: 'Hello',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing message', () => {
      const input = {
        moduleId: 'mod-123',
      };
      const result = chatRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('assessmentRequestSchema', () => {
    it('accepts valid assessment request', () => {
      const input = {
        moduleId: 'mod-123',
        learnerId: 'user-456',
        answers: [
          { questionId: 'q-1', selectedAnswer: 'A' },
          { questionId: 'q-2', selectedAnswer: 'B' },
        ],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects missing moduleId', () => {
      const input = {
        learnerId: 'user-456',
        answers: [{ questionId: 'q-1', selectedAnswer: 'A' }],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing learnerId', () => {
      const input = {
        moduleId: 'mod-123',
        answers: [{ questionId: 'q-1', selectedAnswer: 'A' }],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty answers array', () => {
      const input = {
        moduleId: 'mod-123',
        learnerId: 'user-456',
        answers: [],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects answer with empty questionId', () => {
      const input = {
        moduleId: 'mod-123',
        learnerId: 'user-456',
        answers: [{ questionId: '', selectedAnswer: 'A' }],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects answer with empty selectedAnswer', () => {
      const input = {
        moduleId: 'mod-123',
        learnerId: 'user-456',
        answers: [{ questionId: 'q-1', selectedAnswer: '' }],
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing answers field', () => {
      const input = {
        moduleId: 'mod-123',
        learnerId: 'user-456',
      };
      const result = assessmentRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('uploadFieldsSchema', () => {
    it('accepts valid upload fields', () => {
      const input = {
        moduleId: 'mod-123',
        uploadedBy: 'instructor-1',
      };
      const result = uploadFieldsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts upload fields with optional sourceTitle', () => {
      const input = {
        moduleId: 'mod-123',
        uploadedBy: 'instructor-1',
        sourceTitle: 'Lab Safety Guide',
      };
      const result = uploadFieldsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects missing moduleId', () => {
      const input = {
        uploadedBy: 'instructor-1',
      };
      const result = uploadFieldsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing uploadedBy', () => {
      const input = {
        moduleId: 'mod-123',
      };
      const result = uploadFieldsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('generateRequestSchema', () => {
    it('accepts valid generate request', () => {
      const input = {
        moduleId: 'mod-123',
        requestedBy: 'instructor-1',
      };
      const result = generateRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionKind).toBe('checkpoint'); // default
      }
    });

    it('accepts explicit questionKind', () => {
      const input = {
        moduleId: 'mod-123',
        requestedBy: 'instructor-1',
        questionKind: 'assessment',
      };
      const result = generateRequestSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionKind).toBe('assessment');
      }
    });

    it('rejects invalid questionKind', () => {
      const input = {
        moduleId: 'mod-123',
        requestedBy: 'instructor-1',
        questionKind: 'invalid',
      };
      const result = generateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing requestedBy', () => {
      const input = {
        moduleId: 'mod-123',
      };
      const result = generateRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('checkpointPatchSchema', () => {
    it('accepts valid approve action', () => {
      const input = {
        questionId: 'q-123',
        action: 'approve',
      };
      const result = checkpointPatchSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('accepts valid reject action', () => {
      const input = {
        questionId: 'q-123',
        action: 'reject',
      };
      const result = checkpointPatchSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects invalid action', () => {
      const input = {
        questionId: 'q-123',
        action: 'delete',
      };
      const result = checkpointPatchSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty questionId', () => {
      const input = {
        questionId: '',
        action: 'approve',
      };
      const result = checkpointPatchSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects missing action', () => {
      const input = {
        questionId: 'q-123',
      };
      const result = checkpointPatchSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
