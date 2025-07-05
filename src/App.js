
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [words, setWords] = useState([]);
  const [group, setGroup] = useState(1);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/vocab-data.json')
      .then(res => res.json())
      .then(data => {
        const groupWords = data.filter(w => w.group === group);
        setWords(groupWords);
        setIndex(0);
      });
  }, [group]);

  const handleNext = () => {
    setFlipped(false);
    setIndex((index + 1) % words.length);
  };

  const handlePrev = () => {
    setFlipped(false);
    setIndex((index - 1 + words.length) % words.length);
  };

  const handleFlip = () => setFlipped(!flipped);

  if (!words.length) return <p className="p-4">Loading...</p>;

  const word = words[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-200 to-indigo-300 p-4">
      <h1 className="text-3xl font-bold mb-4">Vocab Flashcards</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {[1, 2, 3, 4, 5].map(g => (
          <button
            key={g}
            className={`px-3 py-1 rounded ${group === g ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setGroup(g)}
          >
            Group {g}
          </button>
        ))}
      </div>

      <motion.div
        className="w-80 h-60 bg-white rounded-xl shadow-xl flex items-center justify-center text-center cursor-pointer relative overflow-hidden"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onClick={handleFlip}
        style={{ perspective: 1000 }}
      >
        <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-4">
          <h2 className="text-xl font-bold">{word.word}</h2>
        </div>
        <div
          className="absolute w-full h-full backface-hidden flex flex-col justify-center p-4 bg-white transform rotate-y-180"
          dangerouslySetInnerHTML={{
            __html: `
              <p><strong>Definition:</strong> ${word.definitions[0].definition}</p>
              <p><strong>Sentence:</strong> ${word.definitions[0].sentence}</p>
              <p><strong>Synonyms:</strong> ${word.definitions[0].synonyms.join(", ")}</p>
            `,
          }}
        ></div>
      </motion.div>

      <div className="flex gap-4 mt-4">
        <button className="px-4 py-2 bg-gray-300 rounded" onClick={handlePrev}>Previous</button>
        <button className="px-4 py-2 bg-indigo-500 text-white rounded" onClick={handleNext}>Next</button>
      </div>

      <p className="mt-2 text-sm text-gray-700">Card {index + 1} of {words.length}</p>
    </div>
  );
}

export default App;
