/**
 * Phased feature rollout mirrored from repo PR docs (PR-01 … PR-06).
 * Adjust `phases` here if your product phases differ — sidebar reads this file only.
 */

export const phasedFeaturesIntro =
  'ये चरण प्रोजेक्ट के PR डॉक्यूमेंट के अनुसार हैं। अपना मैन्युअल फेज प्लैन इस फाइल में अपडेट कर सकते हो।';

export const phasedFeatures = [
  {
    id: 'phase-01',
    labelEn: 'Phase 1 · Foundation',
    labelHi: 'चरण 1 · नींव',
    docsRef: 'PR-01_FOUNDATION_HARDENING.md',
    items: [
      'Env validation (Zod) · secure secrets',
      'CORS allowlist · standardized API errors',
      'JWT auth middleware · correlation IDs',
      'DB normalization · RLS · migrations',
      'Health endpoints · validated job/search/tailor APIs',
    ],
  },
  {
    id: 'phase-02',
    labelEn: 'Phase 2 · Async core',
    labelHi: 'चरण 2 · Async प्लेन',
    docsRef: 'PR-02_ASYNC_CORE.md',
    items: [
      'BullMQ queues · retries · dead-letter',
      'Async job search / tailor / apply (jobId)',
      'Job status API · queue stats',
      'Workers · Playwright in worker context · idempotency',
    ],
  },
  {
    id: 'phase-03',
    labelEn: 'Phase 3 · Real-time',
    labelHi: 'चरण 3 · लाइव अपडेट',
    docsRef: 'PR-03_REALTIME_SYSTEM.md',
    items: [
      'Socket.IO · authenticated rooms',
      'Domain events worker → socket',
      'Job progress tracker · notifications',
      'Reconnect & live dashboard feeds',
    ],
  },
  {
    id: 'phase-04',
    labelEn: 'Phase 4 · Observability',
    labelHi: 'चरण 4 · मॉनीटरिंग',
    docsRef: 'PR-04_OBSERVABILITY_QUALITY_DELIVERY.md',
    items: [
      'Structured logging · metrics hooks',
      'Health & quality gates in CI',
      'Operational visibility for queues & failures',
    ],
  },
  {
    id: 'phase-05',
    labelEn: 'Phase 5 · Orchestration',
    labelHi: 'चरण 5 · ऑर्केस्ट्रेशन',
    docsRef: 'PR-05_AUTONOMOUS_ORCHESTRATION.md',
    items: [
      'Intent-based workflows (search / tailor / apply)',
      'Strategy selection · SLA & fallbacks',
      'Multi-step plans · human-in-the-loop states',
    ],
  },
  {
    id: 'phase-06a',
    labelEn: 'Phase 6A · Smart match',
    labelHi: 'चरण 6A · मैच स्कोर',
    docsRef: 'PR-06A_SMART_MATCH_SCORING.md',
    items: [
      'Explainable scoring · risk flags',
      'Batch scoring · customizable weights · hard filters',
    ],
  },
  {
    id: 'phase-06bc',
    labelEn: 'Phase 6B/C · Tailor & safety',
    labelHi: 'चरण 6B/C · टेलर और सुरक्षा',
    docsRef: 'PR-06B_06C_PERSONALIZATION_AND_SAFETY.md',
    items: [
      'AI resume / cover tailoring · ATS validation',
      'Safety gates · policies · approvals',
      'Audit trail · quality thresholds before apply',
    ],
  },
];
