/**
 * Frontend API client
 * Calls real API routes when deployed on Cloudflare Workers.
 * Falls back gracefully if APIs return 503 (no bindings available).
 */

export interface ChatRequest {
  moduleId: string;
  message: string;
  conversationId?: string;
  learnerId?: string;
}

export interface ChatResponse {
  answer: string;
  category: string;
  citations: {
    sourceTitle: string;
    section: string;
    page: number | null;
    version: string;
    relevanceScore: number;
  }[];
  grounding: string;
  recommendedAction: string;
  escalate: boolean;
  conversationId: string;
}

export interface AssessmentSubmission {
  moduleId: string;
  learnerId: string;
  answers: { questionId: string; selectedAnswer: string }[];
}

export interface AssessmentResult {
  attemptId: string;
  resultId: string;
  overallScore: number;
  status: string;
  competencyScores: {
    competencyId: string;
    competencyName: string;
    score: number;
    threshold: number;
    passed: boolean;
    mandatory: boolean;
    critical: boolean;
  }[];
  criticalFailures: string[];
  strengths: string[];
  reviewAreas: string[];
  remediation: { competencyName: string; action: string }[];
}

export interface UploadRequest {
  file: File;
  moduleId: string;
  uploadedBy: string;
  sourceTitle?: string;
}

export interface UploadResponse {
  sourceId: string;
  filename: string;
  status: string;
  chunkCount: number;
  message: string;
}

export interface GenerateRequest {
  moduleId: string;
  requestedBy: string;
  questionKind?: "checkpoint" | "assessment";
}

export interface GenerateResponse {
  generated: number;
  questions: { id: string; questionText: string; competencyId: string; activityTitle: string; status: string }[];
  message: string;
}

class ApiClient {
  private baseUrl = "";
  private authToken: string | null = null;

  /**
   * Set the auth token for authenticated API requests.
   * When set, all requests include an Authorization: Bearer header.
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders() },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error((err as { error: string }).error || `Chat request failed: ${res.status}`);
    }

    return res.json();
  }

  async submitAssessment(req: AssessmentSubmission): Promise<AssessmentResult> {
    const res = await fetch(`${this.baseUrl}/api/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders() },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Submission failed" }));
      throw new Error((err as { error: string }).error || `Assessment submission failed: ${res.status}`);
    }

    return res.json();
  }

  async uploadFile(req: UploadRequest): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", req.file);
    formData.append("moduleId", req.moduleId);
    formData.append("uploadedBy", req.uploadedBy);
    if (req.sourceTitle) formData.append("sourceTitle", req.sourceTitle);

    const res = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      headers: { ...this.getAuthHeaders() },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error((err as { error: string }).error || `Upload failed: ${res.status}`);
    }

    return res.json();
  }

  async generateQuestions(req: GenerateRequest): Promise<GenerateResponse> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders() },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Generation failed" }));
      throw new Error((err as { error: string }).error || `Generation failed: ${res.status}`);
    }

    return res.json();
  }

  async getModules(params?: { status?: string; ownerId?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.ownerId) searchParams.set("ownerId", params.ownerId);
    const qs = searchParams.toString();

    const res = await fetch(`${this.baseUrl}/api/modules${qs ? `?${qs}` : ""}`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to load modules");
    return res.json();
  }

  async getInsights(moduleId: string) {
    const res = await fetch(`${this.baseUrl}/api/insights?moduleId=${moduleId}`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to load insights");
    return res.json();
  }

  async getCheckpoints(moduleId: string, status?: string) {
    const params = new URLSearchParams({ moduleId });
    if (status) params.set("status", status);
    const res = await fetch(`${this.baseUrl}/api/checkpoints?${params.toString()}`, {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to load checkpoints");
    return res.json();
  }

  async updateCheckpoint(questionId: string, action: "approve" | "reject" | "edit", updates?: Record<string, unknown>, approvedBy?: string) {
    const res = await fetch(`${this.baseUrl}/api/checkpoints`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...this.getAuthHeaders() },
      body: JSON.stringify({ questionId, action, updates, approvedBy }),
    });
    if (!res.ok) throw new Error("Failed to update checkpoint");
    return res.json();
  }
}

// Singleton instance
export const apiClient = new ApiClient();
