import type { FC } from "hono/jsx";
import type { Transcription, SpeakerTurn } from "../../database/schema";
import { Layout } from "../layout";

type Props = {
  transcription: Transcription;
  speakerTurns: SpeakerTurn[];
  audioUrl: string | null;
};

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function fmtDuration(s: number | null): string | null {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

const badgeClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  pending: "Pending",
  processing: "Processing...",
  completed: "Done",
  failed: "Failed",
};

export const TranscriptionPage: FC<Props> = ({ transcription: t, speakerTurns, audioUrl }) => {
  const isCompleted = t.status === "completed";
  const isProcessing = t.status === "pending" || t.status === "processing";
  const isFailed = t.status === "failed";
  const duration = fmtDuration(t.processingDurationInSeconds);

  return (
    <Layout title={t.name}>
      {/* ── Header ── */}
      <div class="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <a href="/" class="flex items-center gap-1 text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>
          <span class="text-gray-300">·</span>
          <h1 class="text-xl font-bold">{t.name}</h1>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          {t.detectedLanguage && <span class="text-sm text-gray-500">{t.detectedLanguage}</span>}
          {duration && (
            <>
              <span class="text-gray-300">·</span>
              <span class="text-sm text-gray-500">{duration}</span>
            </>
          )}
          <span class="text-gray-300">·</span>
          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass[t.status]}`} id="status-badge">
            {statusLabel[t.status]}
          </span>
          {isCompleted && (
            <button class="p-1.5 rounded-lg border border-gray-200 text-gray-500 bg-transparent hover:bg-gray-50 cursor-pointer transition-colors" id="chat-toggle-btn" onclick="toggleChat()" title="Open AI Chat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
          <button class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer border-0 bg-transparent transition-colors" onclick="deletePage()" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Sub-header ── */}
      {isCompleted && speakerTurns.length > 0 && <p class="mb-5 text-sm text-gray-400">{speakerTurns.length} segments</p>}

      {/* ── Processing ── */}
      {isProcessing && (
        <div class="text-center py-20">
          <div class="w-11 h-11 rounded-full border-[3px] border-gray-200 border-t-emerald-500 animate-spin mx-auto mb-5" />
          <p class="font-semibold text-base mb-2">{t.status === "pending" ? "Queued for processing..." : "Transcribing audio..."}</p>
          <p class="text-sm text-gray-500">This may take a minute. The page will update automatically.</p>
        </div>
      )}

      {/* ── Failed ── */}
      {isFailed && (
        <div class="text-center py-20">
          <div class="text-5xl mb-4">❌</div>
          <p class="font-semibold text-base mb-2 text-red-500">Transcription failed</p>
          <p class="text-sm text-gray-500 mb-6">Something went wrong during processing. Please try again.</p>
          <a href="/" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            Back to list
          </a>
        </div>
      )}

      {/* ── Completed: two-col layout ── */}
      {isCompleted && (
        <div id="detail-layout" class="grid grid-cols-1 gap-5">
          {/* Speaker turns */}
          <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-20">
            <div class="px-6 py-3.5 border-b border-gray-100 flex items-center gap-2 font-semibold text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Transcript
            </div>
            {speakerTurns.length === 0 ? (
              <p class="p-10 text-center text-sm text-gray-500">No transcript segments found.</p>
            ) : (
              <ul class="divide-y divide-gray-50">
                {speakerTurns.map((turn) => (
                  <li class="grid grid-cols-[90px_1fr] gap-4 px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors turn-item" key={turn.id} data-start={turn.start.toString()} data-end={turn.end.toString()} onclick="seekTo(this)">
                    <span class="text-[13px] text-gray-400 tabular-nums pt-px">
                      {fmtTime(turn.start)} – {fmtTime(turn.end)}
                    </span>
                    <span class="text-sm leading-relaxed">{turn.content}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chat panel — hidden until toggled */}
          <div id="chat-panel" class="hidden flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-20 sticky top-[72px]" style="height: calc(100vh - 160px);">
            <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <span class="font-bold text-[15px]">Prompt &amp; Analyse</span>
              <button class="p-1.5 rounded-lg border border-gray-200 text-gray-400 bg-transparent hover:bg-gray-50 cursor-pointer transition-colors" onclick="toggleChat()" title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div id="chat-messages" class="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              <div id="chat-empty" class="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2 text-center py-10">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-300">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Ask anything about this transcription</span>
              </div>
            </div>
            <div class="px-4 py-3 border-t border-gray-100 flex gap-2 items-end shrink-0">
              <textarea
                id="chat-input"
                class="flex-1 px-3.5 py-2 border border-gray-200 rounded-2xl text-sm outline-none focus:border-emerald-500 resize-none leading-relaxed transition-colors"
                placeholder="Ask a question about this transcript..."
                rows={1}
                onkeydown="handleChatKey(event)"
                oninput="onChatInput(this)"
              />
              <button id="chat-send-btn" class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer border-0 hover:bg-emerald-600 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed" onclick="sendMessage()" disabled>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Audio player ── */}
      {audioUrl && (
        <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2.5 flex items-center gap-4 z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <div class="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div class="shrink-0">
            <p class="text-sm font-semibold truncate max-w-[180px]">{t.name}</p>
            <p class="text-[11px] text-gray-400">
              <span id="cur-time">0:00</span> · <span id="tot-time">0:00</span>
            </p>
          </div>
          <button id="play-btn" class="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 cursor-pointer border-0 hover:bg-emerald-600 transition-colors" onclick="togglePlay()">
            <svg id="play-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <div class="flex-1 flex flex-col gap-1 min-w-0">
            <input type="range" id="progress-bar" value="0" min="0" step="0.05" oninput="onSeek(this)" />
            <div class="flex justify-between text-[11px] text-gray-400">
              <span id="p-cur">0:00</span>
              <span id="p-tot">0:00</span>
            </div>
          </div>
          <audio id="audio-el" src={audioUrl} preload="metadata" />
        </div>
      )}

      {/* Toast */}
      <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300 whitespace-nowrap" />

      <script dangerouslySetInnerHTML={{ __html: buildScript(t.id, t.status, audioUrl !== null) }} />
    </Layout>
  );
};

function buildScript(transcriptionId: string, status: string, hasAudio: boolean): string {
  const pollBlock =
    status === "pending" || status === "processing"
      ? `setInterval(async () => {
    try {
      const r = await fetch('/v1/transcription/${transcriptionId}/');
      const j = await r.json();
      if (j.data.status === 'completed' || j.data.status === 'failed') window.location.reload();
    } catch(_) {}
  }, 3000);`
      : "";

  const audioBlock = hasAudio
    ? `
  const audio = document.getElementById('audio-el');
  const playIcon = document.getElementById('play-icon');
  const bar = document.getElementById('progress-bar');
  const PLAY  = '<polygon points="5 3 19 12 5 21 5 3"/>';
  const PAUSE = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

  function fmt(s) { return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'); }

  audio.addEventListener('loadedmetadata', () => {
    bar.max = audio.duration;
    const d = fmt(audio.duration);
    document.getElementById('tot-time').textContent = d;
    document.getElementById('p-tot').textContent = d;
  });

  audio.addEventListener('timeupdate', () => {
    const c = fmt(audio.currentTime);
    document.getElementById('cur-time').textContent = c;
    document.getElementById('p-cur').textContent = c;
    bar.value = audio.currentTime;
    document.querySelectorAll('.turn-item').forEach(el => {
      el.classList.toggle('turn-active', audio.currentTime >= parseFloat(el.dataset.start) && audio.currentTime <= parseFloat(el.dataset.end));
    });
  });

  audio.addEventListener('ended', () => { playIcon.innerHTML = PLAY; });

  function onSeek(el) { audio.currentTime = parseFloat(el.value); }
  function togglePlay() {
    if (audio.paused) { audio.play(); playIcon.innerHTML = PAUSE; }
    else { audio.pause(); playIcon.innerHTML = PLAY; }
  }
  function seekTo(el) {
    audio.currentTime = parseFloat(el.dataset.start);
    audio.play();
    playIcon.innerHTML = PAUSE;
  }`
    : `function seekTo(){}; function togglePlay(){}; function onSeek(){}`;

  return `(function(){
  ${pollBlock}
  ${audioBlock}

  // ── Chat ──────────────────────────────────
  let open = false, loaded = false;

  function toggleChat() {
    open = !open;
    const panel  = document.getElementById('chat-panel');
    const layout = document.getElementById('detail-layout');
    const btn    = document.getElementById('chat-toggle-btn');
    if (open) {
      panel.classList.remove('hidden'); panel.classList.add('flex');
      layout.style.gridTemplateColumns = '1fr 400px';
      if (btn) btn.style.transform = 'scaleX(-1)';
      if (!loaded) { loadMessages(); loaded = true; }
      document.getElementById('chat-input').focus();
    } else {
      panel.classList.add('hidden'); panel.classList.remove('flex');
      layout.style.gridTemplateColumns = '';
      if (btn) btn.style.transform = '';
    }
  }

  async function loadMessages() {
    try {
      const r = await fetch('/v1/conversation-message?transcriptionId=${transcriptionId}&limit=50&direction=before');
      const j = await r.json();
      const msgs = (j.data && j.data.results) || [];
      if (msgs.length) {
        const empty = document.getElementById('chat-empty');
        if (empty) empty.remove();
        msgs.forEach(m => appendMsg(m.role, m.message, false));
        const c = document.getElementById('chat-messages');
        c.scrollTop = c.scrollHeight;
      }
    } catch(_) {}
  }

  function appendMsg(role, text, scroll = true) {
    const empty = document.getElementById('chat-empty');
    if (empty) empty.remove();
    const c = document.getElementById('chat-messages');
    const isUser = role === 'human';
    const wrap = document.createElement('div');
    wrap.className = 'flex ' + (isUser ? 'justify-end' : 'justify-start');
    const bubble = document.createElement('div');
    bubble.className = 'max-w-[85%] px-3.5 py-2 rounded-xl text-sm leading-relaxed break-words ' +
      (isUser ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm');
    bubble.textContent = text;
    wrap.appendChild(bubble);
    c.appendChild(wrap);
    if (scroll) c.scrollTop = c.scrollHeight;
  }

  function showTyping() {
    const c = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.id = 'chat-typing'; el.className = 'flex justify-start';
    el.innerHTML = '<div class="px-3.5 py-2 rounded-xl rounded-bl-sm text-sm bg-gray-100 text-gray-400">Analysing...</div>';
    c.appendChild(el); c.scrollTop = c.scrollHeight;
  }
  function hideTyping() { const el = document.getElementById('chat-typing'); if (el) el.remove(); }

  function onChatInput(el) {
    document.getElementById('chat-send-btn').disabled = !el.value.trim();
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }
  function handleChatKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  async function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    document.getElementById('chat-send-btn').disabled = true;
    input.value = ''; input.style.height = 'auto';
    appendMsg('human', text);
    showTyping();
    try {
      const r = await fetch('/v1/conversation-message', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message: text, role: 'human', transcriptionId: '${transcriptionId}' }),
      });
      const j = await r.json();
      hideTyping();
      if (!r.ok) throw new Error(j.message || 'Failed');
      appendMsg('assistant', j.data.message);
    } catch(ex) { hideTyping(); appendMsg('assistant', 'Sorry, something went wrong. Please try again.'); }
  }

  function deletePage() {
    openDeleteModal(async () => {
      const r = await fetch('/v1/transcription/${transcriptionId}/', { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed');
      window.location.href = '/';
    });
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('opacity-0'); t.classList.add('opacity-100');
    setTimeout(() => { t.classList.remove('opacity-100'); t.classList.add('opacity-0'); }, 3000);
  }

  window.toggleChat = toggleChat; window.seekTo = seekTo; window.togglePlay = togglePlay;
  window.onSeek = onSeek; window.onChatInput = onChatInput; window.handleChatKey = handleChatKey;
  window.sendMessage = sendMessage; window.deletePage = deletePage; window.showToast = showToast;
})();`;
}
