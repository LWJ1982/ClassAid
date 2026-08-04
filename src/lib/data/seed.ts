/**
 * Seeded Demo Data
 * Module: Digital Multimeter Fundamentals and Safety
 * Cross-domain configurable — this module demonstrates electrical/electronics domain
 */

import type {
  Domain,
  LearningModule,
  ModuleVersion,
  LearningObjective,
  Competency,
  GuidedActivity,
  AssessmentQuestion,
  DemoUser,
  CohortMetrics,
  Misconception,
  InterventionItem,
  ModuleRegistryEntry,
  AuditEvent,
} from '../domain/types';

// Demo Users
export const demoUsers: DemoUser[] = [
  { id: 'user-learner-1', name: 'Alex Tan', role: 'learner', email: 'alex.tan@university.edu' },
  { id: 'user-instructor-1', name: 'Dr Sarah Lim', role: 'instructor', email: 's.lim@university.edu' },
  { id: 'user-admin-1', name: 'Daniel Wong', role: 'admin', email: 'd.wong@university.edu' },
];

// Domain
export const domain: Domain = {
  id: 'domain-1',
  name: 'Electrical & Electronics Engineering',
  description: 'Measurement, circuits, instrumentation, and electrical safety',
  complianceLabel: 'Laboratory Safety Compliance',
};

// Module
export const learningModule: LearningModule = {
  id: 'module-1',
  domainId: 'domain-1',
  title: 'Digital Multimeter Fundamentals and Safety',
  description:
    'Prepare for hands-on multimeter use by understanding measurement principles, correct connection procedures, safety requirements, and common error sources.',
  ownerId: 'user-instructor-1',
  status: 'published',
  activeVersionId: 'version-1',
  estimatedMinutes: 25,
};

// Module Version
export const moduleVersion: ModuleVersion = {
  id: 'version-1',
  moduleId: 'module-1',
  version: '1.2.0',
  approvalStatus: 'published',
  publishedAt: '2026-07-28T10:00:00Z',
  lastReviewedAt: '2026-07-25T14:30:00Z',
  sourceVersion: 'DMM-Manual-v3.1',
};

// Learning Objectives
export const objectives: LearningObjective[] = [
  {
    id: 'obj-1',
    moduleVersionId: 'version-1',
    title: 'Measurement Principles',
    description: 'Explain how voltage, current, and resistance are measured and why connection method matters.',
    sequence: 1,
  },
  {
    id: 'obj-2',
    moduleVersionId: 'version-1',
    title: 'Correct Connection Procedures',
    description: 'Identify the correct probe connections, measurement mode selection, and circuit interaction for each measurement type.',
    sequence: 2,
  },
  {
    id: 'obj-3',
    moduleVersionId: 'version-1',
    title: 'Safety Requirements',
    description: 'Recognise critical safety rules including maximum ratings, PPE requirements, and prohibited actions.',
    sequence: 3,
  },
  {
    id: 'obj-4',
    moduleVersionId: 'version-1',
    title: 'Error Recognition',
    description: 'Identify common measurement errors, their causes, and how to avoid them.',
    sequence: 4,
  },
];

// Competencies
export const competencies: Competency[] = [
  {
    id: 'comp-1',
    moduleVersionId: 'version-1',
    name: 'Measurement Theory',
    description: 'Understanding of voltage, current, and resistance measurement principles',
    weight: 0.25,
    minimumThreshold: 0.6,
    mandatory: true,
    critical: false,
  },
  {
    id: 'comp-2',
    moduleVersionId: 'version-1',
    name: 'Connection Procedures',
    description: 'Correct probe placement and mode selection for each measurement type',
    weight: 0.30,
    minimumThreshold: 0.7,
    mandatory: true,
    critical: false,
  },
  {
    id: 'comp-3',
    moduleVersionId: 'version-1',
    name: 'Safety Compliance',
    description: 'Critical safety rules, PPE, and prohibited actions',
    weight: 0.30,
    minimumThreshold: 0.8,
    mandatory: true,
    critical: true,
  },
  {
    id: 'comp-4',
    moduleVersionId: 'version-1',
    name: 'Error Awareness',
    description: 'Common measurement errors and their prevention',
    weight: 0.15,
    minimumThreshold: 0.5,
    mandatory: false,
    critical: false,
  },
];

