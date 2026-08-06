/**
 * Seeded Demo Data
 * Cross-domain configurable — demonstrates multiple domain modules
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
  CheckpointQuestion,
  StepFriction,
} from '../domain/types';

// Demo Users (7 accounts: 4 learners, 2 instructors, 1 admin)
export const demoUsers: DemoUser[] = [
  { id: 'user-learner-1', name: 'Alex Tan', role: 'learner', email: 'alex.tan@university.edu', domainId: 'domain-1' },
  { id: 'user-learner-2', name: 'Rachel Ng', role: 'learner', email: 'rachel.ng@university.edu', domainId: 'domain-1' },
  { id: 'user-learner-3', name: 'Jordan Lee', role: 'learner', email: 'jordan.lee@university.edu', domainId: 'domain-2' },
  { id: 'user-learner-4', name: 'Mei Chen', role: 'learner', email: 'mei.chen@university.edu', domainId: 'domain-2' },
  { id: 'user-instructor-1', name: 'Dr Sarah Lim', role: 'instructor', email: 's.lim@university.edu', domainId: 'domain-1' },
  { id: 'user-instructor-2', name: 'Prof David Tan', role: 'instructor', email: 'd.tan@university.edu', domainId: 'domain-2' },
  { id: 'user-admin-1', name: 'Daniel Wong', role: 'admin', email: 'd.wong@university.edu' },
];

// Domains
export const domain: Domain = {
  id: 'domain-1',
  name: 'Electrical & Electronics Engineering',
  description: 'Measurement, circuits, instrumentation, and electrical safety',
  complianceLabel: 'Laboratory Safety Compliance',
};

export const domainCS: Domain = {
  id: 'domain-2',
  name: 'Computer Science',
  description: 'Programming fundamentals, algorithms, data structures, and software development practices',
  complianceLabel: 'Academic Integrity',
};

export const domains: Domain[] = [domain, domainCS];

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
    title: 'Introduction to Sorting Algorithms',
    domain: 'Computer Science',
    owner: 'Prof David Tan',
    activeVersion: '1.0.0',
    sourceVersion: 'SortAlg-Textbook-v2.0',
    status: 'published',
    publishedAt: '2026-08-01T09:00:00Z',
    lastReviewedAt: '2026-07-30T16:00:00Z',
    totalAttempts: 20,
    completionRate: 0.80,
  },
  {
    moduleId: 'module-3',
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


// ============================================================
// ADAPTIVE LEARNING — Comprehension Checkpoint Questions
// Auto-generated from activity content, requiring instructor approval
// ============================================================

export const checkpointQuestions: CheckpointQuestion[] = [
  {
    id: 'cp-1',
    activityId: 'act-1',
    moduleVersionId: 'version-1',
    questionText: 'What does the rotary selector on a digital multimeter control?',
    options: [
      'The brightness of the display',
      'The measurement function and range',
      'The battery level indicator',
      'The probe connection type',
    ],
    correctAnswer: 'The measurement function and range',
    explanation: 'The rotary selector chooses which measurement function (voltage, current, resistance) and range the multimeter uses.',
    failureHint: 'Re-read the first paragraph about the rotary selector and its purpose.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:00:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 20,
  },
  {
    id: 'cp-2',
    activityId: 'act-2',
    moduleVersionId: 'version-1',
    questionText: 'How must a voltmeter be connected to measure the potential difference across a component?',
    options: [
      'In series with the component',
      'In parallel with the component',
      'Disconnected from the circuit',
      'Connected to ground only',
    ],
    correctAnswer: 'In parallel with the component',
    explanation: 'Voltage is always measured in parallel — the probes go across the component while the circuit remains intact.',
    failureHint: 'Review the key principle: voltage = parallel connection. Look at how the probes are placed across the component.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:05:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 25,
  },
  {
    id: 'cp-3',
    activityId: 'act-3',
    moduleVersionId: 'version-1',
    questionText: 'What must you do to the circuit before inserting the multimeter for current measurement?',
    options: [
      'Increase the voltage',
      'Break the circuit so current flows through the meter',
      'Add a parallel resistor',
      'Nothing — just touch the probes to any point',
    ],
    correctAnswer: 'Break the circuit so current flows through the meter',
    explanation: 'Current measurement requires series insertion — you must break the circuit and place the meter in-line so all current flows through it.',
    failureHint: 'Focus on the word SERIES. The circuit must be broken so the meter becomes part of the current path.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:10:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 30,
  },
  {
    id: 'cp-4',
    activityId: 'act-4',
    moduleVersionId: 'version-1',
    questionText: 'What is the consequence of failing to verify the measurement mode BEFORE connecting probes to a live circuit?',
    options: [
      'The display shows a slightly wrong number',
      'The backlight turns off',
      'It can create dangerous short circuits, blow fuses, or damage equipment',
      'The auto-range takes longer to settle',
    ],
    correctAnswer: 'It can create dangerous short circuits, blow fuses, or damage equipment',
    explanation: 'Wrong mode + live circuit = potential short circuit, blown fuse, equipment damage, or personal injury. This is a critical safety rule.',
    failureHint: 'THIS IS A CRITICAL SAFETY RULE. Re-read all 5 critical rules carefully. Focus on rule #2 about verifying mode BEFORE connecting.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:15:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 45,
  },
  {
    id: 'cp-5',
    activityId: 'act-5',
    moduleVersionId: 'version-1',
    questionText: 'What is the FIRST step before measuring resistance?',
    options: [
      'Select the highest range',
      'Connect the red probe to the mA terminal',
      'De-energise the circuit completely',
      'Zero the display',
    ],
    correctAnswer: 'De-energise the circuit completely',
    explanation: 'Resistance measurement requires a dead circuit because the DMM injects its own test voltage. External voltage interferes and can damage the meter.',
    failureHint: 'Look at step 1 of the resistance procedure. What must happen BEFORE anything else? The circuit must be...',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:20:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 25,
  },
  {
    id: 'cp-6',
    activityId: 'act-6',
    moduleVersionId: 'version-1',
    questionText: 'If you see "OL" on the display while measuring resistance, what should you suspect?',
    options: [
      'The battery needs replacing',
      'The circuit is open or the value exceeds the selected range',
      'The measurement is complete and correct',
      'The probes are correctly connected',
    ],
    correctAnswer: 'The circuit is open or the value exceeds the selected range',
    explanation: '"OL" means overload — the resistance is beyond what the meter can measure at the current setting.',
    failureHint: 'Look at the error patterns list. Find "OL" and what it indicates about the circuit or range setting.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:25:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 30,
  },
  {
    id: 'cp-7',
    activityId: 'act-7',
    moduleVersionId: 'version-1',
    questionText: 'Before entering the laboratory, which of the following should you be able to answer confidently?',
    options: [
      'The price of the multimeter model',
      'How to connect probes for voltage vs current, safety rules, and how to recognise errors',
      'The manufacturer warranty terms',
      'How to calibrate the meter',
    ],
    correctAnswer: 'How to connect probes for voltage vs current, safety rules, and how to recognise errors',
    explanation: 'The pre-lab checklist covers: connection procedures, mode selection, resistance prerequisites, critical safety rules, and error recognition.',
    failureHint: 'Review the 5 checklist questions. They cover connections, modes, prerequisites, safety, and errors — not administrative details.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-1',
    approvedAt: '2026-07-26T10:30:00Z',
    generatedAt: '2026-07-25T09:00:00Z',
    minimumReadSeconds: 20,
  },
  // Auto-generated but NOT yet approved — instructor must review these
  {
    id: 'cp-8',
    activityId: 'act-2',
    moduleVersionId: 'version-1',
    questionText: 'Why does the multimeter draw negligible current when measuring voltage?',
    options: [
      'Because it uses a very small battery',
      'Because it has very high input impedance (>10MΩ)',
      'Because voltage measurement does not require any current',
      'Because the probes are insulated',
    ],
    correctAnswer: 'Because it has very high input impedance (>10MΩ)',
    explanation: 'High input impedance means very little current flows through the meter, so it does not significantly affect the circuit.',
    failureHint: 'Look for the term "input impedance" in the content. High impedance = very little current drawn.',
    approvalStatus: 'auto_generated',
    approvedBy: null,
    approvedAt: null,
    generatedAt: '2026-08-01T14:00:00Z',
    minimumReadSeconds: 25,
  },
  {
    id: 'cp-9',
    activityId: 'act-4',
    moduleVersionId: 'version-1',
    questionText: 'At what voltage level should insulated gloves be worn as PPE?',
    options: [
      'Above 5V',
      'Above 12V',
      'Above 50V',
      'Above 240V',
    ],
    correctAnswer: 'Above 50V',
    explanation: 'PPE including insulated gloves is required for voltages above 50V as stated in the critical safety rules.',
    failureHint: 'Find rule #4 about PPE requirements. What voltage threshold triggers the need for insulated gloves?',
    approvalStatus: 'auto_generated',
    approvedBy: null,
    approvedAt: null,
    generatedAt: '2026-08-01T14:00:00Z',
    minimumReadSeconds: 45,
  },
];

// Step friction data — how learners struggle with each step (instructor analytics)
export const stepFrictionData: StepFriction[] = [
  {
    activityId: 'act-1',
    activityTitle: 'Understanding Your Digital Multimeter',
    stepNumber: 1,
    totalAttempts: 27,
    firstAttemptPassRate: 0.89,
    averageRetries: 1.1,
    averageTimeSpent: 28,
  },
  {
    activityId: 'act-2',
    activityTitle: 'Voltage Measurement — Parallel Connection',
    stepNumber: 2,
    totalAttempts: 27,
    firstAttemptPassRate: 0.74,
    averageRetries: 1.4,
    averageTimeSpent: 42,
  },
  {
    activityId: 'act-3',
    activityTitle: 'Current Measurement — Series Connection',
    stepNumber: 3,
    totalAttempts: 27,
    firstAttemptPassRate: 0.63,
    averageRetries: 1.8,
    averageTimeSpent: 55,
  },
  {
    activityId: 'act-4',
    activityTitle: 'Critical Safety Rules',
    stepNumber: 4,
    totalAttempts: 27,
    firstAttemptPassRate: 0.56,
    averageRetries: 2.1,
    averageTimeSpent: 72,
  },
  {
    activityId: 'act-5',
    activityTitle: 'Resistance Measurement Procedure',
    stepNumber: 5,
    totalAttempts: 27,
    firstAttemptPassRate: 0.70,
    averageRetries: 1.5,
    averageTimeSpent: 38,
  },
  {
    activityId: 'act-6',
    activityTitle: 'Common Measurement Errors',
    stepNumber: 6,
    totalAttempts: 27,
    firstAttemptPassRate: 0.78,
    averageRetries: 1.3,
    averageTimeSpent: 45,
  },
  {
    activityId: 'act-7',
    activityTitle: 'Pre-Lab Checklist Review',
    stepNumber: 7,
    totalAttempts: 27,
    firstAttemptPassRate: 0.85,
    averageRetries: 1.1,
    averageTimeSpent: 30,
  },
];

// ============================================================
// COMPUTER SCIENCE DOMAIN — Sorting Algorithms Module
// ============================================================

// CS Module
export const csModule: LearningModule = {
  id: 'module-2',
  domainId: 'domain-2',
  title: 'Introduction to Sorting Algorithms',
  description:
    'Understand fundamental sorting algorithms, their time complexities, trade-offs, and appropriate use cases before implementing them in practical exercises.',
  ownerId: 'user-instructor-2',
  status: 'published',
  activeVersionId: 'version-2',
  estimatedMinutes: 20,
};

// CS Module Version
export const csModuleVersion: ModuleVersion = {
  id: 'version-2',
  moduleId: 'module-2',
  version: '1.0.0',
  approvalStatus: 'published',
  publishedAt: '2026-08-01T09:00:00Z',
  lastReviewedAt: '2026-07-30T16:00:00Z',
  sourceVersion: 'SortAlg-Textbook-v2.0',
};

// CS Learning Objectives
export const csObjectives: LearningObjective[] = [
  {
    id: 'cs-obj-1',
    moduleVersionId: 'version-2',
    title: 'Algorithm Complexity',
    description: 'Explain time and space complexity for common sorting algorithms using Big-O notation.',
    sequence: 1,
  },
  {
    id: 'cs-obj-2',
    moduleVersionId: 'version-2',
    title: 'Comparison-Based Sorting',
    description: 'Describe how bubble sort, selection sort, and insertion sort work and identify their performance characteristics.',
    sequence: 2,
  },
  {
    id: 'cs-obj-3',
    moduleVersionId: 'version-2',
    title: 'Divide-and-Conquer Sorting',
    description: 'Explain merge sort and quick sort strategies, including pivot selection and merge operations.',
    sequence: 3,
  },
  {
    id: 'cs-obj-4',
    moduleVersionId: 'version-2',
    title: 'Algorithm Selection',
    description: 'Choose an appropriate sorting algorithm based on data size, structure, and constraints.',
    sequence: 4,
  },
];

// CS Competencies
export const csCompetencies: Competency[] = [
  {
    id: 'cs-comp-1',
    moduleVersionId: 'version-2',
    name: 'Algorithm Analysis',
    description: 'Understanding time and space complexity of sorting algorithms',
    weight: 0.30,
    minimumThreshold: 0.7,
    mandatory: true,
    critical: false,
  },
  {
    id: 'cs-comp-2',
    moduleVersionId: 'version-2',
    name: 'Implementation Patterns',
    description: 'Correct implementation logic for sorting algorithms (swap, partition, merge)',
    weight: 0.30,
    minimumThreshold: 0.7,
    mandatory: true,
    critical: false,
  },
  {
    id: 'cs-comp-3',
    moduleVersionId: 'version-2',
    name: 'Edge Cases',
    description: 'Handling edge cases including empty arrays, duplicates, and already-sorted input',
    weight: 0.20,
    minimumThreshold: 0.6,
    mandatory: true,
    critical: true,
  },
  {
    id: 'cs-comp-4',
    moduleVersionId: 'version-2',
    name: 'Optimization',
    description: 'Choosing appropriate algorithms based on constraints and recognizing optimization opportunities',
    weight: 0.20,
    minimumThreshold: 0.5,
    mandatory: false,
    critical: false,
  },
];

// CS Guided Activities (6 steps)
export const csActivities: GuidedActivity[] = [
  {
    id: 'cs-act-1',
    moduleVersionId: 'version-2',
    title: 'Why Sorting Matters',
    activityType: 'instruction',
    sequence: 1,
    content:
      'Sorting is a fundamental operation in computer science. Efficient sorting enables binary search (O(log n) vs O(n) linear search), database indexing, data deduplication, and many divide-and-conquer strategies. Understanding sorting algorithm trade-offs is essential for making informed implementation decisions.',
    explanation:
      'Sorting underpins many higher-level algorithms and data structures. Choosing the wrong algorithm can make the difference between a program running in seconds vs hours.',
    warning: null,
    linkedCompetencyId: 'cs-comp-4',
  },
  {
    id: 'cs-act-2',
    moduleVersionId: 'version-2',
    title: 'Bubble Sort and Selection Sort',
    activityType: 'demonstration',
    sequence: 2,
    content:
      'Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. After each pass, the largest unsorted element "bubbles" to its correct position. Time complexity: O(n^2) average and worst case, O(n) best case (already sorted with optimization flag).\n\nSelection Sort finds the minimum element from the unsorted portion and places it at the beginning. It always performs O(n^2) comparisons regardless of input order.',
    explanation:
      'These are simple comparison-based algorithms. They are easy to understand and implement but inefficient for large datasets. Bubble sort can be optimized with an early-termination flag if no swaps occur in a pass.',
    warning: null,
    linkedCompetencyId: 'cs-comp-2',
  },
  {
    id: 'cs-act-3',
    moduleVersionId: 'version-2',
    title: 'Merge Sort — Divide and Conquer',
    activityType: 'demonstration',
    sequence: 3,
    content:
      'Merge Sort divides the array into halves recursively until each sub-array has one element, then merges them back in sorted order. The merge operation compares elements from both halves and builds the sorted result.\n\nTime complexity: O(n log n) in ALL cases (best, average, worst). Space complexity: O(n) additional space for the merge buffer. Merge sort is stable (preserves relative order of equal elements).',
    explanation:
      'Merge sort guarantees O(n log n) performance regardless of input, making it predictable. The trade-off is extra memory usage. It is the preferred algorithm when stability matters or worst-case performance must be guaranteed.',
    warning: null,
    linkedCompetencyId: 'cs-comp-1',
  },
  {
    id: 'cs-act-4',
    moduleVersionId: 'version-2',
    title: 'Quick Sort — Pivot and Partition',
    activityType: 'demonstration',
    sequence: 4,
    content:
      'Quick Sort selects a pivot element and partitions the array into elements less than the pivot and elements greater than the pivot, then recursively sorts both partitions.\n\nTime complexity: O(n log n) average case, O(n^2) worst case (when pivot is consistently the smallest or largest element). Space complexity: O(log n) for the recursion stack.\n\nPivot selection strategies include: first element, last element, random element, and median-of-three.',
    explanation:
      'Quick sort is typically faster than merge sort in practice due to better cache performance and lower constant factors, despite the O(n^2) worst case. Good pivot selection (random or median-of-three) makes worst case extremely unlikely.',
    warning: 'A poorly chosen pivot (e.g., always first element on sorted data) degrades quick sort to O(n^2). Always use randomized or median-of-three pivot selection in production code.',
    linkedCompetencyId: 'cs-comp-1',
  },
  {
    id: 'cs-act-5',
    moduleVersionId: 'version-2',
    title: 'Edge Cases and Correctness',
    activityType: 'practice',
    sequence: 5,
    content:
      'Critical edge cases for sorting algorithms:\n- Empty array: should return empty array without error\n- Single element: already sorted, return as-is\n- All elements identical: algorithm must handle without infinite loops\n- Already sorted input: some algorithms (bubble sort) can optimize, others (selection sort) cannot\n- Reverse-sorted input: worst case for naive quick sort with first-element pivot\n- Very large arrays: memory constraints favor in-place algorithms',
    explanation:
      'Failing to handle edge cases leads to bugs, infinite loops, or crashes in production. Every sorting implementation must be tested against these cases.',
    warning: 'Algorithms that fail on empty input or duplicate elements are incorrect. Always test with boundary conditions.',
    linkedCompetencyId: 'cs-comp-3',
  },
  {
    id: 'cs-act-6',
    moduleVersionId: 'version-2',
    title: 'Choosing the Right Algorithm',
    activityType: 'reflection',
    sequence: 6,
    content:
      'Algorithm selection depends on constraints:\n- Small arrays (n < 20): Insertion sort (low overhead despite O(n^2))\n- General purpose: Quick sort (fastest average case, in-place)\n- Guaranteed O(n log n): Merge sort (stable, predictable)\n- Nearly sorted data: Insertion sort (O(n) best case) or Timsort\n- Memory constrained: Quick sort or heap sort (in-place)\n- Stability required: Merge sort or Timsort\n\nBefore implementing, ask: What is my data size? Is it nearly sorted? Do I need stability? What memory is available?',
    explanation:
      'There is no universally best sorting algorithm. The right choice depends on your specific constraints and data characteristics.',
    warning: null,
    linkedCompetencyId: 'cs-comp-4',
  },
];

// CS Assessment Questions (5 questions, 2 critical)
export const csQuestions: AssessmentQuestion[] = [
  {
    id: 'cs-q-1',
    moduleVersionId: 'version-2',
    competencyId: 'cs-comp-1',
    questionText: 'What is the worst-case time complexity of merge sort?',
    questionType: 'multiple-choice',
    options: [
      'O(n)',
      'O(n log n)',
      'O(n^2)',
      'O(log n)',
    ],
    correctAnswer: 'O(n log n)',
    explanation:
      'Merge sort always divides the array in half (log n levels) and performs O(n) work at each level for the merge operation, giving O(n log n) in all cases including worst case.',
    critical: false,
    sourceReference: 'SortAlg-Textbook-v2.0, Chapter 3 — Merge Sort Analysis',
  },
  {
    id: 'cs-q-2',
    moduleVersionId: 'version-2',
    competencyId: 'cs-comp-2',
    questionText: 'In quick sort, what happens during the partition step?',
    questionType: 'multiple-choice',
    options: [
      'The array is divided into two equal halves',
      'Elements are rearranged so that all elements less than the pivot come before it, and all greater come after it',
      'The smallest element is moved to the front',
      'Adjacent elements are compared and swapped',
    ],
    correctAnswer: 'Elements are rearranged so that all elements less than the pivot come before it, and all greater come after it',
    explanation:
      'The partition step places the pivot in its final sorted position, with smaller elements to its left and larger elements to its right. The sub-arrays are then recursively sorted.',
    critical: false,
    sourceReference: 'SortAlg-Textbook-v2.0, Chapter 4 — Quick Sort Partition',
  },
  {
    id: 'cs-q-3',
    moduleVersionId: 'version-2',
    competencyId: 'cs-comp-3',
    questionText: 'What should a correct sorting algorithm do when given an empty array as input?',
    questionType: 'multiple-choice',
    options: [
      'Throw an error because there is nothing to sort',
      'Return null',
      'Return an empty array without error',
      'Return an array with a single zero element',
    ],
    correctAnswer: 'Return an empty array without error',
    explanation:
      'An empty array is a valid edge case. A correct implementation must handle it gracefully by returning an empty array, not by throwing an error or returning unexpected values.',
    critical: true,
    sourceReference: 'SortAlg-Textbook-v2.0, Chapter 6 — Edge Cases and Correctness',
  },
  {
    id: 'cs-q-4',
    moduleVersionId: 'version-2',
    competencyId: 'cs-comp-3',
    questionText: 'What can happen if a sorting algorithm does not correctly handle arrays where all elements are identical?',
    questionType: 'multiple-choice',
    options: [
      'It will produce a sorted result but take slightly longer',
      'It may enter an infinite loop or produce incorrect results',
      'It will automatically skip the sorting step',
      'The time complexity improves to O(1)',
    ],
    correctAnswer: 'It may enter an infinite loop or produce incorrect results',
    explanation:
      'If the partition logic or swap conditions do not account for equal elements, the algorithm may never terminate (infinite loop) or corrupt the data order. This is a critical correctness requirement.',
    critical: true,
    sourceReference: 'SortAlg-Textbook-v2.0, Chapter 6 — Duplicate Element Handling',
  },
  {
    id: 'cs-q-5',
    moduleVersionId: 'version-2',
    competencyId: 'cs-comp-4',
    questionText: 'For a nearly-sorted array of 1000 elements, which algorithm would typically perform best?',
    questionType: 'multiple-choice',
    options: [
      'Selection sort, because it always does the same number of comparisons',
      'Insertion sort, because its best case on nearly-sorted data is O(n)',
      'Merge sort, because it always runs in O(n log n)',
      'Bubble sort with no optimizations',
    ],
    correctAnswer: 'Insertion sort, because its best case on nearly-sorted data is O(n)',
    explanation:
      'Insertion sort performs very well on nearly-sorted data because elements only need to move a short distance. Its best case is O(n) when the data is already sorted or nearly sorted, making it faster than O(n log n) algorithms for this specific case.',
    critical: false,
    sourceReference: 'SortAlg-Textbook-v2.0, Chapter 7 — Algorithm Selection',
  },
];

// CS Cohort Metrics (for Prof David Tan's instructor view)
export const csCohortMetrics: CohortMetrics = {
  moduleId: 'module-2',
  moduleTitle: 'Introduction to Sorting Algorithms',
  assigned: 25,
  started: 23,
  completed: 20,
  completionRate: 0.80,
  readinessDistribution: {
    READY: 15,
    REVIEW_REQUIRED: 3,
    FURTHER_PREPARATION: 2,
    ESCALATE: 0,
  },
  competencyAverages: [
    { competencyName: 'Algorithm Analysis', average: 0.79 },
    { competencyName: 'Implementation Patterns', average: 0.73 },
    { competencyName: 'Edge Cases', average: 0.68 },
    { competencyName: 'Optimization', average: 0.81 },
  ],
};

export const csMisconceptions: Misconception[] = [
  {
    id: 'cs-misc-1',
    questionId: 'cs-q-1',
    questionText: 'What is the worst-case time complexity of merge sort?',
    competencyName: 'Algorithm Analysis',
    incorrectAnswer: 'O(n^2)',
    frequency: 6,
    isCritical: false,
  },
  {
    id: 'cs-misc-2',
    questionId: 'cs-q-3',
    questionText: 'What should a correct sorting algorithm do when given an empty array?',
    competencyName: 'Edge Cases',
    incorrectAnswer: 'Throw an error because there is nothing to sort',
    frequency: 5,
    isCritical: true,
  },
  {
    id: 'cs-misc-3',
    questionId: 'cs-q-2',
    questionText: 'In quick sort, what happens during the partition step?',
    competencyName: 'Implementation Patterns',
    incorrectAnswer: 'The array is divided into two equal halves',
    frequency: 8,
    isCritical: false,
  },
  {
    id: 'cs-misc-4',
    questionId: 'cs-q-4',
    questionText: 'What can happen if a sorting algorithm does not correctly handle identical elements?',
    competencyName: 'Edge Cases',
    incorrectAnswer: 'It will produce a sorted result but take slightly longer',
    frequency: 4,
    isCritical: true,
  },
];

export const csInterventionList: InterventionItem[] = [
  {
    learnerId: 'cs-learner-3',
    learnerName: 'Kai Nakamura',
    status: 'REVIEW_REQUIRED',
    failedCompetencies: ['Edge Cases'],
    criticalFailures: ['Failed to identify correct handling of empty arrays'],
    lastAttemptAt: '2026-08-04T10:15:00Z',
    attemptCount: 1,
  },
  {
    learnerId: 'cs-learner-7',
    learnerName: 'Sarah Kim',
    status: 'FURTHER_PREPARATION',
    failedCompetencies: ['Algorithm Analysis', 'Implementation Patterns'],
    criticalFailures: [],
    lastAttemptAt: '2026-08-04T13:30:00Z',
    attemptCount: 2,
  },
  {
    learnerId: 'cs-learner-9',
    learnerName: 'Liam O\'Brien',
    status: 'REVIEW_REQUIRED',
    failedCompetencies: ['Edge Cases'],
    criticalFailures: ['Failed to identify infinite loop risk with duplicate elements'],
    lastAttemptAt: '2026-08-04T15:45:00Z',
    attemptCount: 1,
  },
];

// CS Checkpoint Questions
export const csCheckpointQuestions: CheckpointQuestion[] = [
  {
    id: 'cs-cp-1',
    activityId: 'cs-act-1',
    moduleVersionId: 'version-2',
    questionText: 'Why does sorting enable more efficient searching?',
    options: [
      'Sorting makes all elements unique',
      'Sorted data enables binary search with O(log n) time instead of O(n) linear search',
      'Sorting removes duplicate elements',
      'Sorted data requires less memory',
    ],
    correctAnswer: 'Sorted data enables binary search with O(log n) time instead of O(n) linear search',
    explanation: 'Binary search requires sorted data and achieves O(log n) lookups by eliminating half the remaining elements at each step.',
    failureHint: 'Re-read the first paragraph about what sorting enables. Focus on binary search and its time complexity.',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:00:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 20,
  },
  {
    id: 'cs-cp-2',
    activityId: 'cs-act-2',
    moduleVersionId: 'version-2',
    questionText: 'What is the time complexity of bubble sort in the worst case?',
    options: [
      'O(n)',
      'O(n log n)',
      'O(n^2)',
      'O(1)',
    ],
    correctAnswer: 'O(n^2)',
    explanation: 'Bubble sort compares adjacent elements in nested loops, resulting in O(n^2) comparisons in the worst and average case.',
    failureHint: 'Look at the stated time complexity for bubble sort. What are the average and worst case?',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:05:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 25,
  },
  {
    id: 'cs-cp-3',
    activityId: 'cs-act-3',
    moduleVersionId: 'version-2',
    questionText: 'What is the additional space complexity of merge sort?',
    options: [
      'O(1) — it sorts in place',
      'O(log n) — for the recursion stack',
      'O(n) — for the merge buffer',
      'O(n^2) — for storing all comparisons',
    ],
    correctAnswer: 'O(n) — for the merge buffer',
    explanation: 'Merge sort requires O(n) additional space to hold elements during the merge operation.',
    failureHint: 'Look for the space complexity statement. What buffer does merge sort need?',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:10:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 25,
  },
  {
    id: 'cs-cp-4',
    activityId: 'cs-act-4',
    moduleVersionId: 'version-2',
    questionText: 'What causes quick sort to degrade to O(n^2) performance?',
    options: [
      'Using too much memory',
      'Having duplicate elements',
      'Consistently choosing the smallest or largest element as pivot',
      'Having an odd number of elements',
    ],
    correctAnswer: 'Consistently choosing the smallest or largest element as pivot',
    explanation: 'When the pivot is always the extreme value, partitions are maximally unbalanced (one empty, one with n-1 elements), leading to O(n^2) behavior.',
    failureHint: 'Look at the worst case description. What causes maximally unbalanced partitions?',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:15:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 30,
  },
  {
    id: 'cs-cp-5',
    activityId: 'cs-act-5',
    moduleVersionId: 'version-2',
    questionText: 'Why is it critical to test sorting algorithms with arrays of duplicate elements?',
    options: [
      'Duplicates make the array longer',
      'Algorithms may infinite-loop or produce incorrect results if they do not handle equal elements',
      'Duplicates are always removed during sorting',
      'It only matters for arrays longer than 1000 elements',
    ],
    correctAnswer: 'Algorithms may infinite-loop or produce incorrect results if they do not handle equal elements',
    explanation: 'Partition logic that does not account for equal elements can fail to make progress, causing infinite recursion or loops.',
    failureHint: 'Look at the edge case about all-identical elements. What specific failures can occur?',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:20:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 30,
  },
  {
    id: 'cs-cp-6',
    activityId: 'cs-act-6',
    moduleVersionId: 'version-2',
    questionText: 'For a memory-constrained system, which sorting algorithms would be preferred?',
    options: [
      'Merge sort and counting sort',
      'Quick sort and heap sort (both in-place)',
      'Bubble sort and radix sort',
      'Only external merge sort',
    ],
    correctAnswer: 'Quick sort and heap sort (both in-place)',
    explanation: 'Quick sort and heap sort are in-place algorithms requiring only O(log n) additional space for the recursion stack, making them suitable for memory-constrained environments.',
    failureHint: 'Look at the algorithm selection guide. Which algorithms are listed under memory-constrained?',
    approvalStatus: 'approved',
    approvedBy: 'user-instructor-2',
    approvedAt: '2026-07-31T10:25:00Z',
    generatedAt: '2026-07-30T09:00:00Z',
    minimumReadSeconds: 20,
  },
];

// CS Step Friction Data
export const csStepFrictionData: StepFriction[] = [
  {
    activityId: 'cs-act-1',
    activityTitle: 'Why Sorting Matters',
    stepNumber: 1,
    totalAttempts: 23,
    firstAttemptPassRate: 0.91,
    averageRetries: 1.1,
    averageTimeSpent: 22,
  },
  {
    activityId: 'cs-act-2',
    activityTitle: 'Bubble Sort and Selection Sort',
    stepNumber: 2,
    totalAttempts: 23,
    firstAttemptPassRate: 0.78,
    averageRetries: 1.3,
    averageTimeSpent: 38,
  },
  {
    activityId: 'cs-act-3',
    activityTitle: 'Merge Sort — Divide and Conquer',
    stepNumber: 3,
    totalAttempts: 23,
    firstAttemptPassRate: 0.65,
    averageRetries: 1.7,
    averageTimeSpent: 52,
  },
  {
    activityId: 'cs-act-4',
    activityTitle: 'Quick Sort — Pivot and Partition',
    stepNumber: 4,
    totalAttempts: 23,
    firstAttemptPassRate: 0.57,
    averageRetries: 2.0,
    averageTimeSpent: 65,
  },
  {
    activityId: 'cs-act-5',
    activityTitle: 'Edge Cases and Correctness',
    stepNumber: 5,
    totalAttempts: 23,
    firstAttemptPassRate: 0.61,
    averageRetries: 1.9,
    averageTimeSpent: 48,
  },
  {
    activityId: 'cs-act-6',
    activityTitle: 'Choosing the Right Algorithm',
    stepNumber: 6,
    totalAttempts: 23,
    firstAttemptPassRate: 0.83,
    averageRetries: 1.2,
    averageTimeSpent: 30,
  },
];
