import React, { useState } from 'react';

export default function MockCard({ notification, onClose }) {
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' or 'outlook'

  if (!notification) return null;

  const isEscalation = notification.title?.toUpperCase().includes('ESCALATION');
  const isRejection = notification.title?.toUpperCase().includes('REJECTED');
  const isSubmission = notification.title?.toUpperCase().includes('SUBMITTED') || notification.title?.toUpperCase().includes('SUBMISSION');

  // Compute colors and details
  let bannerColor = 'bg-indigo-600';
  let badgeText = 'Cascaded Target';
  let badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  
  if (isEscalation) {
    bannerColor = 'bg-rose-600';
    badgeText = 'HR Escalation Alert';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (isRejection) {
    bannerColor = 'bg-amber-600';
    badgeText = 'Action Needed: Revision';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (isSubmission) {
    bannerColor = 'bg-sky-600';
    badgeText = 'Review Needed';
    badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:h-[620px] max-h-[90vh]">
        
        {/* Header Control Panel */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/50 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500">GoalForge CAS (Cascading Alerts System)</span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Simulation Visualizer</span>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeColor}`}>
                {badgeText}
              </span>
            </h2>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'teams' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              MS Teams Adaptive Card
            </button>
            <button
              onClick={() => setActiveTab('outlook')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'outlook' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Outlook Email HTML
            </button>
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

        {/* Dynamic Mockup Body */}
        <div className="flex-1 bg-slate-950 p-6 md:p-10 overflow-y-auto flex items-center justify-center">
          
          {/* Teams Simulator */}
          {activeTab === 'teams' && (
            <div className="w-full max-w-lg bg-[#201F1F] rounded-lg shadow-xl border-l-[4px] border-[#5B5FC7] text-slate-100 overflow-hidden font-sans">
              
              {/* Teams Card Header */}
              <div className="px-4 py-3 bg-[#2D2C2C] flex items-center gap-2 border-b border-[#242424]">
                <div className="w-6 h-6 rounded bg-[#5B5FC7] flex items-center justify-center text-[10px] font-black text-white font-mono">
                  GF
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-200">GoalForge Connector</div>
                  <div className="text-[9px] text-slate-400">10:42 AM via Incoming Webhook</div>
                </div>
              </div>

              {/* Teams Card Content */}
              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-1.5">
                    {isEscalation ? '⚠️ ' : ''}{notification.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-[#2d2c2c]/40 p-3 rounded border border-slate-800">
                    {notification.message}
                  </p>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#1a1919] p-3 rounded">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Category</span>
                    <span className="font-bold text-slate-200">{isEscalation ? 'HR ESCALATION' : 'OKR CAS CASCADE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Delivery Channel</span>
                    <span className="font-bold text-slate-200">Teams CAS Webhook</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Required Action</span>
                    <span className="font-semibold text-indigo-400">
                      {isEscalation ? 'Immediate feedback in GoalForge panel' : 'Review cascade alignment'}
                    </span>
                  </div>
                </div>

                {/* Teams Card Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 bg-[#5B5FC7] hover:bg-[#4E51AA] text-white text-xs font-bold py-2 px-3 rounded shadow transition duration-150 focus:outline-none"
                  >
                    Launch GoalForge
                  </button>
                  <button
                    onClick={() => alert('Demo action: Notification status co-signed.')}
                    className="flex-1 bg-[#2D2C2C] hover:bg-[#3D3C3C] text-slate-300 hover:text-white border border-slate-700 text-xs font-bold py-2 px-3 rounded transition duration-150 focus:outline-none"
                  >
                    Quick Acknowledge
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Outlook Simulator */}
          {activeTab === 'outlook' && (
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl text-slate-800 overflow-hidden font-sans border border-slate-300">
              
              {/* Outlook Frame Header */}
              <div className="px-4 py-3 bg-[#F3F2F1] border-b border-slate-200 text-slate-600 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="ml-3 font-semibold text-slate-700">GoalForge System Mailer</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">SECURE TRANSIT</div>
              </div>

              {/* Email Envelope details */}
              <div className="p-4 bg-[#FAF9F8] border-b border-slate-200 space-y-1.5 text-xs">
                <div>
                  <span className="font-semibold text-slate-400 w-12 inline-block">From:</span>
                  <span className="text-slate-800 font-medium">GoalForge HR Engine &lt;portal-alerts@goalforge.com&gt;</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 w-12 inline-block">To:</span>
                  <span className="text-indigo-600 font-semibold underline">active-team@goalforge.com</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 w-12 inline-block">Subject:</span>
                  <span className="text-slate-900 font-bold">{notification.title}</span>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6 space-y-5 text-sm">
                
                {/* Beautiful HTML header inside the email */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl text-white">
                  <div>
                    <h3 className="font-extrabold text-base tracking-wide">GoalForge Enterprise</h3>
                    <p className="text-[10px] text-slate-300">Real-time Performance Architecture</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-1 bg-white/10 rounded border border-white/20">
                    Q2-2026 CYCLE
                  </span>
                </div>

                <div className="space-y-3 leading-relaxed text-slate-600 text-xs sm:text-sm">
                  <p>Dear Performance Associate,</p>
                  <p className="p-3 bg-slate-50 border-l-4 border-indigo-600 text-slate-700 font-medium rounded-r-lg">
                    {notification.message}
                  </p>
                  <p>
                    Please review this notification inside your interactive dashboard panel immediately. Failure to finalize OKRs may trigger hierarchical manager notifications.
                  </p>
                </div>

                {/* Email Sign-off */}
                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                  <p className="font-bold text-slate-600">GoalForge HR Compliance Team</p>
                  <p>Autogenerated Secure Notification • Please do not reply directly to this mailer.</p>
                </div>

                {/* Outlook Action Buttons */}
                <div className="pt-2 flex justify-start gap-3">
                  <button
                    onClick={onClose}
                    className="bg-[#0078D4] hover:bg-[#005A9E] text-white text-xs font-semibold py-2 px-5 rounded transition duration-150 focus:outline-none"
                  >
                    Open HR Portal
                  </button>
                  <button
                    onClick={() => alert('Demo action: Log co-signed inside browser')}
                    className="bg-[#F3F2F1] hover:bg-[#E1DFDD] text-slate-700 text-xs font-semibold py-2 px-4 rounded border border-slate-300 transition duration-150 focus:outline-none"
                  >
                    Quick Acknowledge
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 text-center flex items-center justify-between text-[10px] text-slate-500">
          <span>Active Simulation Node: Q2 OKRs Cascade System</span>
          <span>Adaptive Cards v1.4 Standards Verified</span>
        </div>

      </div>
    </div>
  );
}
