import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, ClipboardList, RefreshCw, ChevronRight } from 'lucide-react';
import { getAllTests, updateTest } from '../api/endpoints';
import { Test } from '../types';
import { Spinner, EmptyState, StatusBadge, PageHeader } from '../components/ui';
import { useTestStore } from '../store/testStore';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentTest, clearTestFlow } = useTestStore();
  const [tests, setTests] = useState<Test[]>([]);
  const [filtered, setFiltered] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTests();
      if (res.data.status === 'success') {
        setTests(res.data.data);
        setFiltered(res.data.data);
      }
    } catch {
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(tests.filter(t =>
      t.name?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)
    ));
  }, [search, tests]);

  const handleDelete = async (test: Test) => {
    if (!window.confirm(`Delete "${test.name}"?`)) return;
    setDeletingId(test.id);
    try {
      await updateTest(test.id, { status: 'deleted' });
      setTests(prev => prev.filter(t => t.id !== test.id));
      toast.success('Test deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (test: Test) => {
    setCurrentTest(test);
    navigate(`/tests/${test.id}/edit`);
  };

  const handleCreate = () => {
    clearTestFlow();
    navigate('/tests/create');
  };

  const stats = {
    total: tests.length,
    live: tests.filter(t => t.status === 'live').length,
    draft: tests.filter(t => !t.status || t.status === 'draft').length,
  };

  return (
    <AppLayout>
      <div className="p-8 animate-fade-in">
        <PageHeader
          title="Test Dashboard"
          subtitle={`${stats.total} tests total`}
          action={
            <button onClick={handleCreate} className="btn-primary">
              <Plus size={16} />
              Create Test
            </button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Tests', value: stats.total, color: 'text-white' },
            { label: 'Published', value: stats.live, color: 'text-emerald-400' },
            { label: 'Drafts', value: stats.draft, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="glass p-5">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-display font-bold text-3xl ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="input-field pl-9"
              placeholder="Search tests by name or subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={fetchTests} className="btn-secondary px-3" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="glass overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size={24} className="text-brand-400" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="No tests found"
              desc={search ? 'No tests match your search' : 'Create your first test to get started'}
              action={!search ? <button onClick={handleCreate} className="btn-primary"><Plus size={16} />Create Test</button> : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Test Name', 'Subject', 'Topics', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((test, i) => (
                    <tr
                      key={test.id}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-sm text-white">{test.name}</p>
                        <p className="text-xs text-white/30 mt-0.5 font-mono">{test.id?.slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/60">{test.subject || '—'}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {Array.isArray(test.topics) && test.topics.slice(0, 2).map((t, i) => (
                            <span key={i} className="badge bg-brand-600/15 text-brand-400 border border-brand-500/20 text-xs">{t}</span>
                          ))}
                          {Array.isArray(test.topics) && test.topics.length > 2 && (
                            <span className="badge bg-white/5 text-white/40">+{test.topics.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={test.status || 'draft'} /></td>
                      <td className="px-5 py-4 text-sm text-white/40">
                        {test.created_at ? new Date(test.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/tests/${test.id}/preview`)}
                            className="p-2 rounded-lg text-white/40 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                            title="Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(test)}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(test)}
                            disabled={deletingId === test.id}
                            className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            {deletingId === test.id ? <Spinner size={14} /> : <Trash2 size={14} />}
                          </button>
                          <button
                            onClick={() => navigate(`/tests/${test.id}/questions`)}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                            title="Add Questions"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