// Guided Activities (7 steps)
export const activities: GuidedActivity[] = [
  {
    id: 'act-1',
    moduleVersionId: 'version-1',
    title: 'Understanding Your Digital Multimeter',
    activityType: 'instruction',
    sequence: 1,
    content:
      'A digital multimeter (DMM) measures voltage, current, and resistance. The display shows the measured value, while the rotary selector chooses the measurement function and range. Most modern DMMs have auto-ranging capability.',
    explanation:
      'The DMM is the most common instrument in electronics laboratories. Understanding its functions before use prevents measurement errors and equipment damage.',
    warning: null,
    linkedCompetencyId: 'comp-1',
  },
  {
    id: 'act-2',
    moduleVersionId: 'version-1',
    title: 'Voltage Measurement — Parallel Connection',
    activityType: 'demonstration',
    sequence: 2,
    content:
      'Voltage is always measured in PARALLEL with the component. Connect the red probe to the V/\u03A9 terminal and the black probe to COM. Place probes across the component while the circuit is energised. The multimeter presents very high input impedance so it draws negligible current.',
    explanation:
      'Parallel connection means the multimeter measures the potential difference across the component without significantly altering circuit behaviour.',
    warning: null,
    linkedCompetencyId: 'comp-2',
  },
  {
    id: 'act-3',
    moduleVersionId: 'version-1',
    title: 'Current Measurement — Series Connection',
    activityType: 'demonstration',
    sequence: 3,
    content:
      'Current is measured in SERIES with the circuit. You must break the circuit and insert the multimeter so all current flows through it. Connect the red probe to the mA/A terminal (not the V/\u03A9 terminal). Select the appropriate current range BEFORE connecting.',
    explanation:
      'Series connection ensures all circuit current passes through the meter. Using the wrong terminal or connecting in parallel while in current mode can blow the internal fuse or damage the meter.',
    warning: 'Never connect the multimeter in parallel when set to current measurement mode. This creates a short circuit.',
    linkedCompetencyId: 'comp-2',
  },
  {
    id: 'act-4',
    moduleVersionId: 'version-1',
    title: 'Critical Safety Rules',
    activityType: 'warning',
    sequence: 4,
    content:
      'CRITICAL RULES:\n1. Never exceed the maximum input voltage rating (typically 600V CAT III or 1000V CAT II).\n2. Always verify the measurement mode BEFORE connecting probes to a live circuit.\n3. Never measure resistance in a live (energised) circuit.\n4. Use appropriate PPE (safety glasses, insulated gloves for >50V).\n5. Inspect probe insulation before every use — do not use damaged probes.',
    explanation:
      'These rules are non-negotiable. Violation can cause equipment damage, electric shock, arc flash, or fire. A failure to demonstrate understanding of any critical rule prevents a Ready status.',
    warning: 'Failure to follow these rules can result in serious injury or death. These are mandatory requirements.',
    linkedCompetencyId: 'comp-3',
  },
  {
    id: 'act-5',
    moduleVersionId: 'version-1',
    title: 'Resistance Measurement Procedure',
    activityType: 'instruction',
    sequence: 5,
    content:
      'To measure resistance: 1) De-energise the circuit completely. 2) Disconnect the component if possible. 3) Select resistance mode (\u03A9). 4) Connect probes across the component. 5) Read the value. The meter applies a small test voltage — if the circuit is live, the reading will be incorrect and the meter may be damaged.',
    explanation:
      'Resistance measurement requires a de-energised circuit because the DMM injects its own test signal. External voltage interferes with this signal and can damage the meter.',
    warning: 'Always ensure the circuit is completely de-energised before measuring resistance.',
    linkedCompetencyId: 'comp-2',
  },
  {
    id: 'act-6',
    moduleVersionId: 'version-1',
    title: 'Common Measurement Errors',
    activityType: 'practice',
    sequence: 6,
    content:
      'Common errors to recognise:\n- Probes in wrong terminals (V terminal when measuring current)\n- Wrong mode selected (AC vs DC)\n- Measuring resistance in a live circuit\n- Not zeroing the meter before low-resistance measurement\n- Loose probe connections giving unstable readings\n- Exceeding the range (reading shows "OL" or "1.")',
    explanation:
      'Recognising these error patterns helps you troubleshoot unexpected readings before assuming the circuit has a fault.',
    warning: null,
    linkedCompetencyId: 'comp-4',
  },
  {
    id: 'act-7',
    moduleVersionId: 'version-1',
    title: 'Pre-Lab Checklist Review',
    activityType: 'reflection',
    sequence: 7,
    content:
      'Before entering the laboratory, confirm you can answer:\n- How do I connect probes for voltage vs current measurement?\n- What mode and terminal do I use for each measurement?\n- What must I check before measuring resistance?\n- What are the critical safety rules I must never violate?\n- How do I recognise a measurement error?',
    explanation:
      'This checklist mirrors what your readiness assessment will evaluate. If you cannot answer these confidently, review the relevant steps above.',
    warning: null,
    linkedCompetencyId: 'comp-1',
  },
];

