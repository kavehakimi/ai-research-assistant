export interface ResearchTechnique {
  name: string;
  description: string;
}

export interface LiteratureSection {
  sectionTitle: string;
  bulletPoints: string[];
}

export interface ResearchPlan {
  suggestedTitle: string;
  problemStatement: string;
  objectives: string[];
  researchQuestions: string[];
  methodology: string;
  techniques: ResearchTechnique[];
  literatureReviewOutline: LiteratureSection[];
  searchKeywords: string[];
  futureDirections: string[];
}

export interface SavedPlan {
  id: string;
  topic: string;
  question: string;
  createdAt: string;
  plan: ResearchPlan;
}
