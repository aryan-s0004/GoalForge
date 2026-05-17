import React, { useState, useEffect } from 'react';
import { createCheckin } from '../lib/api.js';

export default function CheckinModal({ goal, onClose, onSuccess }) {
  const [value, setValue] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveScore, setLiveScore] = useState(0);

  const uom = goal.uomType || goal.uom || 'numeric';
  const target = Number(goal.target);

  // Compute live score on-the-fly inside the browser!
  useEffect(() => {
    const parsedVal = Number(value);
    if (!value || !Number.isFinite(parsedVal)) {
      setLiveScore(0);
      return;
    }

    let score = 0;
    if (uom === 'percent') {
      score = Math.min((parsedVal / target) * 100, 100);
    } else if (uom === 'numeric') {
      score = Math.min((parsedVal / target) * 100, 120); // allow up to 120% for exceeding numeric targets
    } else if (uom === 'tat' || uom === 'speed') {
      // TAT: Speed metrics. Lower-is-better! If actual <= target, 100%. If actual > target, it penalizes.
      if (parsedVal <= target) {
        score = 100;
      } else {
        score = Math.max(100 - ((parsedVal - target) / target) * 100, 0);
      }
    } else if (uom === 'zero-occurrence' || uom === 'binary') {
      // Zero occurrence: Target is usually 0. If actual is 0, score is 100%. Otherwise, it drops by 25% per occurrence.
      score = Math.max(100 - parsedVal * 25, 0);
    }

    setLiveScore(Math.round(score));
  }, [value, uom, target]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value) return setError('Achievement value is required');
    
    setLoading(true);
    setError(null);

    try {
      await createCheckin(goal.id, {
        value: Number(value),
        comment: comment.trim() || `Regular check-in submission for ${goal.title}`,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col transform scale-100 transition-all duration-300">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/40 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-indigo-400">Quarterly Progress Update</span>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">Submit Goal Check-in</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Goal Overview */}
          <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active Goal Setup</h4>
            <div className="text-sm font-semibold text-slate-100">{goal.title}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 pt-1">
              <div>
                <span className="text-slate-500">Target Value:</span> <span className="font-mono text-slate-200">{goal.target} {uom === 'percent' ? '%' : ''}</span>
              </div>
              <div>
                <span className="text-slate-500">Weightage:</span> <span className="font-mono text-indigo-400 font-bold">{goal.weightage}%</span>
              </div>
              <div>
                <span className="text-slate-500">Metrics UoM:</span> <span className="uppercase text-slate-300 font-medium">{uom}</span>
              </div>
            </div>
          </div>

          {/* Formula Indicator Bubble */}
          <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
            <span className="text-indigo-400 mt-0.5 text-base">ℹ️</span>
            <div>
              <span className="font-bold text-slate-300 block">Performance Metric Rule:</span>
              {uom === 'percent' && 'Scoring is direct proportional calculation: (Actual / Target) * 100. Capped at 100%.'}
              {uom === 'numeric' && 'Standard direct proportion. Allows up to 120% score for exceeding the corporate target.'}
              {uom === 'tat' && 'TAT (Speed-Metric): Lower is better. Exceeding target TAT reduces progress score proportionally.'}
              {uom === 'zero-occurrence' && 'Zero-Occurrence target. Each incident deducts 25% from progress score.'}
            </div>
          </div>

          {/* Inputs Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Actual Achievement Value</label>
              <input
                type="number"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`Enter current ${uom === 'percent' ? '%' : 'value'}`}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-3 text-sm transition font-mono"
              />
            </div>

            {/* Live real-time feedback block! */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Live Computed Progress</span>
              <div className="text-3xl font-extrabold text-indigo-400 mt-1 font-mono">
                {liveScore}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {liveScore >= 100 ? 'Target Achieved! 🏆' : liveScore > 50 ? 'Steady Progress ⚡' : 'Setup Stage ⏳'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Check-in Comments & Business Justification</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide comments, obstacles faced, or action plan details..."
              rows={3}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-3 text-sm transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white py-3 rounded-xl text-xs font-bold transition focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition focus:outline-none flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Recording...
                </>
              ) : (
                'Submit Check-in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
