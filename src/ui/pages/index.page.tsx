import type { FC } from "hono/jsx";
import type { Transcription } from "../../database/schema";
import type { PaginatorMeta } from "../../common/pagination";
import { Layout } from "../layout";

type Props = {
  transcriptions: Transcription[];
  meta: PaginatorMeta;
};

function fmtDate(d: Date | number): string {
  const date = d instanceof Date ? d : new Date(Number(d) * 1000);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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

export const IndexPage: FC<Props> = ({ transcriptions, meta }) => (
  <Layout title="Transcriptions">
    {/* Page header */}
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Transcriptions</h1>
      <button class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer border-0" onclick="openUploadModal()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Transcription
      </button>
    </div>

    {/* List / empty state */}
    {transcriptions.length === 0 ? (
      <div class="text-center py-20 text-gray-500">
        <div class="text-5xl mb-4">🎙</div>
        <p class="text-lg font-semibold text-gray-900 mb-2">No transcriptions yet</p>
        <p class="text-sm mb-6">Upload an audio file to get started</p>
        <button class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer border-0" onclick="openUploadModal()">
          Upload Audio
        </button>
      </div>
    ) : (
      <div class="flex flex-col gap-3">
        {transcriptions.map((t) => (
          <div class="bg-white border border-gray-200 rounded-xl px-6 py-4 flex items-center justify-between gap-4 cursor-pointer shadow-sm hover:border-emerald-400 hover:shadow-md transition-all" onclick={`window.location.href='/transcriptions/${t.id}'`} key={t.id}>
            <div class="flex items-center gap-4 flex-1 min-w-0">
              <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V21H8v2h8v-2h-3v-2.06A9 9 0 0 0 21 10h-2z" />
                </svg>
              </div>
              <div class="min-w-0">
                <p class="text-[15px] font-semibold truncate">{t.name}</p>
                <p class="text-sm text-gray-500 mt-0.5 flex gap-1.5 flex-wrap">
                  {t.detectedLanguage && <span>{t.detectedLanguage}</span>}
                  {t.processingDurationInSeconds != null && <span>· {fmtDuration(t.processingDurationInSeconds)}</span>}
                  <span>· {fmtDate(t.createdAt)}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2.5 shrink-0">
              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass[t.status]}`}>{statusLabel[t.status]}</span>
              <button class="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-0 bg-transparent" onclick={`event.stopPropagation(); deleteTranscription('${t.id}')`} title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Upload modal */}
    <div id="upload-modal" class="hidden fixed inset-0 bg-black/50 z-50 items-center justify-center">
      <div class="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl" onclick="event.stopPropagation()">
        <h2 class="text-xl font-bold mb-6">New Transcription</h2>
        <form id="upload-form">
          <div class="mb-5">
            <label class="block text-sm font-medium mb-1.5" for="t-name">
              Name
            </label>
            <input
              class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              type="text"
              id="t-name"
              name="name"
              placeholder="e.g. Team Meeting - Jan 2025"
              required
              minlength={3}
              maxlength={256}
              autocomplete="off"
            />
          </div>
          <div class="mb-5">
            <label class="block text-sm font-medium mb-1.5" for="t-file">
              Audio File
            </label>
            <input
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500 transition-all file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              type="file"
              id="t-file"
              name="file"
              accept="audio/*"
              required
            />
          </div>
          <p id="upload-error" class="hidden text-red-500 text-sm mb-3"></p>
          <div class="flex gap-3 justify-end mt-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-500 bg-transparent hover:bg-gray-50 cursor-pointer transition-colors" onclick="closeUploadModal()">
              Cancel
            </button>
            <button type="submit" id="upload-submit" class="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer border-0 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              Upload & Transcribe
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Toast */}
    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300 whitespace-nowrap" />

    <script dangerouslySetInnerHTML={{ __html: script }} />
  </Layout>
);

const script = `
function openUploadModal() {
  const m = document.getElementById('upload-modal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  setTimeout(() => document.getElementById('t-name').focus(), 50);
}

function closeUploadModal() {
  const m = document.getElementById('upload-modal');
  m.classList.add('hidden');
  m.classList.remove('flex');
  document.getElementById('upload-form').reset();
  const err = document.getElementById('upload-error');
  err.classList.add('hidden');
  err.textContent = '';
}

document.getElementById('upload-modal').addEventListener('click', closeUploadModal);

document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('upload-submit');
  const err = document.getElementById('upload-error');
  err.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const fd = new FormData();
  fd.append('name', e.target.name.value);
  fd.append('file', e.target.file.files[0]);

  try {
    const res  = await fetch('/v1/transcription', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    window.location.href = '/transcriptions/' + json.data.id;
  } catch (ex) {
    err.textContent = ex.message || 'Upload failed. Please try again.';
    err.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Upload & Transcribe';
  }
});

function deleteTranscription(id) {
  openDeleteModal(async () => {
    const res = await fetch('/v1/transcription/' + id + '/', { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    window.location.reload();
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('opacity-0');
  t.classList.add('opacity-100');
  setTimeout(() => { t.classList.remove('opacity-100'); t.classList.add('opacity-0'); }, 3000);
}
`;
