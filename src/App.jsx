import React, { useEffect, useMemo, useState } from "react";

// ---- Types ----
/** @typedef {{ part_of_speech: string, definition: string, sentence?: string, synonyms?: string[] }} Definition */
/** @typedef {{ key: number, group: number, word: string, definitions: Definition[] }} VocabItem */

// ---- Helpers ----
function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, /** @type {Record<string, VocabItem[]>} */ ({}));
}

function useVocabData() {
  const [data, setData] = useState(/** @type {VocabItem[] | null} */(null));
  const [error, setError] = useState(/** @type {string | null} */(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("vocab-data.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Fetch failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError("Could not auto-load vocab-data.json. Use the Upload button below.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, setData, error, loading };
}

function HtmlSentence({ html }) {
  return (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default function App() {
  const { data, setData, error, loading } = useVocabData();
  const [currentGroup, setCurrentGroup] = useState(/** @type {number | null} */(null));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const { groupsMap, groupNumbers } = useMemo(() => {
    if (!data) return { groupsMap: {}, groupNumbers: [] };
    const sorted = [...data].sort((a,b) => a.key - b.key);
    const gmap = groupBy(sorted, "group");
    const gnums = Object.keys(gmap).map(Number).sort((a,b) => a-b);
    return { groupsMap: gmap, groupNumbers: gnums };
  }, [data]);

  const groupItems = useMemo(() => {
    if (currentGroup == null || !groupsMap[currentGroup]) return [];
    return [...groupsMap[currentGroup]].sort((a,b) => a.key - b.key);
  }, [currentGroup, groupsMap]);

  const total = groupItems.length;
  const current = total > 0 ? groupItems[idx] : null;

  function handleUploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        if (Array.isArray(json)) {
          setData(json);
          setCurrentGroup(null);
          setIdx(0);
          setRevealed(false);
        } else {
          alert("JSON should be an array of vocab items.");
        }
      } catch (err) {
        alert("Failed to parse JSON: " + err);
      }
    };
    reader.readAsText(file);
  }

  function resetToGroups() {
    setCurrentGroup(null);
    setIdx(0);
    setRevealed(false);
  }

  function goPrev() {
    setIdx((i) => Math.max(0, i - 1));
    setRevealed(false);
  }
  function goNext() {
    setIdx((i) => Math.min(total - 1, i + 1));
    setRevealed(false);
  }

  useEffect(() => {
    function onKey(e) {
      if (currentGroup == null) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") { e.preventDefault(); setRevealed((r) => !r); }
      if (e.key === "Escape") resetToGroups();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentGroup, total]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-xl font-bold tracking-tight">Vocab Flashcards</div>
          <div className="ml-auto flex items-center gap-3">
            <label className="inline-flex items-center px-3 py-1.5 rounded-xl border bg-gray-50 hover:bg-gray-100 cursor-pointer text-sm">
              <input type="file" accept="application/json,.json" onChange={handleUploadFile} className="hidden" />
              Upload JSON
            </label>
            {data && (
              <span className="text-xs text-gray-500">{data.length.toLocaleString()} words • {groupNumbers.length} groups</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-gray-600">Loading… (If this hangs, click “Upload JSON” and select your vocab-data.json)</div>
        )}
        {!loading && !data && (
          <div className="text-red-600">{error || "No data loaded."}</div>
        )}

        {!loading && data && currentGroup == null && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select a Group</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {groupNumbers.map((g) => (
                <button
                  key={g}
                  onClick={() => { setCurrentGroup(g); setIdx(0); setRevealed(false); }}
                  className="group rounded-2xl border bg-white p-4 text-left shadow-sm hover:shadow transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="text-sm text-gray-500">Group</div>
                  <div className="text-2xl font-semibold">{g}</div>
                  <div className="mt-2 text-xs text-gray-500">{groupsMap[g]?.length || 0} words</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {data && currentGroup != null && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={resetToGroups} className="text-sm px-3 py-1.5 border rounded-xl bg-white hover:bg-gray-50">← All Groups</button>
              <div className="text-sm text-gray-600">Group {currentGroup} • {idx + 1} / {total}</div>
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-indigo-500" style={{ width: `${total ? ((idx + 1) / total) * 100 : 0}%` }} />
            </div>

            <div
              onClick={() => setRevealed(r => !r)}
              className="cursor-pointer select-none rounded-3xl bg-white border shadow-sm p-6 md:p-10"
            >
              {!current ? (
                <div className="text-gray-500">No items in this group.</div>
              ) : (
                <div>
                  <div className="text-center">
                    <div className="text-3xl md:text-5xl font-bold tracking-tight">{current.word}</div>
                    <div className="mt-2 text-sm text-gray-500">Click card (or press space) to {revealed ? "hide" : "reveal"}</div>
                  </div>

                  {revealed && (
                    <div className="mt-6 grid gap-4">
                      {current.definitions?.map((d, i) => (
                        <div key={i} className="rounded-2xl border bg-gray-50 p-4">
                          <div className="text-xs uppercase tracking-wider text-gray-500">{d.part_of_speech}</div>
                          <div className="mt-1 text-lg font-medium">{d.definition}</div>
                          {d.sentence && (
                            <div className="mt-2 text-gray-700"><HtmlSentence html={d.sentence} /></div>
                          )}
                          {!!d.synonyms?.length && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-semibold">Synonyms:</span> {d.synonyms.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={idx === 0}
                className={classNames("px-4 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50", idx === 0 && "opacity-50 cursor-not-allowed")}
              >
                ← Previous
              </button>
              <button
                onClick={() => setRevealed(r => !r)}
                className="px-4 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50"
              >
                {revealed ? "Hide" : "Reveal"}
              </button>
              <button
                onClick={goNext}
                disabled={idx >= total - 1}
                className={classNames("px-4 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50", idx >= total - 1 && "opacity-50 cursor-not-allowed")}
              >
                Next →
              </button>
            </div>

            <div className="mt-8">
              <div className="text-sm text-gray-600 mb-2">Jump to word</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
                {groupItems.map((item, i) => (
                  <button
                    key={item.key}
                    onClick={() => { setIdx(i); setRevealed(false); }}
                    className={classNames(
                      "truncate px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm text-left",
                      i === idx && "ring-2 ring-indigo-500"
                    )}
                    title={item.word}
                  >
                    {i + 1}. {item.word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-gray-500">
        Tip: Place <code>vocab-data.json</code> in your app's <code>public/</code> folder or click <strong>Upload JSON</strong> above.
        Use ←/→ to navigate, Space to reveal, and Esc to go back to groups.
      </footer>
    </div>
  );
}
