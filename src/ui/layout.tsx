import type { Child, FC } from "hono/jsx";

type LayoutProps = {
  title?: string;
  children: Child;
};

export const Layout: FC<LayoutProps> = ({ title = "Speakscribe", children }) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title} — Speakscribe</title>
      <script src="https://cdn.tailwindcss.com" />
      <style dangerouslySetInnerHTML={{ __html: minimalCss }} />
    </head>
    <body class="bg-gray-50 text-gray-900 min-h-screen font-sans antialiased">
      <header class="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2 font-bold text-lg text-emerald-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10a7 7 0 0 1-14 0H3a9 9 0 0 0 8 8.94V21H8v2h8v-2h-3v-2.06A9 9 0 0 0 21 10h-2z" />
            </svg>
            Speakscribe
          </a>
          <nav class="flex gap-6">
            <a href="/" class="text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors">
              Transcriptions
            </a>
          </nav>
        </div>
      </header>
      <div class="max-w-6xl mx-auto px-6 py-8">{children}</div>

      {/* ── Global Delete Confirmation Modal ── */}
      <div id="delete-modal" class="hidden fixed inset-0 bg-black/50 z-[200] items-center justify-center p-4" onclick="closeDeleteModal()">
        <div class="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onclick="event.stopPropagation()" style="animation: modalIn 0.2s ease-out;">
          {/* Red top bar */}
          <div class="h-1.5 bg-red-500 w-full" />
          <div class="p-6">
            {/* Icon */}
            <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            {/* Text */}
            <h3 class="text-[17px] font-bold text-center text-gray-900 mb-1.5">Delete Transcription</h3>
            <p class="text-sm text-gray-500 text-center leading-relaxed mb-6">
              This will permanently delete the transcription, all speaker turns, embeddings, and conversation history.
              <strong class="block mt-1 text-gray-700">This action cannot be undone.</strong>
            </p>
            {/* Buttons */}
            <div class="flex gap-3">
              <button id="delete-modal-cancel" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 cursor-pointer transition-colors" onclick="closeDeleteModal()">
                Cancel
              </button>
              <button id="delete-modal-confirm" class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 cursor-pointer border-0 transition-colors flex items-center justify-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: deleteModalScript }} />
    </body>
  </html>
);

const deleteModalScript = `
(function() {
  let _onConfirm = null;

  window.openDeleteModal = function(onConfirm) {
    _onConfirm = onConfirm;
    const m = document.getElementById('delete-modal');
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.getElementById('delete-modal-confirm').focus();
  };

  window.closeDeleteModal = function() {
    const m = document.getElementById('delete-modal');
    m.classList.add('hidden');
    m.classList.remove('flex');
    _onConfirm = null;
  };

  document.getElementById('delete-modal-confirm').addEventListener('click', async () => {
    const btn = document.getElementById('delete-modal-confirm');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    try {
      if (_onConfirm) await _onConfirm();
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete';
      closeDeleteModal();
    }
  });
})();
`;

// Only what Tailwind can't do: range input thumb + turn active + toast animation
const minimalCss = `
  input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 9999px; background: #e5e7eb; cursor: pointer; outline: none; width: 100%; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #10b981; cursor: pointer; }
  .turn-active { background-color: #f0fdf4 !important; border-left: 3px solid #10b981; padding-left: calc(1.5rem - 3px) !important; }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
`;
