export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;
}

export type FilterType = 'ALL' | 'ACTIVE' | 'COMPLETED';

export interface AIResponse {
  subtasks: string[];
}