// Assessment Questions (5 questions, 2 critical)
export const questions: AssessmentQuestion[] = [
  {
    id: 'q-1',
    moduleVersionId: 'version-1',
    competencyId: 'comp-1',
    questionText: 'Why must voltage be measured in parallel with a component rather than in series?',
    questionType: 'multiple-choice',
    options: [
      'Because the multimeter needs high current to measure voltage',
      'Because parallel connection allows the meter to measure potential difference without significantly altering circuit current',
      'Because series connection would give a higher voltage reading',
      'Because the multimeter cannot physically be connected in series',
    ],
    correctAnswer: 'Because parallel connection allows the meter to measure potential difference without significantly altering circuit current',
    explanation:
      'A voltmeter has very high input impedance and is connected in parallel to measure the potential difference across a component without drawing significant current from the circuit.',
    critical: false,
    sourceReference: 'DMM Manual v3.1, Section 2.1 — Voltage Measurement Principles',
  },
  {
    id: 'q-2',
    moduleVersionId: 'version-1',
    competencyId: 'comp-2',
    questionText: 'When measuring current, which terminal should the red probe be connected to?',
    questionType: 'multiple-choice',
    options: [
      'The V/\u03A9 terminal',
      'The COM terminal',
      'The mA/A terminal',
      'Any terminal — it does not matter for current measurement',
    ],
    correctAnswer: 'The mA/A terminal',
    explanation:
      'For current measurement, the red probe must be in the mA or A terminal (depending on expected range). Using the V/\u03A9 terminal while in current mode creates a short circuit path.',
    critical: false,
    sourceReference: 'DMM Manual v3.1, Section 3.2 — Current Measurement Connections',
  },
  {
    id: 'q-3',
    moduleVersionId: 'version-1',
    competencyId: 'comp-3',
    questionText: 'What must you verify BEFORE connecting multimeter probes to a live circuit?',
    questionType: 'multiple-choice',
    options: [
      'That the battery is fully charged',
      'That the measurement mode and range are correctly set for the intended measurement',
      'That the display backlight is working',
      'That the auto-range feature is enabled',
    ],
    correctAnswer: 'That the measurement mode and range are correctly set for the intended measurement',
    explanation:
      'Connecting probes with the wrong mode selected (e.g., current mode when intending voltage) can create dangerous short circuits, blow fuses, or damage equipment. Always verify mode BEFORE connecting to a live circuit.',
    critical: true,
    sourceReference: 'DMM Manual v3.1, Section 5.1 — Critical Safety Procedures',
  },
  {
    id: 'q-4',
    moduleVersionId: 'version-1',
    competencyId: 'comp-3',
    questionText: 'Why is it dangerous to measure resistance in a live (energised) circuit?',
    questionType: 'multiple-choice',
    options: [
      'It gives slightly inaccurate readings',
      'The display may flicker',
      'The external voltage can damage the meter, give false readings, and create a safety hazard',
      'It only matters for resistance values above 1M\u03A9',
    ],
    correctAnswer: 'The external voltage can damage the meter, give false readings, and create a safety hazard',
    explanation:
      'The DMM injects a small test voltage for resistance measurement. External circuit voltage overwhelms this signal, causing incorrect readings, potential meter damage, and possible shock or arc hazard. Always de-energise before measuring resistance.',
    critical: true,
    sourceReference: 'DMM Manual v3.1, Section 5.3 — Resistance Measurement Safety',
  },
  {
    id: 'q-5',
    moduleVersionId: 'version-1',
    competencyId: 'comp-4',
    questionText: 'You see "OL" on the multimeter display while measuring resistance. What does this most likely indicate?',
    questionType: 'multiple-choice',
    options: [
      'The battery is low',
      'The circuit is open (infinite resistance) or the component value exceeds the selected range',
      'The probes are connected correctly',
      'The measurement is complete and should be recorded as zero',
    ],
    correctAnswer: 'The circuit is open (infinite resistance) or the component value exceeds the selected range',
    explanation:
      '"OL" (overload) means the resistance is beyond the meter\'s ability to measure in the current range. This typically means an open circuit, a disconnected component, or a need to select a higher range.',
    critical: false,
    sourceReference: 'DMM Manual v3.1, Section 6.2 — Interpreting Display Indicators',
  },
];

