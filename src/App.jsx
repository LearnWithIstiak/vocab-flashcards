// Remove Upload JSON UI from header
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

// Flashcard view
<div
  onClick={() => setRevealed(r => !r)}
  className="cursor-pointer select-none mx-auto flex items-center justify-center
             w-80 h-80 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-teal-400
             text-white shadow-xl hover:shadow-2xl transition-transform duration-200 hover:scale-105"
>
  {!current ? (
    <div className="text-gray-200">No items in this group.</div>
  ) : (
    <div className="text-center px-4">
      <div className="text-3xl md:text-4xl font-bold">{current.word}</div>
      <div className="mt-2 text-sm opacity-80">
        {revealed ? "Click to hide" : "Click to reveal"}
      </div>

      {revealed && (
        <div className="mt-4 bg-white/90 text-gray-900 rounded-xl p-4 shadow-inner">
          {current.definitions?.map((d, i) => (
            <div key={i} className="mb-3">
              <div className="text-xs uppercase text-indigo-600">{d.part_of_speech}</div>
              <div className="mt-1 font-medium">{d.definition}</div>
              {d.sentence && (
                <div className="mt-1 text-sm text-gray-700">
                  <span dangerouslySetInnerHTML={{ __html: d.sentence }} />
                </div>
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
    </div>
  )}
</div>
