
export interface Language {
  value: string;
  label: string;
}

export interface SummaryResult {
  summary: string;
  replies: string[];
}

export interface GoogleUser {
  id: string;
  email: string;
}