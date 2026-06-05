import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import { Save, ArrowRight, ChevronLeft } from 'lucide-react';
import { getSubjects, getTopicsBySubject, getSubTopicsByTopics, createTest, updateTest, getTestById } from '../api/endpoints';
import { Subject, Topic, SubTopic } from '../types';
import { Spinner, StepIndicator, Field, PageHeader } from '../components/ui';
import { useTestStore } from '../store/testStore';
import AppLayout from '../components/layout/AppLayout';
import toast from 'react-hot-toast';

interface TestForm {
  name: string;
  type: string;
  subject: string;
  topics: string[];
  sub_topics: string[];
  difficulty: string;
  correct_marks: number;
  wrong_marks: number;
  unattempt_marks: number;
  total_time: number;
  total_marks: number;
  total_questions: number;
}

const selectStyles = {
  control: (b: any) => ({ ...b, background: '#17171D', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, minHeight: 40, boxShadow: 'none', '&:hover': { borderColor: 'rgba(99,102,241,0.5)' } }),
  menu: (b: any) => ({ ...b, background: '#1E1E27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }),
  option: (b: any, s: any) => ({ ...b, background: s.isSelected ? '#4F46E5' : s.isFocused ? 'rgba(255,255,255,0.05)' : 'transparent', color: 'white', fontSize: 13 }),
  singleValue: (b: any) => ({ ...b, color: 'white', fontSize: 13 }),
  multiValue: (b: any) => ({ ...b, background: 'rgba(99,102,241,0.2)', borderRadius: 6 }),
  multiValueLabel: (b: any) => ({ ...b, color: 'rgb(165,180,252)', fontSize: 12 }),
  multiValueRemove: (b: any) => ({ ...b, color: 'rgb(165,180,252)', '&:hover': { background: 'rgba(99,102,241,0.4)', color: 'white' } }),
  placeholder: (b: any) => ({ ...b, color: 'rgba(255,255,255,0.3)', fontSize: 13 }),
  input: (b: any) => ({ ...b, color: 'white', fontSize: 13 }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (b: any) => ({ ...b, color: 'rgba(255,255,255,0.3)' }),
};

const STEPS = ['Test Details', 'Add Questions', 'Preview & Publish'];
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const TYPE_OPTIONS = [
  { value: 'mock', label: 'Mock Test' },
  { value: 'chapterwise', label: 'Chapterwise' },
  { value: 'pyq', label: 'PYQ (Previous Year)' },
];

const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { setCurrentTest, currentTest } = useTestStore();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubTopics, setLoadingSubTopics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<TestForm>({
    defaultValues: {
      correct_marks: 4, wrong_marks: -1, unattempt_marks: 0,
      total_time: 60, total_marks: 100, total_questions: 25, type: 'practice', difficulty: 'medium'
    }
  });

  const selectedSubject = watch('subject');
  const selectedTopics = watch('topics');

  // Load subjects
  useEffect(() => {
    setLoadingSubjects(true);
    getSubjects().then(r => {
      if (r.data.status === 'success') setSubjects(r.data.data);
    }).catch(() => toast.error('Failed to load subjects')).finally(() => setLoadingSubjects(false));
  }, []);

  // Load existing test for edit
  useEffect(() => {
    if (isEdit && id) {
      getTestById(id).then(r => {
        if (r.data.status === 'success') {
          const t = r.data.data;
          setCurrentTest(t);
          setValue('name', t.name);
          if (t.type) setValue('type', t.type);
          if (t.difficulty) setValue('difficulty', t.difficulty);
          if (t.correct_marks !== undefined) setValue('correct_marks', t.correct_marks);
          if (t.wrong_marks !== undefined) setValue('wrong_marks', t.wrong_marks);
          if (t.unattempt_marks !== undefined) setValue('unattempt_marks', t.unattempt_marks);
          if (t.total_time) setValue('total_time', t.total_time);
          if (t.total_marks) setValue('total_marks', t.total_marks);
          if (t.total_questions) setValue('total_questions', t.total_questions);
        }
      });
    }
  }, [isEdit, id]);

  // Load topics when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    setLoadingTopics(true);
    setTopics([]);
    setSubTopics([]);
    setValue('topics', []);
    setValue('sub_topics', []);
    getTopicsBySubject(selectedSubject)
      .then(r => { if (r.data.status === 'success') setTopics(r.data.data); })
      .catch(() => toast.error('Failed to load topics'))
      .finally(() => setLoadingTopics(false));
  }, [selectedSubject]);

  // Load sub-topics when topics change
  useEffect(() => {
    const validTopics = (selectedTopics || []).filter(Boolean);
    if (!validTopics.length) { setSubTopics([]); return; }
    setLoadingSubTopics(true);
    getSubTopicsByTopics(validTopics)
      .then(r => { if (r.data.status === 'success') setSubTopics(r.data.data); })
      .catch(() => { setSubTopics([]); })
      .finally(() => setLoadingSubTopics(false));
  }, [selectedTopics]);

  const submitTest = async (data: TestForm, isDraft: boolean) => {
    const setter = isDraft ? setSavingDraft : setSaving;
    setter(true);
    try {
      const payload = {
        name: data.name,
        type: data.type,
        subject: data.subject,
        topics: data.topics || [],
        sub_topics: data.sub_topics || [],
        difficulty: data.difficulty,
        correct_marks: Number(data.correct_marks),
        wrong_marks: Number(data.wrong_marks),
        unattempt_marks: Number(data.unattempt_marks),
        total_time: Number(data.total_time),
        total_marks: Number(data.total_marks),
        total_questions: Number(data.total_questions),
        status: 'draft',
      };

      let res;
      if (isEdit && id) {
        res = await updateTest(id, payload);
      } else {
        res = await createTest(payload);
      }

      if (res.data.status === 'success') {
        setCurrentTest(res.data.data);
        toast.success(isDraft ? 'Saved as draft' : 'Test saved! Add your questions now.');
        if (!isDraft) navigate(`/tests/${res.data.data.id}/questions`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save test';
      toast.error(errMsg);
      console.error('Create test error:', err.response?.data);
    } finally {
      setter(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in max-w-3xl">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-6 -ml-2">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>

        <StepIndicator steps={STEPS} current={0} />
        <PageHeader
          title={isEdit ? 'Edit Test' : 'Create New Test'}
          subtitle="Fill in the details to set up your test"
        />

        <form onSubmit={handleSubmit(d => submitTest(d, false))} className="space-y-6">
          {/* Basic info */}
          <div className="glass p-6 space-y-5">
            <h3 className="font-display font-semibold text-base text-white/80 border-b border-white/8 pb-3">Basic Information</h3>

            <Field label="Test Name" required error={errors.name?.message}>
              <input
                className="input-field"
                placeholder="e.g. JEE Mains Practice Set 1"
                {...register('name', { required: 'Test name is required', minLength: { value: 3, message: 'Min 3 characters' } })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Test Type" required>
                <Controller name="type" control={control} rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      styles={selectStyles}
                      options={TYPE_OPTIONS}
                      value={TYPE_OPTIONS.find(o => o.value === field.value)}
                      onChange={o => field.onChange(o?.value)}
                      placeholder="Select type"
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
                      placeholder="Select difficulty"
                    />
                  )}
                />
              </Field>
            </div>
          </div>

          {/* Subject, Topics, Sub-topics */}
          <div className="glass p-6 space-y-5">
            <h3 className="font-display font-semibold text-base text-white/80 border-b border-white/8 pb-3">Subject & Topics</h3>

            <Field label="Subject" required>
              <Controller name="subject" control={control} rules={{ required: 'Subject is required' }}
                render={({ field }) => (
                  <Select
                    styles={selectStyles}
                    isLoading={loadingSubjects}
                    options={subjects.map(s => ({ value: s.id, label: s.name }))}
                    value={subjects.filter(s => s.id === field.value).map(s => ({ value: s.id, label: s.name }))[0] || null}
                    onChange={o => field.onChange(o?.value)}
                    placeholder="Select subject..."
                  />
                )}
              />
            </Field>

            <Field label="Topics">
              <Controller name="topics" control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    styles={selectStyles}
                    isLoading={loadingTopics}
                    isDisabled={!selectedSubject}
                    options={topics.map(t => ({ value: t.id, label: t.name }))}
                    value={topics.filter(t => field.value?.includes(t.id)).map(t => ({ value: t.id, label: t.name }))}
                    onChange={opts => field.onChange(opts.map(o => o.value))}
                    placeholder={!selectedSubject ? 'Select subject first' : 'Select topics...'}
                  />
                )}
              />
            </Field>

            <Field label="Sub-topics">
              <Controller name="sub_topics" control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    styles={selectStyles}
                    isLoading={loadingSubTopics}
                    isDisabled={!selectedTopics?.length}
                    options={subTopics.map(s => ({ value: s.id, label: s.name }))}
                    value={subTopics.filter(s => field.value?.includes(s.id)).map(s => ({ value: s.id, label: s.name }))}
                    onChange={opts => field.onChange(opts.map(o => o.value))}
                    placeholder={!selectedTopics?.length ? 'Select topics first' : 'Select sub-topics...'}
                  />
                )}
              />
            </Field>
          </div>

          {/* Marking Scheme */}
          <div className="glass p-6 space-y-5">
            <h3 className="font-display font-semibold text-base text-white/80 border-b border-white/8 pb-3">Marking Scheme</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Correct Marks">
                <input type="number" step="0.5" className="input-field" {...register('correct_marks', { valueAsNumber: true })} />
              </Field>
              <Field label="Wrong Marks">
                <input type="number" step="0.5" className="input-field" {...register('wrong_marks', { valueAsNumber: true })} />
              </Field>
              <Field label="Unattempted">
                <input type="number" step="0.5" className="input-field" {...register('unattempt_marks', { valueAsNumber: true })} />
              </Field>
            </div>
          </div>

          {/* Test Config */}
          <div className="glass p-6 space-y-5">
            <h3 className="font-display font-semibold text-base text-white/80 border-b border-white/8 pb-3">Test Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Total Time (min)">
                <input type="number" className="input-field" {...register('total_time', { valueAsNumber: true })} />
              </Field>
              <Field label="Total Marks">
                <input type="number" className="input-field" {...register('total_marks', { valueAsNumber: true })} />
              </Field>
              <Field label="Total Questions">
                <input type="number" className="input-field" {...register('total_questions', { valueAsNumber: true })} />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-6">
            <button
              type="button"
              onClick={handleSubmit(d => submitTest(d, true))}
              disabled={savingDraft}
              className="btn-secondary"
            >
              {savingDraft ? <Spinner size={15} /> : <Save size={15} />}
              Save as Draft
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Spinner size={15} /> : <ArrowRight size={15} />}
              {saving ? 'Saving...' : 'Next: Add Questions'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default CreateTestPage;
