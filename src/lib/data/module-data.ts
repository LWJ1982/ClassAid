import type { LearningModule, ModuleVersion, LearningObjective, Competency, GuidedActivity, AssessmentQuestion, Domain, CheckpointQuestion } from "@/lib/domain/types";
import {
  learningModule, csModule,
  moduleVersion, csModuleVersion,
  objectives, csObjectives,
  competencies, csCompetencies,
  activities, csActivities,
  questions, csQuestions,
  domain, domainCS,
  checkpointQuestions, csCheckpointQuestions,
} from "@/lib/data/seed";

export interface ModuleData {
  module: LearningModule;
  version: ModuleVersion;
  objectives: LearningObjective[];
  competencies: Competency[];
  activities: GuidedActivity[];
  questions: AssessmentQuestion[];
  domain: Domain;
  checkpoints: CheckpointQuestion[];
}

const moduleDataMap: Record<string, ModuleData> = {
  "module-1": {
    module: learningModule,
    version: moduleVersion,
    objectives,
    competencies,
    activities,
    questions,
    domain,
    checkpoints: checkpointQuestions,
  },
  "module-2": {
    module: csModule,
    version: csModuleVersion,
    objectives: csObjectives,
    competencies: csCompetencies,
    activities: csActivities,
    questions: csQuestions,
    domain: domainCS,
    checkpoints: csCheckpointQuestions,
  },
};

export function getModuleDataById(moduleId: string): ModuleData | null {
  return moduleDataMap[moduleId] ?? null;
}