// Instructor mock data
export const cohortMetrics: CohortMetrics = {
  moduleId: 'module-1',
  moduleTitle: 'Digital Multimeter Fundamentals and Safety',
  assigned: 30,
  started: 27,
  completed: 24,
  completionRate: 0.80,
  readinessDistribution: {
    READY: 18,
    REVIEW_REQUIRED: 4,
    FURTHER_PREPARATION: 2,
    ESCALATE: 0,
  },
  competencyAverages: [
    { competencyName: 'Measurement Theory', average: 0.82 },
    { competencyName: 'Connection Procedures', average: 0.75 },
    { competencyName: 'Safety Compliance', average: 0.88 },
    { competencyName: 'Error Awareness', average: 0.71 },
  ],
};

export const misconceptions: Misconception[] = [
  {
    id: 'misc-1',
    questionId: 'q-1',
    questionText: 'Why must voltage be measured in parallel?',
    competencyName: 'Measurement Theory',
    incorrectAnswer: 'Because the multimeter needs high current to measure voltage',
    frequency: 7,
    isCritical: false,
  },
  {
    id: 'misc-2',
    questionId: 'q-3',
    questionText: 'What must you verify BEFORE connecting to a live circuit?',
    competencyName: 'Safety Compliance',
    incorrectAnswer: 'That the battery is fully charged',
    frequency: 4,
    isCritical: true,
  },
  {
    id: 'misc-3',
    questionId: 'q-2',
    questionText: 'Which terminal for current measurement?',
    competencyName: 'Connection Procedures',
    incorrectAnswer: 'The V/\u03A9 terminal',
    frequency: 5,
    isCritical: false,
  },
  {
    id: 'misc-4',
    questionId: 'q-4',
    questionText: 'Why is measuring resistance in a live circuit dangerous?',
    competencyName: 'Safety Compliance',
    incorrectAnswer: 'It gives slightly inaccurate readings',
    frequency: 3,
    isCritical: true,
  },
];

export const interventionList: InterventionItem[] = [
  {
    learnerId: 'learner-2',
    learnerName: 'Marcus Chen',
    status: 'REVIEW_REQUIRED',
    failedCompetencies: ['Safety Compliance'],
    criticalFailures: ['Failed to identify mode verification as critical safety step'],
    lastAttemptAt: '2026-08-03T14:22:00Z',
    attemptCount: 1,
  },
  {
    learnerId: 'learner-5',
    learnerName: 'Priya Sharma',
    status: 'FURTHER_PREPARATION',
    failedCompetencies: ['Connection Procedures', 'Error Awareness'],
    criticalFailures: [],
    lastAttemptAt: '2026-08-03T11:45:00Z',
    attemptCount: 2,
  },
  {
    learnerId: 'learner-8',
    learnerName: 'James Okafor',
    status: 'REVIEW_REQUIRED',
    failedCompetencies: ['Safety Compliance'],
    criticalFailures: ['Failed to identify resistance measurement hazard'],
    lastAttemptAt: '2026-08-03T16:10:00Z',
    attemptCount: 1,
  },
  {
    learnerId: 'learner-12',
    learnerName: 'Emma Rodriguez',
    status: 'REVIEW_REQUIRED',
    failedCompetencies: ['Measurement Theory'],
    criticalFailures: [],
    lastAttemptAt: '2026-08-02T09:30:00Z',
    attemptCount: 1,
  },
];

