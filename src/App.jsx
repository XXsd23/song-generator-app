import { useMemo, useState } from 'react';

const GENRES = {
  Pop: { bpm: 104, key: 'C', mood: 'bright', palette: ['#7c9dff', '#ff7bd5', '#ffd76c'] },
  Rock: { bpm: 118, key: 'D', mood: 'bold', palette: ['#ff6b6b', '#ffd93d', '#6c5ce7'] },
  RnB: { bpm: 96, key: 'A', mood: 'smooth', palette: ['#9b72ff', '#f968cb', '#63d2ff'] },
  Electronic: { bpm: 128, key: 'E', mood: 'electric', palette: ['#4ecdc4', '#5f6cff', '#ff8d6d'] },
  Country: { bpm: 92, key: 'G', mood: 'warm', palette: ['#f7b267', '#f4845f', '#7bc8a4'] },
  HipHop: { bpm: 110, key: 'F', mood: 'confident', palette: ['#4b7bec', '#fa7d62', '#f9d423'] },
};

const VOICES = [
  'Warm & intimate',
  'Crisp & polished',
  'Deep & cinematic',
  'Smooth & soulful',
  'Energetic & youthful',
  'Moody & dramatic',
];

const NOTE_MAP = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
};

const CHORD_PROGRESSION = {
  Pop: [0, 5, 6, 5],
  Rock: [0, 4, 5, 4],
  RnB: [0, 3, 5, 6],
  Electronic: [0, 2, 5, 7],
  Country: [0, 5, 3, 4],
  HipHop: [0, 6, 4, 5],
};

function splitLyrics(rawLyrics) {
  const lines = rawLyrics
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [
      'We make the night glow',
      'With every promise we keep',
      'Turning the ordinary into a memory',
      'You and I, we rise above the noise',
      'We make the night glow',
      'With every promise we keep',
      'Turning the ordinary into a memory',
      'You and I, we rise above the noise',
    ];
  }

  return lines.slice(0, 16);
}

function buildSongPlan({ lyrics, genre, voice }) {
  const lines = splitLyrics(lyrics);
  const sections = [
    { title: 'Verse 1', lines: lines.slice(0, 4) },
    { title: 'Pre-Chorus', lines: lines.slice(4, 6) },
    { title: 'Chorus', lines: lines.slice(6, 9) },
    { title: 'Verse 2', lines: lines.slice(9, 12) },
    { title: 'Bridge', lines: lines.slice(12, 14) },
    { title: 'Outro', lines: lines.slice(14, 16) },
  ].filter((section) => section.lines.length > 0);

  const baseTitle = lines[0]?.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Midnight Echo';
  const title = baseTitle.split(' ').slice(0, 3).join(' ') || 'Midnight Echo';

  return {
    title,
    genre,
    voice,
    bpm: GENRES[genre].bpm,
    key: GENRES[genre].key,
    mood: GENRES[genre].mood,
    sections,
    voiceoverPrompt: `A ${genre.toLowerCase()} song with a ${voice.toLowerCase()} vocal delivery, a ${GENRES[genre].mood} feeling, and these emotional phrases: ${lines.slice(0, 4).join(', ')}.`,
  };
}

