import React, { useEffect, useMemo, useState } from "react";

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

function useVocabData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
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
        if (!cancelled) setError("Could not load vocab-data.json");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, loading };
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const { data, error, loading } = useVocabData();
  const [currentGroup, setCurrentGroup] = useState(null);
  const [idx, setIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [shuffledItems, setShuffledItems] = useState([]);

  const { groupsMap, groupNumbers } = useMemo(() => {
    if (!data) return { groupsMap: {}, groupNumbers: [] };
    const sorted = [...data].sort((a, b) => a.key - b.key);
    const gmap = groupBy(sorted, "group");
    const gnums = Object.keys(gmap).map(Number).sort((a, b) => a - b);
    return { groupsMap: gmap, groupNumbers: gnums };
  }, [data]);

  const groupItems = useMemo(() => {
    if (currentGroup == null || !groupsMap[currentGroup]) return [];
    return shuffledItems.length > 0
      ? shuffledItems
      : [...groupsMap[currentGroup]].sort((a, b) => a.key - b.key);
  }, [currentGroup, groupsMap, shuffledItems]);

  const total = groupItems.length;
  const current = total > 0 ? groupItems[idx] : null;

  function resetToGroups() {
    setCurrentGroup(null);
    setIdx(0);
    setShowMeaning(false);
    setShuffledItems([]);
  }

  function goPrev() {
    setIdx((i) => Math.max(0, i - 1));
    setShowMeaning(false);
  }

  function goNext() {
    setIdx((i) => Math.min(total - 1, i + 1));
    setShowMeaning(false);
  }

  function shuffleGroup() {
    if (groupsMap[currentGroup]) {
      setShuffledItems(shuffleArray(groupsMap[currentGroup]));
      setIdx(0);
      setShowMeaning(false);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (currentGroup == null) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setShowMeaning((m) => !m);
      }
      if (e.key === "Escape") resetToGroups();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentGroup, total]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <div className="text-xl font-bold tracking-tight text-indigo-700">
            Vocab Flashcards
          </div>
          {data && (
            <span className="ml-auto text-xs text-gray-500">
              {data.length.toLocaleString()} words • {groupNumbers.length} groups
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading && <div className="text-gray-600">Loading…</div>}
        {!loading && !data && <div className="text-red-600">{error || "No data loaded."}</div>}

        {/* Group Selection */}
        {!loading && data && currentGroup == null && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select a Group</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {groupNumbers.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setCurrentGroup(g);
                    setIdx(0);
                    setShowMeaning(false);
                    setShuffledItems([]);
                  }}
                  className="h-32 w-full rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-400
                             text-white shadow-md hover:shadow-xl transition-transform hover:scale-105
                             flex flex-col items-center justify-center font-semibold"
                >
                  <div className="text-sm opacity-80">Group</div>
                  <div className="text-3xl">{g}</div>
                  <div className="mt-1 text-xs opacity-70">
                    {groupsMap[g]?.length || 0} words
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Flashcard View */}
        {data && currentGroup != null && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={resetToGroups}
                className="text-sm px-3 py-1.5 border rounded-xl bg-white hover:bg-gray-50"
              >
                ← All Groups
              </button>
              <button
                onClick={shuffleGroup}
                className="text-sm px-3 py-1.5 border rounded-xl bg-white hover:bg-gray-50"
              >
                🔀 Shuffle Group
              </button>
              <div className="text-sm text-gray-600">
                Group {currentGroup} • {idx + 1} / {total}
              </div>
            </div>

            {/* Word Display */}
            <div className="text-center text-5xl font-bold mb-4 text-indigo-800">
              {current?.word}
            </div>

            {/* Flashcard for Meaning */}
            <div
              onClick={() => setShowMeaning((m) => !m)}
              className="cursor-pointer select-none mx-auto flex items-center justify-center
                         w-80 h-80 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem]
                         rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-400
                         text-white shadow-xl hover:shadow-2xl transition-transform duration-200 hover:scale-105 p-6"
            >
              {showMeaning && current && (
                <div className="w-full h-full overflow-y-auto text-left text-lg bg-white/90 text-gray-900 rounded-xl p-4 shadow-inner">
                  {current.definitions?.map((d, i) => (
                    <div key={i} className="mb-4">
                      <div className="text-xs uppercase text-indigo-600 font-semibold">{d.part_of_speech}</div>
                      <div className="mt-1">{d.definition}</div>
                      {d.sentence && (
                        <div
                          className="mt-1 text-gray-700 italic"
                          dangerouslySetInnerHTML={{ __html: d.sentence }}
                        />
                      )}
                      {!!d.synonyms?.length && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span className="font-semibold">Synonyms:</span> {d.synonyms.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {!showMeaning && <div className="text-white/50 text-xl">Click to view meaning</div>}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={idx === 0}
                className={`px-4 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 ${
                  idx === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                ← Previous
              </button>
              <button
                onClick={() => setShowMeaning((m) => !m)}
                className="px-4 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50"
              >
                {showMeaning ? "Hide Meaning" : "Show Meaning"}
              </button>
              <button
                onClick={goNext}
                disabled={idx >= total -
