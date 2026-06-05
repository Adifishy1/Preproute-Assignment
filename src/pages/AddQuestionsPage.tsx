import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { Plus, Trash2, Edit2, Check, X, ChevronLeft, ArrowRight, BookOpen } from 'lucide-react';
import { bulkCreateQuestions, getTestById, getTopicsBySubject, getSubTopicsByTopics } from '../api/endpoints';
import { Question, Topic, SubTopic } from '../types';
import { Spinner, StepIndicator, Field, PageHeader } from '../components/ui';
import { useTestStore } from '../store/testStore';
import AppLayout from '../components/layout/AppLayout';
import toast from 'react-hot-toast';

const selectStyles = {
  control: (b: any) => ({ ...b, background: '#17171D', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, minHeight: 40, boxShadow: 'none' }),
  menu: (b: any) => ({ ...b, background: '#1E1E27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }),
  option: (b: any, s: any) => ({ ...b, background: s.isSelected ? '#4F46E5' : s.isFocused ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'white', fontSize: 13 }),
  singleValue: (b: any) => ({ ...b, color: 'white', fontSize: 13 }),
  placeholder: (b: any) => ({ ...b, color: 'rgba(255,255,255,0.3)', fontSize: 13 }),
  input: (b: any) => ({ ...b, color: 'white', fontSize: 13 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (b: any) => ({ ...b, color: 'rgba(255,255,255,0.3)' }),
};

const STEPS = ['Test Details', 'Add Questions', 'Preview & Publish'];
const CORRECT_OPTIONS = ['option1','option2','option3','option4'].map(v => ({ value: v, label: v.replace('option', 'Option ') }));
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));

const emptyQuestion = (): Omit<Question, 'id'> => ({
  type: 'mcq',
  question: '',
  option1: '', option2: '', option3: '', option4: '',
  correct_option: 'option1',
  explanation: '', difficulty: 'medium',
  topic_id: '', sub_topic_id: '', media_url: ''
});

const AddQuestionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTest, setCurrentTest, questions, setQuestions, addQuestion, updateQuestion, removeQuestion } = useTestStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(questions.length === 0);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<Omit<Question, 'id'>>({
    defaultValues: emptyQuestion()
  });

  const selectedTopic = watch('topic_id');

  // Load test if not in store
  useEffect(() => {
    if (!currentTest && id) {
      getTestById(id).then(r => {
        if (r.data.status === 'success') setCurrentTest(r.data.data);
      });
    }
  }, [id, currentTest]);

  // Load topics for the test's subject
  useEffect(() => {
    if (currentTest?.subject_id) {
      getTopicsBySubject(currentTest.subject_id).then(r => {
        if (r.data.status === 'success') setTopics(r.data.data);
      });
    }
  }, [currentTest]);

  // Load sub-topics when topic selected in form
  useEffect(() => {
    if (!selectedTopic || selectedTopic.length < 10) return;
    getSubTopicsByTopics([selectedTopic]).then(r => {
      if (r.data.status === 'success') setSubTopics(r.data.data);
    }).catch(() => {});
  }, [selectedTopic]);

  const onAddQuestion = (data: Omit<Question, 'id'>) => {
    const q = { ...data, test_id: id, type: 'mcq' };
    if (editIndex !== null) {
      updateQuestion(editIndex, q);
      setEditIndex(null);
      toast.success('Question updated');
    } else {
      addQuestion(q);
      toast.success('Question added');
    }
    reset(emptyQuestion());
    setShowForm(false);
  };

  const handleEdit = (i: number) => {
    reset(questions[i]);
    setEditIndex(i);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAndContinue = async () => {
    if (questions.length === 0) {
      toast.error('Add at least 1 question');
      return;
    }
    setSaving(true);
    try {
      const qs = questions.map(q => ({ ...q, test_id: id, type: 'mcq' }));
      const res = await bulkCreateQuestions(qs);
      if (res.data.status === 'success') {
        toast.success(`${res.data.data.length} questions saved!`);
        navigate(`/tests/${id}/preview`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-6 -ml-2">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <StepIndicator steps={STEPS} current={1} />

        {/* Test info banner */}
        {currentTest && (
          <div className="glass-sm p-4 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{currentTest.name}</p>
              <p className="text-xs text-white/40">{currentTest.subject} · {currentTest.difficulty}</p>
            </div>
            <span className="badge bg-white/5 text-white/40 text-xs">{questions.length} Q added</span>
          </div>
        )}

        <PageHeader title="Add Questions" subtitle="Add MCQ questions to your test" />

        {/* Question Form */}
        {showForm ? (
          <div className="glass p-6 mb-6 space-y-5 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-base text-white">
                {editIndex !== null ? `Editing Q${editIndex + 1}` : `Question ${questions.length + 1}`}
              </h3>
              {questions.length > 0 && (
                <button type="button" onClick={() => { setShowForm(false); setEditIndex(null); reset(emptyQuestion()); }} className="btn-ghost text-xs">
                  <X size={14} /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onAddQuestion)} className="space-y-5">
              <Field label="Question" required error={errors.question?.message}>
                <textarea
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Enter the question text..."
                  {...register('question', { required: 'Question is required' })}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                {(['option1','option2','option3','option4'] as const).map((opt, i) => (
                  <Field key={opt} label={`Option ${i+1}`} required error={(errors as any)[opt]?.message}>
                    <input
                      className="input-field"
                      placeholder={`Option ${i+1}`}
                      {...register(opt, { required: `Option ${i+1} required` })}
                    />
                  </Field>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Correct Option" required>
                  <Controller name="correct_option" control={control} rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        styles={selectStyles}
                        options={CORRECT_OPTIONS}
                        value={CORRECT_OPTIONS.find(o => o.value === field.value)}
                        onChange={o => field.onChange(o?.value)}
                      />
                    )}
                  />
                </Field>
                <Field label="Difficulty">
                  <Controller name="difficulty" control={control}
                    render={({ field }) => (
                      <Select
                        styles={selectStyles}
                        options={DIFFICULTY_OPTIONS}
                        value={DIFFICULTY_OPTIONS.find(o => o.value === field.value)}
                        onChange={o => field.onChange(o?.value)}
                      />
                    )}
                  />
                </Field>
              </div>

              {topics.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Topic (optional)">
                    <Controller name="topic_id" control={control}
                      render={({ field }) => (
                        <Select
                          styles={selectStyles}
                          isClearable
                          options={topics.map(t => ({ value: t.id, label: t.name }))}
                          value={topics.filter(t => t.id === field.value).map(t => ({ value: t.id, label: t.name }))[0] || null}
                          onChange={o => field.onChange(o?.value || '')}
                          placeholder="Optional"
                        />
                      )}
                    />
                  </Field>
                  {subTopics.length > 0 && (
                    <Field label="Sub-topic (optional)">
                      <Controller name="sub_topic_id" control={control}
                        render={({ field }) => (
                          <Select
                            styles={selectStyles}
                            isClearable
                            options={subTopics.map(s => ({ value: s.id, label: s.name }))}
                            value={subTopics.filter(s => s.id === field.value).map(s => ({ value: s.id, label: s.name }))[0] || null}
                            onChange={o => field.onChange(o?.value || '')}
                            placeholder="Optional"
                          />
                        )}
                      />
                    </Field>
                  )}
                </div>
              )}

              <Field label="Explanation (optional)">
                <textarea rows={2} className="input-field resize-none" placeholder="Explanation for the correct answer..." {...register('explanation')} />
              </Field>

              <Field label="Media URL (optional)">
                <input className="input-field" placeholder="https://..." {...register('media_url')} />
              </Field>

              <div className="flex justify-end pt-2">
                <button type="submit" className="btn-primary">
                  <Check size={15} />
                  {editIndex !== null ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={() => { setShowForm(true); setEditIndex(null); reset(emptyQuestion()); }} className="btn-secondary w-full justify-center mb-6">
            <Plus size={16} /> Add Question
          </button>
        )}

        {/* Questions List */}
        {questions.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider">{questions.length} Question{questions.length !== 1 ? 's' : ''} Added</h3>
            {questions.map((q, i) => (
              <div key={i} className="glass-sm p-4 flex gap-4 group animate-slide-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-semibold text-brand-400 flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white mb-2 line-clamp-2">{q.question}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['option1','option2','option3','option4'].map((opt) => (
                      <div key={opt} className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${q.correct_option === opt ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-white/3 text-white/40'}`}>
                        {q.correct_option === opt && <Check size={10} />}
                        {(q as any)[opt]}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleEdit(i)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => removeQuestion(i)} className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 pb-6 border-t border-white/8">
          <button onClick={() => navigate(`/tests/${id}/edit`)} className="btn-ghost">
            <ChevronLeft size={15} /> Back to Details
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={saving || questions.length === 0}
            className="btn-primary"
          >
            {saving ? <Spinner size={15} /> : <ArrowRight size={15} />}
            {saving ? 'Saving...' : 'Save & Preview'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AddQuestionsPage;
