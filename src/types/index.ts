export interface User {
  id: string;
  name?: string;
  userId: string;
  role?: string;
}

export interface Subject { id: string; name: string; }
export interface Topic { id: string; name: string; subject_id: string; }
export interface SubTopic { id: string; name: string; topic_id: string; }

export interface Test {
  id: string;
  name: string;
  type?: string;
  subject?: string;
  subject_id?: string;
  topics?: string[];
  topic_ids?: string[];
  sub_topics?: string[];
  sub_topic_ids?: string[];
  correct_marks?: number;
  wrong_marks?: number;
  unattempt_marks?: number;
  difficulty?: string;
  total_time?: number;
  total_marks?: number;
  total_questions?: number;
  status?: string | null;
  questions?: string[] | null;
  created_at?: string;
}

export interface Question {
  id?: string;
  type?: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: string;
  explanation?: string;
  difficulty?: string;
  topic_id?: string;
  sub_topic_id?: string;
  media_url?: string;
  test_id?: string;
}

// API always returns { status: "success"|"error", message, data }
export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}
