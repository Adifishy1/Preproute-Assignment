import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit2, Send, ChevronLeft, CheckCircle, BookOpen, Clock, Target, Zap, Trophy } from 'lucide-react';
import { getTestById, publishTest, fetchBulkQuestions } from '../api/endpoints';
import { Test, Question } from '../types';
import { Spinner, StepIndicator, StatusBadge } from '../components/ui';
import { useTestStore } from '../store/testStore';
import AppLayout from '../components/layout/AppLayout';
import toast from 'react-hot-toast';

const STEPS = ['Test Details', 'Add Questions', 'Preview & Publish'];
const OPT_LABELS = ['A', 'B', 'C', 'D'];

const PreviewPublishPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTest, questions: storeQuestions, setCurrentTest, clearTestFlow } = useTestStore();

  const [test, setTest] = useState<Test | null>(currentTest);
  const [questions, setQuestions] = useState<Question[]>(storeQuestions);
  const [loading, setLoading] = useState(!currentTest);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTestById(id).then(async r => {
      if (r.data.status === 'success') {
        const t = r.data.data;
        setTest(t);
        setCurrentTest(t);
        // If questions are in store, use them; else fetch
        if (storeQuestions.length === 0 && t.questions && t.questions.length > 0) {
          try {
            const qRes = await fetchBulkQuestions(t.questions);
            if (qRes.data.status === 'success') setQuestions(qRes.data.data);
          } catch {}
        }
      }
    }).catch(() => toast.error('Failed to load test')).finally(() => setLoading(false));
  }, [id]);

  const handlePublish = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      const res = await publishTest(id);
      if (res.data.status === 'success') {
        setPublished(true);
        toast.success('Test published successfully! 🎉');
        setTimeout(() => {
          clearTestFlow();
          navigate('/dashboard');
        }, 2500);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size={28} className="text-brand-400" />
        </div>
      </AppLayout>
    );
  }

  if (published) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="font-display font-bold text-3xl text-white mb-2">Test Published!</h2>
            <p className="text-white/50">Redirecting to dashboard...</p>
          </div>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-6 -ml-2">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <StepIndicator steps={STEPS} current={2} />

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-semibold text-2xl text-white mb-1">Preview & Publish</h1>
            <p className="text-sm text-white/40">Review everything before going live</p>
          </div>
          <StatusBadge status={test?.status || 'draft'} />
        </div>

        {/* Test Details Card */}
        {test && (
          <div className="glass p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-brand-400" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-lg text-white">{test.name}</h2>
                  <p className="text-xs text-white/40">{test.subject}</p>
                </div>
              </div>
              <button onClick={() => navigate(`/tests/${id}/edit`)} className="btn-ghost text-sm">
                <Edit2 size={14} /> Edit Details
              </button>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { icon: <Clock size={14} />, label: 'Duration', value: `${test.total_time} min` },
                { icon: <Target size={14} />, label: 'Total Marks', value: test.total_marks },
                { icon: <Zap size={14} />, label: 'Questions', value: test.total_questions || questions.length },
                { icon: <Trophy size={14} />, label: 'Difficulty', value: test.difficulty || 'Medium' },
              ].map(s => (
                <div key={s.label} className="bg-surface-1 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-1.5 text-white/40 text-xs mb-1">{s.icon}{s.label}</div>
                  <p className="font-semibold text-white capitalize">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Marking scheme */}
            <div className="flex gap-3">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-400/70 mb-0.5">Correct</p>
                <p className="font-bold text-emerald-400">+{test.correct_marks}</p>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <p className="text-xs text-red-400/70 mb-0.5">Wrong</p>
                <p className="font-bold text-red-400">{test.wrong_marks}</p>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <p className="text-xs text-white/40 mb-0.5">Unattempted</p>
                <p className="font-bold text-white/60">{test.unattempt_marks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-base text-white">{questions.length} Question{questions.length !== 1 ? 's' : ''}</h3>
            <button onClick={() => navigate(`/tests/${id}/questions`)} className="btn-ghost text-sm">
              <Edit2 size={13} /> Edit Questions
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="glass p-6 text-center">
              <p className="text-white/40 text-sm mb-3">No questions added yet</p>
              <button onClick={() => navigate(`/tests/${id}/questions`)} className="btn-secondary">
                Add Questions
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="glass p-5 animate-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex gap-3 mb-4">
                    <span className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-semibold text-brand-400 flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-sm text-white leading-relaxed">{q.question}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-10">
                    {['option1','option2','option3','option4'].map((opt, oi) => (
                      <div
                        key={opt}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                          q.correct_option === opt
                            ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400'
                            : 'bg-surface-1 border-white/5 text-white/60'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          q.correct_option === opt ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'
                        }`}>
                          {OPT_LABELS[oi]}
                        </span>
                        <span className="truncate">{(q as any)[opt]}</span>
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="ml-10 mt-3 px-3 py-2 rounded-lg bg-brand-600/10 border border-brand-500/20">
                      <p className="text-xs text-brand-400/80"><span className="font-medium">Explanation:</span> {q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish CTA */}
        <div className="glass p-6 flex items-center justify-between border-brand-500/20 border">
          <div>
            <p className="font-medium text-white mb-0.5">Ready to go live?</p>
            <p className="text-sm text-white/40">Publishing makes this test available to students</p>
          </div>
          <button
            onClick={handlePublish}
            disabled={publishing || questions.length === 0}
            className="btn-primary bg-emerald-600 hover:bg-emerald-500"
          >
            {publishing ? <Spinner size={15} /> : <Send size={15} />}
            {publishing ? 'Publishing...' : 'Publish Test'}
          </button>
        </div>

        <div className="pb-8" />
      </div>
    </AppLayout>
  );
};

export default PreviewPublishPage;