// Admin data
export const moduleRegistry: ModuleRegistryEntry[] = [
  {
    moduleId: 'module-1',
    title: 'Digital Multimeter Fundamentals and Safety',
    domain: 'Electrical & Electronics Engineering',
    owner: 'Dr Sarah Lim',
    activeVersion: '1.2.0',
    sourceVersion: 'DMM-Manual-v3.1',
    status: 'published',
    publishedAt: '2026-07-28T10:00:00Z',
    lastReviewedAt: '2026-07-25T14:30:00Z',
    totalAttempts: 24,
    completionRate: 0.80,
  },
  {
    moduleId: 'module-2',
    title: 'Oscilloscope Operation and Signal Analysis',
    domain: 'Electrical & Electronics Engineering',
    owner: 'Dr Sarah Lim',
    activeVersion: '0.9.0',
    sourceVersion: 'OSC-Manual-v2.0',
    status: 'draft',
    publishedAt: null,
    lastReviewedAt: '2026-07-20T11:00:00Z',
    totalAttempts: 0,
    completionRate: 0,
  },
];

export const auditEvents: AuditEvent[] = [
  {
    id: 'audit-1',
    actorId: 'user-instructor-1',
    actorName: 'Dr Sarah Lim',
    action: 'MODULE_PUBLISHED',
    entityType: 'ModuleVersion',
    entityId: 'version-1',
    timestamp: '2026-07-28T10:00:00Z',
    details: 'Published version 1.2.0 of Digital Multimeter Fundamentals and Safety',
  },
  {
    id: 'audit-2',
    actorId: 'user-instructor-1',
    actorName: 'Dr Sarah Lim',
    action: 'QUESTIONS_APPROVED',
    entityType: 'AssessmentQuestion',
    entityId: 'module-1',
    timestamp: '2026-07-25T14:30:00Z',
    details: 'Approved 5 assessment questions including 2 critical safety questions',
  },
  {
    id: 'audit-3',
    actorId: 'user-admin-1',
    actorName: 'Daniel Wong',
    action: 'SOURCE_UPDATED',
    entityType: 'Source',
    entityId: 'module-1',
    timestamp: '2026-07-22T09:15:00Z',
    details: 'Updated source material to DMM-Manual-v3.1',
  },
  {
    id: 'audit-4',
    actorId: 'user-instructor-1',
    actorName: 'Dr Sarah Lim',
    action: 'THRESHOLD_CHANGED',
    entityType: 'Competency',
    entityId: 'comp-3',
    timestamp: '2026-07-20T16:45:00Z',
    details: 'Safety Compliance minimum threshold changed from 0.7 to 0.8',
  },
];

// Coach responses (mocked Dify responses)
export interface MockCoachEntry {
  keywords: string[];
  response: {
    answer: string;
    category: 'CONCEPT' | 'PROCEDURE' | 'APPLICATION' | 'TROUBLESHOOTING' | 'COMPLIANCE' | 'OUT_OF_SCOPE';
    citations: { sourceTitle: string; section: string; version: string }[];
    grounding: 'SUPPORTED' | 'PARTIAL' | 'INSUFFICIENT';
    recommendedAction: string;
    escalate: boolean;
  };
}