function App() {
  const [lyrics, setLyrics] = useState(
    `We were chasing fire through midnight streets
The city hums beneath our feet
Every heartbeat says don't let this fade
We turn the pain into our light\n\nWe keep the song alive in every room
With every dream we carry through the gloom
The world can fall apart and still we rise\nWe write our own future in the sky`
  );
  const [genre, setGenre] = useState('Pop');
  const [voice, setVoice] = useState('Warm & intimate');
  const [generatedSong, setGeneratedSong] = useState(null);

  const genreMeta = useMemo(() => GENRES[genre], [genre]);

  const handleGenerate = () => {
    const song = buildSongPlan({ lyrics, genre, voice });
    setGeneratedSong(song);
  };

  const handleVoiceover = () => {
    if (!generatedSong && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('Your song is ready. Let the melody carry the story.');
      msg.rate = 1.1;
      msg.pitch = 1.2;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(generatedSong.voiceoverPrompt);
      msg.rate = 1;
      msg.pitch = 1.15;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    }
  };

  const handlePreviewMelody = () => {
    if (typeof window === 'undefined') return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioContext = new AudioCtx();
    const progression = CHORD_PROGRESSION[genre] || CHORD_PROGRESSION.Pop;
    const baseFrequency = NOTE_MAP[GENRES[genre].key] || NOTE_MAP.C;

    progression.forEach((interval, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const frequency = baseFrequency * (2 ** (interval / 12));

      oscillator.type = index % 2 === 0 ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + index * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + index * 0.35 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + index * 0.35 + 0.28);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + index * 0.35);
      oscillator.stop(audioContext.currentTime + index * 0.35 + 0.3);
    });
  };

  return (
    <div className="app-shell">
      <aside className="panel controls-panel">
        <div className="brand-block">
          <span className="eyebrow">AI music studio</span>
          <h1>SongForge</h1>
        </div>

        <label className="field-label">
          Lyrics
          <textarea
            value={lyrics}
            onChange={(event) => setLyrics(event.target.value)}
            rows={12}
            placeholder="Paste your lyrics here..."
          />
        </label>

        <div className="field-block">
          <span className="field-label">Genre</span>
          <div className="chip-grid">
            {Object.keys(GENRES).map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${genre === option ? 'selected' : ''}`}
                onClick={() => setGenre(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="field-block">
          <span className="field-label">Voiceover</span>
          <select value={voice} onChange={(event) => setVoice(event.target.value)}>
            {VOICES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="stats-mini">
          <div>
            <span>BPM</span>
            <strong>{genreMeta.bpm}</strong>
          </div>
          <div>
            <span>Key</span>
            <strong>{genreMeta.key}</strong>
          </div>
          <div>
            <span>Mood</span>
            <strong>{genreMeta.mood}</strong>
          </div>
        </div>

        <div className="actions-row">
          <button className="primary" type="button" onClick={handleGenerate}>
            Generate Song
          </button>
          <button type="button" onClick={handlePreviewMelody} className="secondary">
            Preview
          </button>
        </div>
      </aside>

      <main className="panel output-panel">
        {!generatedSong ? (
          <div className="empty-state">
            <div className="orb" />
            <h2>Create your next song</h2>
            <p>
              Add lyrics, select a genre, and pick a voice style to build an arrangement with a
              cinematic vocal direction.
            </p>
          </div>
        ) : (
          <>
            <div className="song-header" style={{ background: `linear-gradient(135deg, ${genreMeta.palette[0]}, ${genreMeta.palette[1]})` }}>
              <div>
                <span className="eyebrow">{generatedSong.genre}</span>
                <h2>{generatedSong.title}</h2>
              </div>
              <button type="button" className="voice-btn" onClick={handleVoiceover}>
                Play voiceover
              </button>
            </div>

            <div className="meta-grid">
              <div>
                <span>Voice</span>
                <strong>{generatedSong.voice}</strong>
              </div>
              <div>
                <span>Tempo</span>
                <strong>{generatedSong.bpm} BPM</strong>
              </div>
              <div>
                <span>Key</span>
                <strong>{generatedSong.key}</strong>
              </div>
              <div>
                <span>Mood</span>
                <strong>{generatedSong.mood}</strong>
              </div>
            </div>

            <div className="song-structure">
              {generatedSong.sections.map((section) => (
                <article key={section.title} className="section-card">
                  <h3>{section.title}</h3>
                  <ul>
                    {section.lines.map((line, index) => (
                      <li key={`${section.title}-${index}`}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="voiceover-box">
              <h3>Voiceover prompt</h3>
              <p>{generatedSong.voiceoverPrompt}</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
