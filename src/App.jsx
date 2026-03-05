import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createRecord, updateRecord, listRecords } from './airtable.js';
import { getFieldValue, matchesRecordId } from './utils/airtable.js';

const QUESTIONS = [
    "Walk me through the biggest operational headache your team is dealing with right now — what breaks down, and how often?",
    "Have you used or evaluated Airtable before — and if so, what was that experience like?",
    "Where does your team's data live today, and who needs to touch it to get work done?",
    "If we got this right, what would be different about how your team works six months from now?",
];

const SESSIONS_TABLE = 'Interview Sessions';
const RESPONSES_TABLE = 'Interview Responses';

// ─── Walmart Spark Icon ────────────────────────────────────────────────────────

function WalmartSpark({ width = 40, height = 40 }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 532.262 600" width={width} height={height}>
            <g>
                <path style={{fill:'#FFC220'}} d="M375.663,273.363c12.505-2.575,123.146-53.269,133.021-58.97c22.547-13.017,30.271-41.847,17.254-64.393s-41.847-30.271-64.393-17.254c-9.876,5.702-109.099,76.172-117.581,85.715c-9.721,10.937-11.402,26.579-4.211,39.033C346.945,269.949,361.331,276.314,375.663,273.363z"/>
                <path style={{fill:'#FFC220'}} d="M508.685,385.607c-9.876-5.702-120.516-56.396-133.021-58.97c-14.332-2.951-28.719,3.415-35.909,15.87c-7.191,12.455-5.51,28.097,4.211,39.033c8.482,9.542,107.705,80.013,117.581,85.715c22.546,13.017,51.376,5.292,64.393-17.254S531.231,398.624,508.685,385.607z"/>
                <path style={{fill:'#FFC220'}} d="M266.131,385.012c-14.382,0-27.088,9.276-31.698,23.164c-4.023,12.117-15.441,133.282-15.441,144.685c0,26.034,21.105,47.139,47.139,47.139c26.034,0,47.139-21.105,47.139-47.139c0-11.403-11.418-132.568-15.441-144.685C293.219,394.288,280.513,385.012,266.131,385.012z"/>
                <path style={{fill:'#FFC220'}} d="M156.599,326.637c-12.505,2.575-123.146,53.269-133.021,58.97C1.031,398.624-6.694,427.454,6.323,450c13.017,22.546,41.847,30.271,64.393,17.254c9.876-5.702,109.098-76.172,117.58-85.715c9.722-10.937,11.402-26.579,4.211-39.033S170.931,323.686,156.599,326.637z"/>
                <path style={{fill:'#FFC220'}} d="M70.717,132.746C48.171,119.729,19.341,127.454,6.323,150c-13.017,22.546-5.292,51.376,17.254,64.393c9.876,5.702,120.517,56.396,133.021,58.97c14.332,2.951,28.719-3.415,35.91-15.87c7.191-12.455,5.51-28.096-4.211-39.033C179.815,208.918,80.592,138.447,70.717,132.746z"/>
                <path style={{fill:'#FFC220'}} d="M266.131,0c-26.035,0-47.139,21.105-47.139,47.139c0,11.403,11.418,132.568,15.441,144.685c4.611,13.888,17.317,23.164,31.698,23.164s27.088-9.276,31.698-23.164c4.023-12.117,15.441-133.282,15.441-144.685C313.27,21.105,292.165,0,266.131,0z"/>
            </g>
        </svg>
    );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onStart, onAdmin, onShowDemo }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [inputMode, setInputMode] = useState('speak');
    const isValid = name.trim() && email.includes('@') && email.includes('.');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid) onStart(name.trim(), email.trim(), inputMode);
    };

    return (
        <div className="min-h-screen bg-[#0071CE] flex items-center justify-center p-8 relative">
            <div className="absolute top-4 right-4 flex items-center gap-3">
                <button
                    onClick={onShowDemo}
                    className="text-white/40 hover:text-white/70 text-sm w-6 h-6 rounded-full border border-white/30 hover:border-white/60 flex items-center justify-center transition-colors"
                >
                    ?
                </button>
                <button
                    onClick={onAdmin}
                    className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                    View sessions
                </button>
            </div>
            <div className="max-w-sm w-full">
                {/* Walmart Spark */}
                <div className="mb-7">
                    <WalmartSpark width={40} height={40} />
                </div>

                {/* Heading */}
                <p className="text-[#E8F4FD] text-sm font-mono uppercase tracking-widest mb-2">Walmart Center of Excellence</p>
                <h1 className="text-white text-4xl font-semibold mb-3 leading-snug">Business Discovery Interview</h1>
                <p className="text-[#E8F4FD] text-lg leading-relaxed mb-6">
                    Help us understand how your team works today. 4 short questions — your answers inform the solution we&apos;ll design for you.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <p className="text-white text-lg mb-2">What&apos;s your name?</p>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="First name is fine"
                            autoFocus
                            className="w-full bg-white/[0.12] border border-white/25 rounded-lg px-4 py-3 text-white text-lg placeholder-white/60 outline-none focus:border-white/50"
                        />
                    </div>
                    <div className="mb-3">
                        <p className="text-white text-lg mb-2">Your email address</p>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full bg-white/[0.12] border border-white/25 rounded-lg px-4 py-3 text-white text-lg placeholder-white/60 outline-none focus:border-white/50"
                        />
                    </div>
                    <div className="mb-3">
                        <button
                            type="button"
                            onClick={() => setInputMode(inputMode === 'type' ? 'speak' : 'type')}
                            className="text-white/70 text-xs hover:underline transition-colors cursor-pointer bg-transparent border-none p-0"
                        >
                            {inputMode === 'type' ? 'Switch back to voice' : 'Prefer to type? Switch to text'}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!isValid}
                        className={`w-full py-3 rounded-lg text-lg font-medium transition-all ${
                            isValid
                                ? 'bg-[#FFC220] text-black hover:bg-[#e6af00] cursor-pointer'
                                : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                    >
                        Let&apos;s go →
                    </button>
                </form>
            </div>
        </div>
    );
}

// ─── Permission Screens ────────────────────────────────────────────────────────

function CheckingScreen() {
    return (
        <div className="min-h-screen bg-[#0071CE] flex items-center justify-center">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#E8F4FD] text-lg">Requesting microphone…</p>
            </div>
        </div>
    );
}

function BlockedScreen({ error, onTextOnly }) {
    return (
        <div className="min-h-screen bg-[#0071CE] flex items-center justify-center p-8">
            <div className="max-w-sm text-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                </div>
                <h2 className="text-white text-2xl font-semibold mb-2">Mic Blocked</h2>
                <p className="text-[#E8F4FD] text-lg mb-6 leading-relaxed">
                    This app needs microphone access. Grant permission in your browser, then reload.
                </p>
                <div className="bg-white/[0.12] border border-white/25 rounded-lg p-4 text-left mb-5">
                    <p className="text-white/50 text-sm font-mono uppercase tracking-wider mb-2">Error</p>
                    <p className="text-red-300 text-base font-mono break-all">{error || 'Unknown error'}</p>
                </div>
                <button
                    onClick={onTextOnly}
                    className="text-gray-500 text-base hover:text-gray-300 transition-colors"
                >
                    Continue with typed answers instead →
                </button>
            </div>
        </div>
    );
}

// ─── Thank You Screen ──────────────────────────────────────────────────────────

function ThankYouScreen({ name }) {
    return (
        <div className="min-h-screen bg-[#0071CE] flex items-center justify-center p-8">
            <div className="max-w-sm text-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFC220" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
                <h1 className="text-white text-3xl font-semibold mb-3">You&apos;re all set, {name}.</h1>
                <p className="text-[#E8F4FD] text-lg">We&apos;ll be in touch soon.</p>
            </div>
        </div>
    );
}

// ─── Recap Screen ──────────────────────────────────────────────────────────────

function RecapScreen({ sessionRecordId, intervieweeName, intervieweeEmail, onThankYou }) {
    const [session, setSession] = useState(null);
    const [responses, setResponses] = useState([]);

    // Poll session + responses until AI fields populate
    useEffect(() => {
        const load = async () => {
            try {
                const [sessions, recs] = await Promise.all([
                    listRecords(SESSIONS_TABLE, {
                        fields: ['Interview Brief', 'Send Email(s)', 'Other Emails'],
                    }),
                    listRecords(RESPONSES_TABLE, {
                        fields: ['Session', 'Question Number', 'Question Text', 'Cleaned Transcript'],
                    }),
                ]);
                const sess = sessions.find(r => r.id === sessionRecordId);
                const myResponses = recs
                    .filter(r => matchesRecordId(getFieldValue(r.fields['Session']), sessionRecordId))
                    .sort((a, b) => (getFieldValue(a.fields['Question Number']) || 0) - (getFieldValue(b.fields['Question Number']) || 0));
                setSession(sess);
                setResponses(myResponses);
            } catch (err) {
                console.error('Polling error:', err);
            }
        };

        load();
        const interval = setInterval(load, 3000);
        return () => clearInterval(interval);
    }, [sessionRecordId]);

    const interviewBrief = getFieldValue(session?.fields['Interview Brief']) ?? '';

    const [briefVisible, setBriefVisible] = useState(false);
    useEffect(() => {
        if (interviewBrief && !briefVisible) setBriefVisible(true);
    }, [interviewBrief, briefVisible]);

    const [sendToSelf, setSendToSelf] = useState(true);
    const [otherEmails, setOtherEmails] = useState('');
    const [sendStatus, setSendStatus] = useState('idle');
    const [sendError, setSendError] = useState(null);

    useEffect(() => {
        if (sendStatus !== 'sent') return;
        const t = setTimeout(onThankYou, 2000);
        return () => clearTimeout(t);
    }, [sendStatus, onThankYou]);

    const handleSend = async () => {
        if (sendStatus !== 'idle') return;
        setSendStatus('sending');
        setSendError(null);
        try {
            await updateRecord(SESSIONS_TABLE, sessionRecordId, {
                'Send Email(s)': sendToSelf || false,
                'Other Emails': otherEmails.trim() || null,
            });
            setSendStatus('sent');
        } catch (err) {
            setSendError(err?.message || String(err));
            setSendStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#0071CE] overflow-y-auto">
            <div className="max-w-lg mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC220" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-white/50 text-sm font-mono uppercase tracking-widest">Interview Complete</p>
                        <h1 className="text-white text-3xl font-semibold">Thanks, {intervieweeName}.</h1>
                    </div>
                </div>

                {/* What we heard */}
                <div className="mb-6">
                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mb-3">What we heard</p>
                    <div className="bg-white/[0.12] border border-white/25 rounded-xl p-5">
                        {interviewBrief ? (
                            <p className={`text-white text-lg leading-relaxed transition-opacity duration-500 ${briefVisible ? 'opacity-100' : 'opacity-0'}`}>
                                {interviewBrief}
                            </p>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
                                <p className="text-white/40 text-base">Almost ready…</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Per-answer cleaned transcripts */}
                <div className="mb-8">
                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mb-3">What you shared</p>
                    <div className="space-y-3">
                        {responses.map((r, i) => {
                            const cleaned = getFieldValue(r.fields['Cleaned Transcript']) ?? '';
                            return (
                                <div key={r.id} className="bg-white/[0.12] border border-white/25 rounded-xl p-4">
                                    <p className="text-white/50 text-sm mb-2">Q{i + 1} — {getFieldValue(r.fields['Question Text']) || ''}</p>
                                    {cleaned ? (
                                        <p className="text-white text-lg leading-relaxed">{cleaned}</p>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin flex-shrink-0" />
                                            <p className="text-white/40 text-sm">Just a moment…</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Follow-up */}
                {sendStatus === 'sent' ? (
                    <div className="bg-white/[0.12] border border-white/25 rounded-xl p-5">
                        <div className="flex items-center gap-2 text-[#FFC220] text-lg mb-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            On its way
                        </div>
                        <p className="text-[#E8F4FD] text-lg">Someone from our team will follow up with you shortly.</p>
                    </div>
                ) : (
                    <div className="bg-white/[0.12] border border-white/25 rounded-xl p-5">
                        <p className="text-white text-lg font-medium mb-1">Want a copy of this conversation?</p>
                        <p className="text-white/60 text-base mb-4 leading-relaxed">We&apos;ll send you a short note with what you shared today.</p>

                        <label className="flex items-center gap-3 cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                checked={sendToSelf}
                                onChange={e => setSendToSelf(e.target.checked)}
                                className="w-4 h-4 accent-white cursor-pointer"
                            />
                            <span className="text-white/80 text-lg">Send to <span className="text-white">{intervieweeEmail}</span></span>
                        </label>

                        <div className="mb-4">
                            <textarea
                                value={otherEmails}
                                onChange={e => setOtherEmails(e.target.value)}
                                placeholder="Anyone else who should get a copy? (comma-separated)"
                                rows={2}
                                className="w-full bg-white/[0.08] border border-white/25 rounded-lg px-3 py-2.5 text-white text-lg placeholder-white/40 outline-none focus:border-white/50 resize-none"
                            />
                        </div>

                        {!interviewBrief ? (
                            <div className="flex items-center gap-2.5">
                                <div className="w-3.5 h-3.5 border border-white/20 border-t-white/60 rounded-full animate-spin flex-shrink-0" />
                                <p className="text-white/40 text-base">Almost ready…</p>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleSend}
                                    disabled={sendStatus === 'sending' || (!sendToSelf && !otherEmails.trim())}
                                    className={`w-full py-2.5 rounded-lg text-lg font-medium transition-all ${
                                        sendStatus === 'sending' || (!sendToSelf && !otherEmails.trim())
                                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                            : 'bg-[#FFC220] text-black hover:bg-[#e6af00] cursor-pointer'
                                    }`}
                                >
                                    {sendStatus === 'sending' ? 'Sending…' : 'Send it →'}
                                </button>
                                {sendStatus === 'error' && sendError && (
                                    <p className="text-red-300 text-sm font-mono mt-2 break-all">{sendError}</p>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Admin View ────────────────────────────────────────────────────────────────

function AdminView({ onBack }) {
    const [sessions, setSessions] = useState([]);
    const [responseRecords, setResponseRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [sess, recs] = await Promise.all([
                    listRecords(SESSIONS_TABLE, {
                        fields: ['Interviewee Name', 'Email', 'Status', 'Interview Brief', 'Started At'],
                        sort: [{ field: 'Started At', direction: 'desc' }],
                    }),
                    listRecords(RESPONSES_TABLE, {
                        fields: ['Session', 'Question Number', 'One Line Summary', 'Sentiment Signal'],
                    }),
                ]);
                setSessions(sess);
                setResponseRecords(recs);
            } catch (err) {
                console.error('Load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const [expandedId, setExpandedId] = useState(null);

    const handleAbandon = useCallback(async (sessionId) => {
        try {
            await updateRecord(SESSIONS_TABLE, sessionId, { 'Status': 'Abandoned' });
            setSessions(prev =>
                prev.map(s =>
                    s.id === sessionId ? { ...s, fields: { ...s.fields, 'Status': 'Abandoned' } } : s
                )
            );
        } catch (err) {
            console.error('Failed to mark abandoned:', err);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#0071CE] flex flex-col">
            {/* Header */}
            <div className="border-b border-white/20 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mb-0.5">Interview Concierge</p>
                    <h1 className="text-white text-xl font-semibold">All Sessions</h1>
                </div>
                <button
                    onClick={onBack}
                    className="text-white/60 text-base hover:text-white transition-colors"
                >
                    ← New Interview
                </button>
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2">
                        <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                        <p className="text-white/40 text-base">Loading…</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <p className="text-white/40 text-base text-center py-16">No sessions yet</p>
                ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">
                        {sessions.map(session => {
                            const name = getFieldValue(session.fields['Interviewee Name']) || '';
                            const email = getFieldValue(session.fields['Email']) || '';
                            const statusName = getFieldValue(session.fields['Status']) || '—';
                            const brief = getFieldValue(session.fields['Interview Brief']) ?? '';
                            const startedAt = getFieldValue(session.fields['Started At']) || null;
                            const expanded = expandedId === session.id;

                            const isVisuallyAbandoned = statusName === 'In Progress' &&
                                startedAt &&
                                (Date.now() - new Date(startedAt).getTime() > 24 * 60 * 60 * 1000);
                            const isAbandoned = isVisuallyAbandoned || statusName === 'Abandoned';
                            const canAbandon = statusName === 'In Progress';

                            const formattedDate = startedAt ? (() => {
                                const d = new Date(startedAt);
                                const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                                return `${datePart} at ${timePart}`;
                            })() : null;

                            const badgeName = isVisuallyAbandoned ? 'Abandoned' : statusName;
                            const badgeClass = statusName === 'Complete' ? 'bg-green-500/10 text-green-400' :
                                (isVisuallyAbandoned || statusName === 'Abandoned') ? 'bg-white/10 text-white/40' :
                                statusName === 'In Progress' ? 'bg-white/10 text-white/80' :
                                'bg-white/10 text-white/40';

                            const sessionResponses = responseRecords
                                .filter(r => matchesRecordId(getFieldValue(r.fields['Session']), session.id))
                                .sort((a, b) => (getFieldValue(a.fields['Question Number']) || 0) - (getFieldValue(b.fields['Question Number']) || 0));

                            return (
                                <div key={session.id} className={`bg-white/[0.12] border border-white/20 rounded-xl overflow-hidden transition-opacity ${isAbandoned ? 'opacity-50' : 'opacity-100'}`}>
                                    <div
                                        onClick={() => setExpandedId(expanded ? null : session.id)}
                                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.08] transition-colors cursor-pointer"
                                    >
                                        <div>
                                            <p className="text-white font-medium">{name || 'Unnamed'}</p>
                                            <p className="text-white/60 text-sm mt-0.5">{email}</p>
                                            {formattedDate && (
                                                <p className="text-white/40 text-sm mt-0.5">{formattedDate}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm px-2 py-0.5 rounded-full ${badgeClass}`}>
                                                {badgeName}
                                            </span>
                                            {canAbandon && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleAbandon(session.id); }}
                                                    className="text-sm text-white/40 hover:text-red-300 transition-colors whitespace-nowrap"
                                                >
                                                    Abandon
                                                </button>
                                            )}
                                            <svg
                                                width="12" height="12" viewBox="0 0 24 24" fill="none"
                                                stroke="rgba(255,255,255,0.4)" strokeWidth="2"
                                                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>

                                    {expanded && (
                                        <div className="border-t border-white/20 px-5 py-4 space-y-4">
                                            {brief ? (
                                                <div>
                                                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mb-2">AI Summary</p>
                                                    <p className="text-white text-base leading-relaxed">{brief}</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border border-white/20 border-t-white/50 rounded-full animate-spin flex-shrink-0" />
                                                    <p className="text-white/40 text-sm">Generating summary…</p>
                                                </div>
                                            )}

                                            {sessionResponses.length > 0 && (
                                                <div>
                                                    <p className="text-white/50 text-sm font-mono uppercase tracking-widest mb-2">Responses</p>
                                                    <div className="space-y-2">
                                                        {sessionResponses.map((r, i) => {
                                                            const summary = getFieldValue(r.fields['One Line Summary']) ?? '';
                                                            const sentiment = getFieldValue(r.fields['Sentiment Signal']) ?? '';
                                                            return (
                                                                <div key={r.id} className="bg-white/[0.08] rounded-lg p-3">
                                                                    <p className="text-white/50 text-sm mb-1.5">Q{i + 1}</p>
                                                                    {summary ? (
                                                                        <p className="text-white text-base leading-relaxed">{summary}</p>
                                                                    ) : (
                                                                        <p className="text-white/40 text-sm italic">Generating…</p>
                                                                    )}
                                                                    {sentiment && (
                                                                        <p className="text-white/50 text-sm mt-1.5 italic">{sentiment}</p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Audio Level Indicator ─────────────────────────────────────────────────────

function AudioLevelBars({ level, isListening }) {
    const BAR_COUNT = 7;
    return (
        <div className="flex items-end gap-0.5 h-6">
            {Array.from({ length: BAR_COUNT }, (_, i) => {
                const threshold = (i + 1) / BAR_COUNT;
                const active = isListening && level > threshold * 0.6;
                return (
                    <div
                        key={i}
                        className={`w-1 rounded-full transition-colors duration-75 ${active ? 'bg-[#FFC220]' : 'bg-white/20'}`}
                        style={{ height: `${30 + (i / BAR_COUNT) * 70}%` }}
                    />
                );
            })}
        </div>
    );
}

// ─── Interview Screen ──────────────────────────────────────────────────────────

function InterviewScreen({ questionIndex, transcript, interimTranscript, audioLevel, isListening, isSaving, savedAt, saveError, onSubmit, transitioning, isTextOnly, onTextChange, onToggleMode, canSwitchToSpeak }) {
    const hasText = transcript.trim().length > 0 || (!isTextOnly && interimTranscript.trim().length > 0);
    const justSaved = savedAt === questionIndex;
    const isLastQuestion = questionIndex === QUESTIONS.length - 1;
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const hasActiveTranscription = !isTextOnly && interimTranscript.trim().length > 0;

    return (
        <div className="min-h-screen bg-[#0071CE] flex flex-col">
            {/* Top bar */}
            <div className="flex items-start justify-between p-5">
                <div className="w-20" style={{ height: '56px' }} />

                {/* Step bar */}
                <div className="flex items-center gap-1.5 pt-2">
                    {QUESTIONS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 rounded-full transition-all duration-500 ${
                                i < questionIndex ? 'bg-[#FFC220]' :
                                i === questionIndex ? 'bg-[#FFC220]' :
                                'bg-white/20'
                            }`}
                            style={{ width: '28px' }}
                        />
                    ))}
                </div>
            </div>

            {/* Main content — fades between questions */}
            <div className={`flex-1 flex flex-col justify-center px-6 pb-6 max-w-lg mx-auto w-full transition-opacity duration-200 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-white/60 text-sm font-mono tracking-widest uppercase mb-4">
                    Question {questionIndex + 1} of {QUESTIONS.length}
                </p>

                <h1 className="text-white text-3xl font-semibold leading-snug mb-6">
                    {QUESTIONS[questionIndex]}
                </h1>

                {/* Transcript / text input area */}
                <div className="bg-white/[0.12] border border-white/25 rounded-xl p-5 min-h-[120px] mb-5">
                    {isTextOnly ? (
                        <textarea
                            value={transcript}
                            onChange={e => onTextChange(e.target.value)}
                            placeholder="Type your answer here…"
                            autoFocus
                            className="w-full bg-transparent text-white text-lg leading-relaxed outline-none resize-none min-h-[80px] placeholder-white/40"
                        />
                    ) : hasText ? (
                        <p className="text-white text-lg leading-relaxed">
                            {transcript}
                            <span className="text-white/60">{interimTranscript}</span>
                        </p>
                    ) : (
                        <p className="text-white/40 text-lg">
                            {!SpeechAPI
                                ? '⚠ Speech recognition requires Chrome or Edge'
                                : isListening
                                ? 'Listening… start speaking'
                                : 'Starting…'}
                        </p>
                    )}
                </div>

                {/* Per-question mode toggle */}
                <div className="flex justify-end mt-2 mb-1">
                    {(!isTextOnly || canSwitchToSpeak) && (
                        <button type="button" onClick={onToggleMode} className="text-white/40 text-xs hover:text-white/70 hover:underline transition-colors cursor-pointer bg-transparent border-none p-0">
                            {!isTextOnly ? 'Prefer to type? Switch to text' : 'Switch back to voice'}
                        </button>
                    )}
                </div>

                {/* Error display */}
                {saveError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                        <p className="text-red-300 text-sm font-mono break-all">{saveError}</p>
                    </div>
                )}

                {/* Bottom row */}
                <div className="flex items-center justify-between">
                    {/* Mic indicator — hidden in text-only mode */}
                    {isTextOnly ? (
                        <div />
                    ) : (
                        <div className="flex items-center gap-2.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-white/20'}`} />
                            <AudioLevelBars level={audioLevel} isListening={isListening} />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {justSaved && !isSaving && (
                            <span className="text-[#FFC220] text-lg">Saved ✓</span>
                        )}
                        <button
                            onClick={onSubmit}
                            disabled={!hasText || isSaving || hasActiveTranscription}
                            className={`px-4 py-2.5 rounded-lg text-lg font-medium transition-all ${
                                hasText && !isSaving && !hasActiveTranscription
                                    ? 'bg-[#FFC220] text-black hover:bg-[#e6af00] cursor-pointer'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? 'Saving…' : hasActiveTranscription ? 'Listening…' : isLastQuestion ? 'Finish' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
    const [view, setView] = useState('interview');
    const [intervieweeName, setIntervieweeName] = useState(null);
    const [intervieweeEmail, setIntervieweeEmail] = useState('');
    const [permStatus, setPermStatus] = useState('checking');
    const [transitioning, setTransitioning] = useState(false);
    const [permError, setPermError] = useState(null);
    const [stream, setStream] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [sessionRecordId, setSessionRecordId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedAt, setSavedAt] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [isThankYou, setIsThankYou] = useState(false);
    const [questionOverride, setQuestionOverride] = useState(null); // null | 'speak' | 'type'
    const [showDemo, setShowDemo] = useState(true);

    const recognitionRef = useRef(null);
    const animFrameRef = useRef(null);
    const accumulatedRef = useRef('');

    // ── Permissions — only after intro is done ─────────────────────────────────
    useEffect(() => {
        if (!intervieweeName || permStatus === 'text-only') return;
        let mediaStream = null;
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(s => {
                mediaStream = s;
                setStream(s);
                setPermStatus('granted');
            })
            .catch(err => {
                console.error('getUserMedia failed:', err.name, err.message, err);
                setPermStatus('blocked');
                setPermError(`${err.name}: ${err.message}`);
            });
        return () => {
            if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
        };
    }, [intervieweeName]);

    // ── Audio level meter ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!stream) return;
        let audioCtx = null;
        try {
            audioCtx = new AudioContext();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(avg / 255);
                animFrameRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch (e) {
            console.error('AudioContext error:', e);
        }
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            if (audioCtx) audioCtx.close();
        };
    }, [stream]);

    // ── Speech recognition ─────────────────────────────────────────────────────
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            const r = recognitionRef.current;
            recognitionRef.current = null;
            try { r.stop(); } catch { /* already stopped */ }
        }
        setIsListening(false);
    }, []);

    const startListening = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        if (recognitionRef.current) {
            const old = recognitionRef.current;
            recognitionRef.current = null;
            try { old.stop(); } catch { /* already stopped */ }
        }

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = event => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    accumulatedRef.current += event.results[i][0].transcript + ' ';
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setTranscript(accumulatedRef.current);
            setInterimTranscript(interim);
        };

        recognition.onend = () => {
            if (recognitionRef.current === recognition) {
                try { recognition.start(); } catch { /* recognition start may throw briefly */ }
            }
        };

        recognition.onerror = e => {
            if (e.error !== 'no-speech') {
                console.error('SpeechRecognition error:', e.error, e);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
            setIsListening(true);
        } catch (e) {
            console.error('SpeechRecognition start failed:', e);
        }
    }, []);

    useEffect(() => {
        if (permStatus === 'granted') {
            startListening();
        }
        return () => stopListening();
    }, [permStatus, startListening, stopListening]);

    // ── Text-only input handler ────────────────────────────────────────────────
    const handleTextChange = useCallback((text) => {
        accumulatedRef.current = text;
        setTranscript(text);
        setInterimTranscript('');
    }, []);

    // ── Per-question mode toggle ───────────────────────────────────────────────
    const handleToggleQuestionMode = useCallback(() => {
        const currentlyType = questionOverride === 'type' || (questionOverride === null && permStatus === 'text-only');
        accumulatedRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        if (currentlyType) {
            if (permStatus !== 'granted') return;
            setQuestionOverride('speak');
            startListening();
        } else {
            stopListening();
            setQuestionOverride('type');
        }
    }, [questionOverride, permStatus, startListening, stopListening]);

    // ── Submit answer ──────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (isSaving) return;
        const fullTranscript = (accumulatedRef.current + interimTranscript).trim();
        if (!fullTranscript) return;

        setIsSaving(true);
        setSaveError(null);
        stopListening();

        try {
            // Create session on first answer
            let currentSessionId = sessionRecordId;
            if (!currentSessionId) {
                currentSessionId = await createRecord(SESSIONS_TABLE, {
                    'Session ID': `session-${Date.now()}`,
                    'Interviewee Name': intervieweeName || '',
                    'Email': intervieweeEmail || '',
                    'Started At': new Date().toISOString(),
                    'Status': 'In Progress',
                    'User Agent': navigator.userAgent,
                });
                setSessionRecordId(currentSessionId);
            }

            // Write the response
            await createRecord(RESPONSES_TABLE, {
                'Response ID': `resp-${Date.now()}`,
                'Session': [currentSessionId],
                'Question Number': questionIndex + 1,
                'Question Text': QUESTIONS[questionIndex],
                'Raw Transcript': fullTranscript,
                'Recorded At': new Date().toISOString(),
            });

            setSavedAt(questionIndex);

            const nextIndex = questionIndex + 1;
            if (nextIndex >= QUESTIONS.length) {
                await updateRecord(SESSIONS_TABLE, currentSessionId, { 'Status': 'Complete' });
                setIsComplete(true);
                if (stream) stream.getTracks().forEach(t => t.stop());
            } else {
                setTransitioning(true);
                setTimeout(() => {
                    accumulatedRef.current = '';
                    setTranscript('');
                    setInterimTranscript('');
                    setSavedAt(null);
                    setQuestionIndex(nextIndex);
                    setQuestionOverride(null);
                    setTransitioning(false);
                    if (permStatus === 'granted') startListening();
                }, 250);
            }
        } catch (err) {
            console.error('Save failed:', err);
            setSaveError(err?.message || String(err));
            startListening();
        }

        setIsSaving(false);
    }, [isSaving, interimTranscript, questionIndex, sessionRecordId, intervieweeName, intervieweeEmail, permStatus, stream, startListening, stopListening]);

    // ── Render ─────────────────────────────────────────────────────────────────
    let content;
    if (view === 'admin') {
        content = <AdminView onBack={() => setView('interview')} />;
    } else if (!intervieweeName) {
        content = <IntroScreen onStart={(name, email, inputMode) => { if (inputMode === 'type') setPermStatus('text-only'); setIntervieweeName(name); setIntervieweeEmail(email); }} onAdmin={() => setView('admin')} onShowDemo={() => setShowDemo(true)} />;
    } else if (permStatus === 'checking') {
        content = <CheckingScreen />;
    } else if (permStatus === 'blocked') {
        content = <BlockedScreen error={permError} onTextOnly={() => setPermStatus('text-only')} />;
    } else if (isThankYou) {
        content = <ThankYouScreen name={intervieweeName} />;
    } else if (isComplete) {
        content = <RecapScreen sessionRecordId={sessionRecordId} intervieweeName={intervieweeName} intervieweeEmail={intervieweeEmail} onThankYou={() => setIsThankYou(true)} />;
    } else {
        const effectiveIsTextOnly = questionOverride === 'type' || (questionOverride === null && permStatus === 'text-only');
        content = (
            <InterviewScreen
                questionIndex={questionIndex}
                transcript={transcript}
                interimTranscript={interimTranscript}
                audioLevel={audioLevel}
                isListening={isListening}
                isSaving={isSaving}
                savedAt={savedAt}
                saveError={saveError}
                onSubmit={handleSubmit}
                transitioning={transitioning}
                isTextOnly={effectiveIsTextOnly}
                onTextChange={handleTextChange}
                onToggleMode={handleToggleQuestionMode}
                canSwitchToSpeak={permStatus === 'granted'}
            />
        );
    }

    return (
        <>
            {content}
            {showDemo && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 20000,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', borderRadius: 16,
                        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                        width: 520, padding: '40px 44px',
                        fontFamily: 'system-ui, sans-serif',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <WalmartSpark width={32} height={32} />
                            <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0071CE' }}>
                                Walmart Center of Excellence
                            </span>
                        </div>
                        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: '0 0 8px' }}>
                            Business Discovery Interview
                        </h2>
                        <p style={{ fontSize: 15, color: '#555', margin: '0 0 28px', lineHeight: 1.6 }}>
                            An AI-powered tool that captures stakeholder interviews and instantly surfaces insights for the CoE team — no notes, no follow-up, no lost context.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                            {[
                                { n: '1', label: 'Stakeholder enters their name and answers 4 guided questions — by voice or text.' },
                                { n: '2', label: 'Responses are transcribed and saved automatically to Airtable in real time.' },
                                { n: '3', label: 'The CoE team reviews a structured summary and AI-generated insights without ever scheduling a debrief.' },
                            ].map(({ n, label }) => (
                                <div key={n} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        backgroundColor: '#0071CE', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1,
                                    }}>{n}</div>
                                    <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.6 }}>{label}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowDemo(false)}
                            style={{
                                width: '100%', padding: '14px 0',
                                backgroundColor: '#0071CE', color: '#fff',
                                border: 'none', borderRadius: 10,
                                fontSize: 15, fontWeight: 600, cursor: 'pointer',
                            }}
                        >
                            Got it — show me the app
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
