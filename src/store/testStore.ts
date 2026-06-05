import { create } from 'zustand';
import { Test, Question } from '../types';

interface TestStore {
  currentTest: Test | null;
  questions: Question[];
  setCurrentTest: (test: Test) => void;
  setQuestions: (questions: Question[]) => void;
  addQuestion: (q: Question) => void;
  updateQuestion: (index: number, q: Question) => void;
  removeQuestion: (index: number) => void;
  clearTestFlow: () => void;
}

export const useTestStore = create<TestStore>((set) => ({
  currentTest: null,
  questions: [],
  setCurrentTest: (test) => set({ currentTest: test }),
  setQuestions: (questions) => set({ questions }),
  addQuestion: (q) => set((s) => ({ questions: [...s.questions, q] })),
  updateQuestion: (index, q) => set((s) => {
    const qs = [...s.questions];
    qs[index] = q;
    return { questions: qs };
  }),
  removeQuestion: (index) => set((s) => ({
    questions: s.questions.filter((_, i) => i !== index)
  })),
  clearTestFlow: () => set({ currentTest: null, questions: [] }),
}));
