export interface Report {
  title: string;
  severity: string;
  bounty: number | null;
  reporter: string;
  id: string;
  reportedAt: string;
  weakness: string;
  cve: string | null;
  messages: Message[];
  attachments: string[];
  attachmentFiles?: Record<string, ArrayBuffer>;
  attachmentFilenames?: Record<string, string>;
  content: string;
}

export interface Message {
  author: string;
  content: string;
  attachments: string[];
  oldSeverity?: {
    score: number | null;
    rating: string;
    meta: SeverityMeta;
  };
  newSeverity?: {
    score: number | null;
    rating: string;
    meta: SeverityMeta;
  };
  newStatus?: string;
  bounty?: {
    amount: string;
    bonusAmount: string;
    user: string;
  };
}

interface SeverityMeta {
  attackVector: string | null;
  attackComplexity: string | null;
  privilegesRequired: string | null;
  userInteraction: string | null;
  scope: string | null;
  confidentiality: string | null;
  integrity: string | null;
  availability: string | null;
}