export const coachResponses: MockCoachEntry[] = [
  {
    keywords: ['voltage', 'parallel', 'why'],
    response: {
      answer:
        'Voltage is the potential difference between two points in a circuit. To measure this difference, the multimeter must be connected across (in parallel with) the component. Because the multimeter has very high input impedance (typically >10M\u03A9), it draws negligible current and does not significantly affect the circuit being measured.',
      category: 'CONCEPT',
      citations: [
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 2.1 — Voltage Measurement Principles', version: '3.1' },
      ],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review Activity 2: Voltage Measurement for the full connection procedure.',
      escalate: false,
    },
  },
  {
    keywords: ['current', 'series', 'connect', 'terminal', 'probe'],
    response: {
      answer:
        'For current measurement, you must break the circuit and insert the multimeter in series so that all current flows through it. The red probe connects to the mA/A terminal (not the V/\u03A9 terminal). Using the wrong terminal while measuring current creates a very low resistance path that can short-circuit the power source, blow the meter fuse, or cause damage.',
      category: 'PROCEDURE',
      citations: [
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 3.2 — Current Measurement Connections', version: '3.1' },
      ],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review Activity 3: Current Measurement for the step-by-step procedure.',
      escalate: false,
    },
  },
  {
    keywords: ['safety', 'danger', 'risk', 'shock', 'ppe', 'protect'],
    response: {
      answer:
        'The critical safety rules for multimeter use include: (1) Never exceed maximum input voltage ratings, (2) Always verify measurement mode before connecting to live circuits, (3) Never measure resistance in energised circuits, (4) Use appropriate PPE for voltages above 50V, and (5) Inspect probe insulation before every use. These rules are mandatory and non-negotiable.',
      category: 'COMPLIANCE',
      citations: [
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 5.1 — Critical Safety Procedures', version: '3.1' },
      ],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review Activity 4: Critical Safety Rules. Understanding these is required for readiness.',
      escalate: false,
    },
  },
  {
    keywords: ['resistance', 'ohm', 'measure', 'live'],
    response: {
      answer:
        'Resistance must only be measured in a de-energised circuit. The DMM injects a small test voltage to calculate resistance using Ohm\'s law. If the circuit is live, the external voltage overwhelms the test signal, producing incorrect readings and potentially damaging the meter. Always disconnect power and verify the circuit is dead before switching to resistance mode.',
      category: 'PROCEDURE',
      citations: [
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 4.1 — Resistance Measurement', version: '3.1' },
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 5.3 — Resistance Measurement Safety', version: '3.1' },
      ],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review Activity 5: Resistance Measurement Procedure for the complete workflow.',
      escalate: false,
    },
  },
  {
    keywords: ['error', 'wrong', 'mistake', 'ol', 'overload', 'reading'],
    response: {
      answer:
        'Common measurement errors include: probes in wrong terminals, wrong mode selected (AC vs DC), measuring resistance in a live circuit, not zeroing before low-resistance measurement, loose probe connections, and exceeding the measurement range. "OL" on the display indicates an open circuit or that the value exceeds the selected range.',
      category: 'TROUBLESHOOTING',
      citations: [
        { sourceTitle: 'DMM Manual v3.1', section: 'Section 6.2 — Interpreting Display Indicators', version: '3.1' },
      ],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review Activity 6: Common Measurement Errors for the full error catalogue.',
      escalate: false,
    },
  },
  {
    keywords: ['answer', 'quiz', 'assessment', 'correct', 'tell me the answer'],
    response: {
      answer:
        'I cannot reveal answers to active assessment questions. However, I can help you understand the underlying concepts. Think about what each measurement type requires in terms of circuit connection. Would you like me to explain the principle behind a specific measurement technique?',
      category: 'OUT_OF_SCOPE',
      citations: [],
      grounding: 'SUPPORTED',
      recommendedAction: 'Review the relevant guided activity section for the concept you need help with.',
      escalate: false,
    },
  },
];

// Fallback response for unmatched questions
export const coachFallback = {
  answer:
    'The approved material for this module does not provide enough information to answer this reliably. I can help with questions about voltage/current/resistance measurement, connection procedures, safety rules, and common errors. For topics outside this scope, please consult the responsible instructor.',
  category: 'OUT_OF_SCOPE' as const,
  citations: [],
  grounding: 'INSUFFICIENT' as const,
  recommendedAction: 'Review the module material or consult the responsible instructor.',
  escalate: true,
};
