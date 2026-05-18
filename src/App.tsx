import {useState, useEffect, useMemo} from 'react';
import {ENTRADAS} from './data';
import { Share2, X, Dices } from 'lucide-react';

interface Entrada {
  v: string;
  def: string;
  ej?: string;
}

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const aboutText = `La Fundación Córdoba Ciudad Cultural ha elaborado este modesto diccionario a partir de las palabras y sus definiciones propuestas por los internautas en las redes sociales de Córdoba 2016 a lo largo del año 2010, tanto en Facebook como en Twitter y Tuenti.
Este documento no tiene ninguna intención académica, ni sigue ningún criterio lingüístico. Por el contrario, trata de reflejar y dejar constancia de la idiosincrasia de los cordobeses a través de su habla coloquial, con el simple objetivo del entretenimiento y el reforzamiento del orgullo de pertenencia, algo que la candidatura de Córdoba a Capital Europea de la Cultura ha conseguido con creces. 
No obstante, el lector observará que muchos de los vocablos incluidos son comunes a otras zonas de Andalucía, lo que no les quita valor como términos propios del habla cordobesa. Igualmente, se han incluido palabras que, a pesar de aparecer en el diccionario de la Real Academia de la Lengua, tienen en Córdoba un uso más extendido que en otros lugares de la geografía española o tienen acepciones diferentes a las comúnmente empleadas.
Es importante remarcar, así mismo, que se ha tenido en cuenta la fonética y pronunciación de las palabras a la hora de representarlas gráficamente. 
Nuestro agradecimiento a todas las personas que han participado en la elaboración de este diccionario, a través de miles de palabras y ejemplos de uso.`;

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Solo mostrar si no está ya instalada (standalone)
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBtn(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Diccionario Cordobés',
      text: '¡Mira este diccionario del habla cordobesa!',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir:', err);
    }
  };

  const letraDeEntrada = (e: Entrada) => {
    const firstChar = e.v.trim().toUpperCase()[0];
    if (firstChar === 'Ñ') return 'Ñ';
    return firstChar.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const getWordOfTheDay = () => {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % ENTRADAS.length;
    return ENTRADAS[index];
  };

  const [wordOfTheDay, setWordOfTheDay] = useState<Entrada>(getWordOfTheDay());

  const handleRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * ENTRADAS.length);
    setWordOfTheDay(ENTRADAS[randomIndex]);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          const lastShown = localStorage.getItem('lastNotificationDate');
          const todayStr = new Date().toDateString();
          
          if (lastShown !== todayStr) {
            new Notification('Palabra del Día Cordobesa', {
              body: `¿Sabes qué significa "${wordOfTheDay.v}"? ${wordOfTheDay.def}`,
              icon: '/favicon.ico'
            });
            localStorage.setItem('lastNotificationDate', todayStr);
          }
        }
      });
    }
  }, [wordOfTheDay]);

  const filteredEntries = useMemo(() => {
    let result = ENTRADAS;

    if (activeLetter) {
      result = result.filter(e => letraDeEntrada(e) === activeLetter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.v.toLowerCase().startsWith(q)
      );
    }

    return result;
  }, [search, activeLetter]);

  const groupedEntries = useMemo(() => {
    const groups: {[key: string]: Entrada[]} = {};
    filteredEntries.forEach(e => {
      const l = letraDeEntrada(e);
      if (!groups[l]) groups[l] = [];
      groups[l].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'es'));
  }, [filteredEntries]);

  const letrasConEntradas = useMemo(() => {
    return new Set(ENTRADAS.map(letraDeEntrada));
  }, []);

  const abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark key={i} className="bg-oro-claro text-tinta px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!showApp) {
    return (
      <div
        className="portada min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-tinta cursor-pointer"
        onClick={() => setShowApp(true)}
      >
        <div className="portada-pattern"></div>
        <div className="portada-content relative z-10 text-center p-12">
          <div className="portada-label font-playfair text-[clamp(1rem,3vw,1.4rem)] tracking-[0.5em] color-crema-oscura uppercase mb-4 opacity-0 animate-[fadeUp_1s_ease_0.3s_forwards] text-crema-oscura">
            Fundación Córdoba Ciudad Cultural
          </div>
          <div className="portada-titulo font-playfair text-[clamp(5rem,18vw,14rem)] font-black text-crema leading-[0.85] tracking-tight opacity-0 animate-[fadeUp_1s_ease_0.6s_forwards]">
            DIC
            <span className="block text-azul-claro">CIO</span>
            NARIO
          </div>
          <div
            className="portada-titulo font-playfair text-[clamp(3rem,11vw,8rem)] font-black leading-[0.85] tracking-tight text-azul-claro mt-2 opacity-0 animate-[fadeUp_1s_ease_0.7s_forwards]"
          >
            CORDOBÉS
          </div>
          <div className="portada-subtexto mt-8 text-[clamp(0.8rem,2vw,1rem)] text-crema-oscura opacity-0 tracking-[0.2em] uppercase animate-[fadeUp_1s_ease_0.9s_forwards]">
            Habla coloquial · Idiosincrasia · Orgullo de pertenencia
          </div>
          <button
            className="portada-cta mt-12 inline-block px-10 py-4 border border-oro text-oro-claro font-libre text-sm tracking-[0.15em] uppercase cursor-pointer transition-all hover:bg-oro hover:text-tinta bg-transparent opacity-0 animate-[fadeUp_1s_ease_1.2s_forwards]"
            onClick={() => setShowApp(true)}
          >
            Entrar al diccionario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app block animate-[fadeIn_0.8s_ease] relative z-10">
      <header className="bg-azul text-crema p-6 sticky top-0 z-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="max-w-[1100px] mx-auto flex items-center gap-8 flex-wrap">
          <div
            className="header-titulo font-playfair text-2xl font-bold tracking-wider cursor-pointer"
            onClick={() => {
              setShowApp(false);
              setShowAbout(false);
            }}
          >
            <small className="block font-libre text-[0.65rem] tracking-[0.2em] uppercase text-oro-claro font-normal italic">
              Diccionario <span className="text-[10px] opacity-40 ml-1 not-italic lowercase tracking-normal">v2.4</span>
            </small>
            Cordobés
          </div>
          <div className="buscador-wrap flex-1 relative min-w-[200px]">
            <input
              type="text"
              id="busqueda"
              className="w-full py-2.5 pl-11 pr-10 border border-white/20 bg-white/10 text-crema font-libre text-base rounded-[2px] outline-none focus:bg-white/20 focus:border-oro transition-all placeholder:text-crema-oscura/50"
              placeholder="Buscar palabra o definición…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveLetter(null);
                setShowAbout(false);
              }}
              autoComplete="off"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-50">🔍</span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crema/60 hover:text-crema transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <div className="contador font-libre text-sm text-oro-claro whitespace-nowrap flex items-center gap-6">
            <button
              onClick={() => setShowAbout(!showAbout)}
              className={`text-crema/80 hover:text-oro-claro transition-colors cursor-pointer decoration-oro/30 underline-offset-4 mt-0.5 ${showAbout ? 'underline text-oro-claro' : ''}`}
            >
              Sobre el diccionario
            </button>
            <div className="flex items-center gap-4">
              {showInstallBtn && (
                <button 
                  onClick={handleInstallClick}
                  className="bg-oro text-tinta px-3 py-1 rounded text-xs font-bold uppercase tracking-tighter hover:bg-oro-claro transition-colors cursor-pointer"
                >
                  Instalar App
                </button>
              )}
              <button
                onClick={handleShare}
                className="text-crema/80 hover:text-oro-claro transition-colors cursor-pointer"
                title="Compartir Diccionario"
              >
                <Share2 size={20} />
              </button>
              <span>{filteredEntries.length} entradas</span>
            </div>
          </div>
        </div>
      </header>

      {!showAbout && (
        <nav className="abecedario bg-crema-oscura border-b-2 border-azul p-2.5 flex flex-wrap gap-0.5 justify-center sticky top-[88px] z-90 md:top-[80px]">
          {abecedario.map((l) => {
            const tiene = letrasConEntradas.has(l);
            return (
              <button
                key={l}
                className={`letra-btn font-playfair text-base font-bold w-8 h-8 flex items-center justify-center cursor-pointer border-none bg-transparent text-tinta-suave transition-all rounded-[2px] ${
                  !tiene ? 'text-crema-oscura cursor-default opacity-30' : ''
                } ${activeLetter === l ? 'bg-azul text-crema' : 'hover:bg-azul hover:text-crema'}`}
                onClick={() => tiene && setActiveLetter(activeLetter === l ? null : l)}
                disabled={!tiene}
                title={tiene ? l : '—'}
              >
                {l}
              </button>
            );
          })}
        </nav>
      )}

      <main className="contenido max-w-[1100px] mx-auto p-6 pb-16 min-h-[60vh]">
        {showAbout ? (
          <div className="about-content max-w-2xl mx-auto py-12 animate-[fadeIn_0.5s_ease]">
            <h2 className="font-playfair text-4xl font-black text-azul mb-10 border-b-4 border-oro pb-4">
              Sobre el diccionario
            </h2>
            <div className="font-libre text-lg leading-relaxed text-tinta-suave space-y-6 whitespace-pre-line">
              {aboutText}
            </div>
            <div className="mt-16 text-center">
              <button
                onClick={() => setShowAbout(false)}
                className="px-8 py-3 bg-azul text-crema font-bold text-sm tracking-[0.2em] uppercase rounded-[2px] transition-all hover:bg-azul/90 hover:-translate-y-0.5 shadow-lg shadow-azul/20 cursor-pointer"
              >
                Volver al diccionario
              </button>
            </div>
          </div>
        ) : (
          <>
            {!search && !activeLetter && (
              <section className="word-of-the-day mb-12 bg-white border-2 border-oro p-8 rounded-lg shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-oro text-tinta px-4 py-1 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  Palabra del Día
                  <button 
                    onClick={handleRandomWord}
                    className="ml-2 hover:rotate-180 transition-transform duration-500 cursor-pointer p-1 -mr-1"
                    title="Ver otra palabra al azar"
                  >
                    <Dices size={14} />
                  </button>
                </div>
                <h2 className="font-playfair text-4xl font-black text-azul mb-4">
                  {wordOfTheDay.v}
                </h2>
                <p className="text-lg text-tinta-suave mb-4 italic leading-relaxed">
                  {wordOfTheDay.def}
                </p>
                {wordOfTheDay.ej && (
                  <div className="text-sm text-tinta-suave opacity-70 border-t border-dashed border-crema-oscura pt-4">
                    <span className="text-oro font-bold mr-2">✦</span>
                    "{wordOfTheDay.ej}"
                  </div>
                )}
                <div className="mt-6 flex justify-end">
                  <span className="text-[0.7rem] uppercase tracking-widest text-oro-claro font-bold">
                    Una joya de la identidad cordobesa
                  </span>
                </div>
              </section>
            )}

            {filteredEntries.length === 0 ? (
              <div className="sin-resultados text-center py-16 px-8 text-tinta-suave opacity-50">
                <p className="font-playfair text-5xl mb-4">¡Cipote!</p>
                <p className="text-xl italic">No se ha encontrado ninguna entrada para «{search}».</p>
              </div>
            ) : (
              groupedEntries.map(([letra, entradas]) => (
                <section key={letra} className="seccion-letra mb-12" id={`sec-${letra}`}>
                  <div className="letra-header flex items-baseline gap-6 mb-6 pb-2 border-b-2 border-azul">
                    <span className="letra-grande font-playfair text-8xl font-black text-azul leading-none">
                      {letra}
                    </span>
                    <span className="letra-count text-sm text-tinta-suave opacity-60">
                      {entradas.length} entrada{entradas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="entradas-grid grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                    {entradas.map((e, idx) => (
                      <article
                        key={idx}
                        className="entrada bg-white border border-crema-oscura border-l-4 border-l-azul p-5 px-6 transition-all relative overflow-hidden group hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(26,82,118,0.12)] hover:border-l-oro"
                      >
                        <div className="entrada-vocablo font-playfair text-xl font-bold text-azul mb-1.5 relative flex items-baseline gap-2 flex-wrap">
                          {highlight(e.v, search)}
                        </div>
                        <div className="entrada-definicion text-sm leading-relaxed text-tinta-suave">
                          {highlight(e.def, search)}
                        </div>
                        {e.ej && (
                          <div className="entrada-ejemplo mt-2 italic text-[0.82rem] text-tinta-suave opacity-70 border-t border-dashed border-crema-oscura pt-1.5">
                            <span className="text-oro not-italic text-[0.65rem] mr-1">✦</span>
                            {highlight(e.ej, search)}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>

      <footer className="bg-tinta text-crema-oscura text-center p-8 text-sm tracking-wide opacity-90">
        <strong className="text-oro-claro font-bold">Diccionario Cordobés</strong> · Fundación Córdoba Ciudad Cultural
        <br />
        <span className="opacity-60 text-[0.75rem]">
          Elaborado a partir de las palabras propuestas por internautas en redes sociales · Córdoba 2016
          <br />
          Sincronizado: v2.4 - Mayo 2026
        </span>
      </footer>
      <div className="fixed bottom-2 right-2 text-[10px] text-tinta opacity-20 pointer-events-none select-none z-[200]">
        v2.4
      </div>
    </div>
  );
}
