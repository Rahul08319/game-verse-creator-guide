
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/utils/social';

const PAGE_SIZE = 15;
const MEDALS = ['🥇', '🥈', '🥉'];

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

interface ScoreRow {
  id: string;
  player_name: string;
  score: number;
  level: number;
  created_at: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [totalCount, setTotalCount] = useState(0);

  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (filter) {
      case 'today': return startOfDay(now).toISOString();
      case 'week': return subDays(now, 7).toISOString();
      case 'month': return subDays(now, 30).toISOString();
      case 'custom': return customDate ? startOfDay(customDate).toISOString() : null;
      default: return null;
    }
  }, [filter, customDate]);

  const fetchScores = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const dateFilter = getDateFilter();

    let query = supabase
      .from('high_scores')
      .select('*', { count: 'exact' })
      .order('score', { ascending: false })
      .range(from, to);

    if (dateFilter) {
      query = query.gte('created_at', dateFilter);
    }

    const { data, count, error } = await query;
    if (!error && data) {
      setScores(data as ScoreRow[]);
      setTotalCount(count ?? 0);
      setHasMore(to < (count ?? 0) - 1);
    }
    setLoading(false);
  }, [page, getDateFilter]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  useEffect(() => {
    setPage(0);
  }, [filter, customDate]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filters: { label: string; value: FilterPeriod }[] = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: 'week' },
    { label: '30 Days', value: 'month' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0015] via-[#1a0a2e] to-[#0a1a2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            ← Back to Game
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            🏆 Global Leaderboard
          </h1>
          <div className="w-20" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                filter === f.value
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              )}
            >
              {f.label}
            </button>
          ))}
          {filter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white/80 hover:bg-white/10">
                  {customDate ? format(customDate, 'MMM d, yyyy') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDate}
                  onSelect={setCustomDate}
                  disabled={(date) => date > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between text-xs text-white/40 mb-3 px-1">
          <span>{totalCount} scores</span>
          <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
        </div>

        {/* Table */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[3rem_1fr_5rem_3rem_7rem] gap-2 px-4 py-3 text-xs font-semibold text-white/50 border-b border-white/10 uppercase tracking-wider">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-center">Lvl</span>
            <span className="text-right">Date</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mr-3" />
              Loading...
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              No scores yet. Be the first! 🎮
            </div>
          ) : (
            scores.map((s, i) => {
              const rank = page * PAGE_SIZE + i + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'grid grid-cols-[3rem_1fr_5rem_3rem_7rem] gap-2 px-4 py-3 items-center border-b border-white/5 transition-colors hover:bg-white/5',
                    isTop3 && 'bg-gradient-to-r from-yellow-500/5 to-transparent'
                  )}
                >
                  <span className="text-lg font-bold">
                    {isTop3 ? MEDALS[rank - 1] : <span className="text-white/30 text-sm">{rank}</span>}
                  </span>
                  <span className={cn('font-medium truncate', isTop3 ? 'text-yellow-300' : 'text-white/80')}>
                    {s.player_name}
                  </span>
                  <span className={cn('text-right font-mono font-bold', isTop3 ? 'text-yellow-400' : 'text-purple-300')}>
                    {s.score.toLocaleString()}
                  </span>
                  <span className="text-center text-white/50 text-sm">{s.level}</span>
                  <span className="text-right text-white/40 text-xs">
                    {format(new Date(s.created_at), 'MMM d, yy')}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              ← Prev
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i;
                else if (page < 3) pageNum = i;
                else if (page > totalPages - 4) pageNum = totalPages - 5 + i;
                else pageNum = page - 2 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                      page === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={!hasMore}
              className="px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
