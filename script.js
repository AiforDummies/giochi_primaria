// --- GESTIONE PREFERENZE & ACCESSIBILITÀ ---
        const prefs = {
            sound: true,
            tts: true,
            calm: false,
            font: false,
            size: false,
            music: true
        };

        function loadPrefs() {
            for (let key in prefs) {
                const saved = localStorage.getItem('pref_' + key);
                if (saved !== null) {
                    prefs[key] = saved === 'true';
                }
                updatePrefUI(key);
            }
            applyPrefsToBody();
        }

        function togglePref(key) {
            prefs[key] = !prefs[key];
            localStorage.setItem('pref_' + key, prefs[key]);
            updatePrefUI(key);
            applyPrefsToBody();
        }

        function updatePrefUI(key) {
            const el = document.getElementById('pref-' + key);
            if (!el) return;
            const icon = el.querySelector('.toggle-icon');
            el.setAttribute('aria-pressed', prefs[key] ? 'true' : 'false');
            if (prefs[key]) {
                el.classList.remove('off');
                icon.innerText = '✓';
            } else {
                el.classList.add('off');
                icon.innerText = '○';
            }
        }

        function applyPrefsToBody() {
            document.body.classList.toggle('calm-mode', prefs.calm);
            document.body.classList.toggle('atkinson-font', prefs.font);
            document.body.classList.toggle('large-text', prefs.size);
            
            document.querySelectorAll('.tts-btn-visibility').forEach(btn => {
                btn.style.display = prefs.tts ? 'flex' : 'none';
            });
        }

        // Sintesi Vocale (TTS)
        function speakText(text) {
            if (!prefs.tts || !('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'it-IT';
            utterance.rate = 0.85; // Ritmo calmo e scandito
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        }

        // Suoni sintetizzati via Web Audio API (Senza file esterni)
        let audioCtx = null;
        function playSound(type) {
            if (!prefs.sound) return;
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const ctx = audioCtx;
                if (ctx.state === 'suspended') ctx.resume();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                if (type === 'success') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
                    gain.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
                    osc.start(); osc.stop(ctx.currentTime + 0.35);
                } else if (type === 'pop') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(320, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.12);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
                    osc.start(); osc.stop(ctx.currentTime + 0.12);
                } else if (type === 'gentle-notice') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(300, ctx.currentTime);
                    osc.frequency.setValueAtTime(350, ctx.currentTime + 0.15);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    osc.start(); osc.stop(ctx.currentTime + 0.3);
                }
            } catch(e) {}
        }

        // Navigazione
        function toggleNote() {
            document.querySelector('.adult-note').classList.toggle('open');
        }

        function showMenu() {
            document.getElementById('menu-screen').style.display = 'flex';
            document.getElementById('game1-screen').style.display = 'none';
            document.getElementById('game2-screen').style.display = 'none';
            document.getElementById('game3-screen').style.display = 'none';
            document.getElementById('game4-screen').style.display = 'none';
            document.getElementById('game5-screen').style.display = 'none';
            if (typeof stopGame5 === 'function') stopGame5();
            window.speechSynthesis.cancel();
        }

        let currentGameId = null;

        function openGame(gameId) {
            if (currentGameId === 'game5' && gameId !== 'game5' && typeof stopGame5 === 'function') stopGame5();
            document.getElementById('menu-screen').style.display = 'none';
            ['game1','game2','game3','game4','game5'].forEach(id => {
                document.getElementById(id + '-screen').style.display = id === gameId ? 'block' : 'none';
            });
            currentGameId = gameId;

            // Avvia una nuova attività solo la prima volta; rientrando nel gioco lo stato resta disponibile.
            if (gameId === 'game1' && !g1Initialized) initGame1();
            if (gameId === 'game2' && !g2Initialized) initGame2();
            if (gameId === 'game3' && !g3Initialized) initGame3();
            if (gameId === 'game4' && !g4Initialized) startGame4();
            if (gameId === 'game5') initGame5();
        }

        function showModal(title, text, type, customBtnText = "Ho capito", customCallback = null) {
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-text').innerText = text;
            const modal = document.getElementById('modal');
            modal.className = 'modal ' + type;
            modal.style.display = 'flex';
            
            const actionsBox = document.getElementById('modal-actions');
            actionsBox.innerHTML = '';
            
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerText = customBtnText;
            btn.onclick = () => {
                closeModal();
                if(customCallback) customCallback();
            };
            actionsBox.appendChild(btn);

            if (type === 'success') speakText(title + ". " + text);
            else playSound('gentle-notice');
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
            window.speechSynthesis.cancel();
        }

        // --- LIBRERIA VETTORIALE SVG FLAT (Autism Friendly - Forme e Tratti Puliti) ---
        function getSvgIcon(key) {
            const svgs = {
                // Cibo & Frutta
                'mela': `<svg viewBox="0 0 100 100"><path d="M50 22 C20 22 10 50 10 70 C10 90 30 95 50 85 C70 95 90 90 90 70 C90 50 80 22 50 22 Z" fill="#F08080" stroke="#4A4742" stroke-width="4"/><path d="M50 22 Q55 8 65 12" stroke="#4A4742" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M55 12 C60 5 70 8 68 18 C60 18 55 12 55 12 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="2"/></svg>`,
                'banana': `<svg viewBox="0 0 100 100"><path d="M20 70 C 40 90, 75 80, 85 30 C 80 35, 60 50, 25 55 Z" fill="#F6E2B1" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><path d="M85 30 L90 20" stroke="#4A4742" stroke-width="4" stroke-linecap="round"/></svg>`,
                'carota': `<svg viewBox="0 0 100 100"><path d="M25 25 L80 40 L45 90 Z" fill="#F4C4A3" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><path d="M25 25 Q10 10 25 8 Q35 18 25 25 M25 25 Q35 10 45 25" stroke="#B0C4B1" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
                'pizza': `<svg viewBox="0 0 100 100"><polygon points="15,20 85,20 50,90" fill="#F6E2B1" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><rect x="12" y="12" width="76" height="12" rx="6" fill="#F4C4A3" stroke="#4A4742" stroke-width="3"/><circle cx="40" cy="40" r="6" fill="#F08080"/><circle cx="60" cy="48" r="6" fill="#F08080"/><circle cx="50" cy="65" r="5" fill="#F08080"/></svg>`,
                'pane': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="40" ry="25" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><path d="M30 48 Q35 60 40 48 M50 48 Q55 60 60 48 M70 48 Q75 60 80 48" stroke="#4A4742" stroke-width="3" fill="none"/></svg>`,
                'uva': `<svg viewBox="0 0 100 100"><circle cx="40" cy="40" r="12" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><circle cx="60" cy="40" r="12" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="55" r="12" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><circle cx="38" cy="68" r="12" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><circle cx="62" cy="68" r="12" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="82" r="10" fill="#C5B9D9" stroke="#4A4742" stroke-width="3"/><path d="M50 28 L50 12 Q60 10 65 18" stroke="#4A4742" stroke-width="4" fill="none"/></svg>`,
                'fragola': `<svg viewBox="0 0 100 100"><path d="M25 35 C20 65 35 90 50 90 C65 90 80 65 75 35 C70 25 30 25 25 35 Z" fill="#F0BFC8" stroke="#4A4742" stroke-width="4"/><circle cx="40" cy="45" r="2" fill="#4A4742"/><circle cx="60" cy="45" r="2" fill="#4A4742"/><circle cx="50" cy="60" r="2" fill="#4A4742"/><path d="M35 25 Q50 35 65 25 Q50 15 35 25 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="2"/></svg>`,
                'arancia': `<svg viewBox="0 0 100 100"><circle cx="50" cy="52" r="38" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><circle cx="50" cy="18" r="4" fill="#B0C4B1"/><path d="M48 18 Q50 10 58 12" stroke="#4A4742" stroke-width="3" fill="none"/></svg>`,

                // Animali
                'gatto': `<svg viewBox="0 0 100 100"><polygon points="25,35 20,10 40,25" fill="#FFFFFF" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><polygon points="75,35 80,10 60,25" fill="#FFFFFF" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="55" r="35" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><circle cx="38" cy="50" r="4" fill="#4A4742"/><circle cx="62" cy="50" r="4" fill="#4A4742"/><polygon points="50,58 45,63 55,63" fill="#F4C4A3" stroke="#4A4742" stroke-width="2"/><path d="M50 63 Q43 72 38 67 M50 63 Q57 72 62 67" stroke="#4A4742" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
                'cane': `<svg viewBox="0 0 100 100"><path d="M20 25 C 10 35, 10 60, 25 65 C 28 65, 30 50, 30 40 Z" fill="#F4C4A3" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><path d="M80 25 C 90 35, 90 60, 75 65 C 72 65, 70 50, 70 40 Z" fill="#F4C4A3" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><ellipse cx="50" cy="50" rx="32" ry="30" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><ellipse cx="50" cy="60" rx="18" ry="12" fill="#FAF9F6" stroke="#4A4742" stroke-width="3"/><circle cx="38" cy="45" r="4" fill="#4A4742"/><circle cx="62" cy="45" r="4" fill="#4A4742"/><ellipse cx="50" cy="56" rx="7" ry="5" fill="#4A4742"/></svg>`,
                'coniglio': `<svg viewBox="0 0 100 100"><ellipse cx="38" cy="25" rx="9" ry="22" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><ellipse cx="38" cy="25" rx="5" ry="15" fill="#F0BFC8"/><ellipse cx="62" cy="25" rx="9" ry="22" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><ellipse cx="62" cy="25" rx="5" ry="15" fill="#F0BFC8"/><circle cx="50" cy="60" r="32" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><circle cx="38" cy="53" r="4" fill="#4A4742"/><circle cx="62" cy="53" r="4" fill="#4A4742"/><polygon points="50,60 45,64 55,64" fill="#F0BFC8" stroke="#4A4742" stroke-width="2"/></svg>`,
                'orso': `<svg viewBox="0 0 100 100"><circle cx="24" cy="28" r="14" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><circle cx="76" cy="28" r="14" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><circle cx="50" cy="55" r="35" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><ellipse cx="50" cy="62" rx="16" ry="12" fill="#F6E2B1" stroke="#4A4742" stroke-width="3"/><circle cx="36" cy="48" r="4" fill="#4A4742"/><circle cx="64" cy="48" r="4" fill="#4A4742"/><ellipse cx="50" cy="58" rx="6" ry="4" fill="#4A4742"/></svg>`,
                'uccellino': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#A9C2D9" stroke="#4A4742" stroke-width="4"/><circle cx="62" cy="42" r="5" fill="#4A4742"/><polygon points="78,48 94,52 78,58" fill="#F6E2B1" stroke="#4A4742" stroke-width="3" stroke-linejoin="round"/><path d="M30 55 Q 20 40 40 45 Q 45 60 30 55 Z" fill="#FFFFFF" stroke="#4A4742" stroke-width="3"/></svg>`,
                'volpe': `<svg viewBox="0 0 100 100"><polygon points="20,40 15,10 42,30" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><polygon points="80,40 85,10 58,30" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><polygon points="50,85 15,38 85,38" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><polygon points="50,85 30,55 70,55" fill="#FFFFFF" stroke="#4A4742" stroke-width="3"/><circle cx="36" cy="45" r="4" fill="#4A4742"/><circle cx="64" cy="45" r="4" fill="#4A4742"/><circle cx="50" cy="80" r="5" fill="#4A4742"/></svg>`,
                'gufo': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="35" ry="38" fill="#C5B9D9" stroke="#4A4742" stroke-width="4"/><circle cx="36" cy="45" r="14" fill="#FFFFFF" stroke="#4A4742" stroke-width="3"/><circle cx="64" cy="45" r="14" fill="#FFFFFF" stroke="#4A4742" stroke-width="3"/><circle cx="36" cy="45" r="5" fill="#4A4742"/><circle cx="64" cy="45" r="5" fill="#4A4742"/><polygon points="50,52 44,62 56,62" fill="#F4C4A3" stroke="#4A4742" stroke-width="2"/></svg>`,
                'anatra': `<svg viewBox="0 0 100 100"><path d="M20 60 C20 85 75 85 80 60 C80 50 65 48 60 55 Z" fill="#F6E2B1" stroke="#4A4742" stroke-width="4"/><circle cx="35" cy="38" r="20" fill="#F6E2B1" stroke="#4A4742" stroke-width="4"/><circle cx="30" cy="32" r="4" fill="#4A4742"/><polygon points="18,36 2,42 18,46" fill="#F4C4A3" stroke="#4A4742" stroke-width="3"/></svg>`,
                'pappagallo': `<svg viewBox="0 0 100 100"><path d="M35 25 C 35 10, 65 10, 65 25 C 65 50, 50 85, 35 85 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="4"/><path d="M60 22 C 75 22, 75 38, 60 38 Z" fill="#F4C4A3" stroke="#4A4742" stroke-width="3"/><circle cx="48" cy="22" r="4" fill="#4A4742"/></svg>`,
                'pinguino': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="55" rx="32" ry="38" fill="#4A4742"/><ellipse cx="50" cy="58" rx="20" ry="28" fill="#FFFFFF"/><circle cx="40" cy="35" r="3" fill="#4A4742"/><circle cx="60" cy="35" r="3" fill="#4A4742"/><polygon points="50,38 44,45 56,45" fill="#F4C4A3"/></svg>`,

                // Forme Geometriche
                'cerchio': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#A9C2D9" stroke="#4A4742" stroke-width="5"/></svg>`,
                'quadrato': `<svg viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="8" fill="#B0C4B1" stroke="#4A4742" stroke-width="5"/></svg>`,
                'triangolo': `<svg viewBox="0 0 100 100"><polygon points="50,12 88,82 12,82" fill="#F6E2B1" stroke="#4A4742" stroke-width="5" stroke-linejoin="round"/></svg>`,
                'stella': `<svg viewBox="0 0 100 100"><polygon points="50,10 63,36 92,39 70,59 76,88 50,73 24,88 30,59 8,39 37,36" fill="#F6E2B1" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,
                'cuore': `<svg viewBox="0 0 100 100"><path d="M50 88 C20 65 10 45 25 25 C38 10 48 22 50 30 C52 22 62 10 75 25 C90 45 80 65 50 88 Z" fill="#F0BFC8" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,

                // Vestiti
                'maglietta': `<svg viewBox="0 0 100 100"><path d="M30 20 L10 35 L22 50 L30 42 L30 85 L70 85 L70 42 L78 50 L90 35 L70 20 Q50 30 30 20 Z" fill="#A9C2D9" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,
                'pantaloni': `<svg viewBox="0 0 100 100"><path d="M25 20 L75 20 L70 85 L52 85 L50 45 L48 85 L30 85 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,
                'cappello': `<svg viewBox="0 0 100 100"><path d="M10 70 L90 70 L80 60 C80 30 20 30 20 60 Z" fill="#C5B9D9" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,
                'scarpa': `<svg viewBox="0 0 100 100"><path d="M15 55 Q20 35 45 38 L60 50 L85 50 C92 50 95 65 90 72 L15 72 Z" fill="#F4C4A3" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,
                'calzino': `<svg viewBox="0 0 100 100"><path d="M35 15 L65 15 L65 50 C65 75 85 70 85 82 C85 92 65 92 45 92 C30 92 35 70 35 50 Z" fill="#F0BFC8" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/></svg>`,

                // Veicoli
                'auto': `<svg viewBox="0 0 100 100"><path d="M15 55 L25 32 L70 32 L85 55 L90 55 C95 55 95 72 90 72 L10 72 C5 72 5 55 15 55 Z" fill="#F0BFC8" stroke="#4A4742" stroke-width="4" stroke-linejoin="round"/><circle cx="30" cy="72" r="10" fill="#4A4742"/><circle cx="70" cy="72" r="10" fill="#4A4742"/></svg>`,
                'autobus': `<svg viewBox="0 0 100 100"><rect x="10" y="25" width="80" height="45" rx="8" fill="#F6E2B1" stroke="#4A4742" stroke-width="4"/><rect x="18" y="32" width="20" height="15" rx="3" fill="#FFFFFF" stroke="#4A4742" stroke-width="2"/><rect x="42" y="32" width="20" height="15" rx="3" fill="#FFFFFF" stroke="#4A4742" stroke-width="2"/><circle cx="28" cy="70" r="9" fill="#4A4742"/><circle cx="72" cy="70" r="9" fill="#4A4742"/></svg>`,
                'bici': `<svg viewBox="0 0 100 100"><circle cx="28" cy="62" r="20" fill="none" stroke="#4A4742" stroke-width="5"/><circle cx="72" cy="62" r="20" fill="none" stroke="#4A4742" stroke-width="5"/><path d="M28 62 L45 38 L68 38 M45 38 L58 62 L28 62 M58 62 L72 62 M68 38 L72 25 M38 32 L52 32" stroke="#4A4742" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
                'treno': `<svg viewBox="0 0 100 100"><rect x="15" y="35" width="50" height="35" fill="#A9C2D9" stroke="#4A4742" stroke-width="4"/><rect x="65" y="20" width="22" height="50" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><circle cx="28" cy="72" r="7" fill="#4A4742"/><circle cx="50" cy="72" r="7" fill="#4A4742"/><circle cx="75" cy="72" r="7" fill="#4A4742"/></svg>`,
                'aereo': `<svg viewBox="0 0 100 100"><path d="M10 50 C20 40 80 42 92 50 C80 58 20 60 10 50 Z" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><polygon points="45,45 60,15 72,15 60,45" fill="#A9C2D9" stroke="#4A4742" stroke-width="3"/><polygon points="45,55 60,85 72,85 60,55" fill="#A9C2D9" stroke="#4A4742" stroke-width="3"/></svg>`,

                // Cucina
                'forchetta': `<svg viewBox="0 0 100 100"><path d="M35 15 L35 40 C35 50 65 50 65 40 L65 15 M45 15 L45 40 M55 15 L55 40 M50 48 L50 88" stroke="#4A4742" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
                'cucchiaio': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="30" rx="18" ry="22" fill="#E8E5DF" stroke="#4A4742" stroke-width="4"/><path d="M50 52 L50 88" stroke="#4A4742" stroke-width="5" stroke-linecap="round"/></svg>`,
                'tazza': `<svg viewBox="0 0 100 100"><rect x="20" y="30" width="50" height="48" rx="8" fill="#C5B9D9" stroke="#4A4742" stroke-width="4"/><path d="M70 38 C85 38 85 70 70 70" stroke="#4A4742" stroke-width="4" fill="none"/></svg>`,
                'pentola': `<svg viewBox="0 0 100 100"><rect x="20" y="38" width="60" height="42" rx="6" fill="#A9C2D9" stroke="#4A4742" stroke-width="4"/><line x1="15" y1="30" x2="85" y2="30" stroke="#4A4742" stroke-width="5" stroke-linecap="round"/><path d="M10 50 L20 50 M80 50 L90 50" stroke="#4A4742" stroke-width="5" stroke-linecap="round"/></svg>`,
                'piatto': `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="42" ry="32" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><ellipse cx="50" cy="50" rx="26" ry="18" fill="none" stroke="#4A4742" stroke-width="2"/></svg>`,

                // Giocattoli
                'palla': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#F0BFC8" stroke="#4A4742" stroke-width="4"/><path d="M20 30 Q50 60 80 30 M20 70 Q50 40 80 70" stroke="#4A4742" stroke-width="3" fill="none"/></svg>`,
                'orsetto': `<svg viewBox="0 0 100 100"><circle cx="28" cy="25" r="10" fill="#F4C4A3" stroke="#4A4742" stroke-width="3"/><circle cx="72" cy="25" r="10" fill="#F4C4A3" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="45" r="25" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><ellipse cx="50" cy="72" rx="22" ry="20" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/></svg>`,
                'macchinina': `<svg viewBox="0 0 100 100"><rect x="20" y="45" width="60" height="25" rx="6" fill="#F6E2B1" stroke="#4A4742" stroke-width="4"/><path d="M30 45 L40 28 L60 28 L70 45 Z" fill="#F6E2B1" stroke="#4A4742" stroke-width="3"/><circle cx="35" cy="70" r="8" fill="#4A4742"/><circle cx="65" cy="70" r="8" fill="#4A4742"/></svg>`,
                'robot': `<svg viewBox="0 0 100 100"><rect x="25" y="30" width="50" height="45" rx="6" fill="#B0C4B1" stroke="#4A4742" stroke-width="4"/><circle cx="40" cy="48" r="6" fill="#FFFFFF" stroke="#4A4742" stroke-width="2"/><circle cx="60" cy="48" r="6" fill="#FFFFFF" stroke="#4A4742" stroke-width="2"/><line x1="38" y1="62" x2="62" y2="62" stroke="#4A4742" stroke-width="3"/><line x1="50" y1="30" x2="50" y2="15" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="12" r="4" fill="#F08080"/></svg>`,
                'cubo': `<svg viewBox="0 0 100 100"><rect x="22" y="22" width="56" height="56" rx="6" fill="#C5B9D9" stroke="#4A4742" stroke-width="4"/><text x="50" y="60" font-size="32" font-weight="bold" text-anchor="middle" fill="#4A4742">A</text></svg>`,

                // Piante & Natura
                'fiore': `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="14" fill="#F6E2B1" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="22" r="12" fill="#F0BFC8" stroke="#4A4742" stroke-width="3"/><circle cx="50" cy="78" r="12" fill="#F0BFC8" stroke="#4A4742" stroke-width="3"/><circle cx="22" cy="50" r="12" fill="#F0BFC8" stroke="#4A4742" stroke-width="3"/><circle cx="78" cy="50" r="12" fill="#F0BFC8" stroke="#4A4742" stroke-width="3"/></svg>`,
                'albero': `<svg viewBox="0 0 100 100"><rect x="42" y="60" width="16" height="30" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><circle cx="50" cy="42" r="30" fill="#B0C4B1" stroke="#4A4742" stroke-width="4"/></svg>`,
                'cactus': `<svg viewBox="0 0 100 100"><path d="M42 85 L58 85 L58 25 C58 15 42 15 42 25 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="4"/><path d="M42 50 L25 50 L25 35" stroke="#4A4742" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M58 60 L75 60 L75 45" stroke="#4A4742" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`,
                'foglia': `<svg viewBox="0 0 100 100"><path d="M20 80 Q20 20 80 20 Q80 80 20 80 Z" fill="#B0C4B1" stroke="#4A4742" stroke-width="4"/><line x1="20" y1="80" x2="65" y2="35" stroke="#4A4742" stroke-width="3"/></svg>`,
                'fungo': `<svg viewBox="0 0 100 100"><path d="M18 55 C18 20 82 20 82 55 Z" fill="#F08080" stroke="#4A4742" stroke-width="4"/><path d="M38 55 L38 85 L62 85 L62 55" fill="#FFFFFF" stroke="#4A4742" stroke-width="4"/><circle cx="38" cy="38" r="5" fill="#FFFFFF"/><circle cx="62" cy="38" r="5" fill="#FFFFFF"/></svg>`,

                // Casa & Arredamento
                'sedia': `<svg viewBox="0 0 100 100"><path d="M30 20 L30 52 L70 52 L70 20 M30 52 L25 88 M70 52 L75 88 M30 65 L70 65" stroke="#4A4742" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
                'tavolo': `<svg viewBox="0 0 100 100"><rect x="15" y="35" width="70" height="12" rx="3" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><line x1="25" y1="47" x2="25" y2="85" stroke="#4A4742" stroke-width="5"/><line x1="75" y1="47" x2="75" y2="85" stroke="#4A4742" stroke-width="5"/></svg>`,
                'letto': `<svg viewBox="0 0 100 100"><rect x="12" y="50" width="76" height="22" rx="4" fill="#A9C2D9" stroke="#4A4742" stroke-width="4"/><rect x="12" y="30" width="12" height="42" rx="3" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><rect x="28" y="42" width="20" height="12" rx="3" fill="#FFFFFF" stroke="#4A4742" stroke-width="2"/></svg>`,
                'lampada': `<svg viewBox="0 0 100 100"><polygon points="30,45 70,45 60,20 40,20" fill="#F6E2B1" stroke="#4A4742" stroke-width="4"/><line x1="50" y1="45" x2="50" y2="80" stroke="#4A4742" stroke-width="5"/><rect x="35" y="80" width="30" height="8" rx="3" fill="#4A4742"/></svg>`,
                'armadio': `<svg viewBox="0 0 100 100"><rect x="22" y="15" width="56" height="72" rx="4" fill="#F4C4A3" stroke="#4A4742" stroke-width="4"/><line x1="50" y1="15" x2="50" y2="87" stroke="#4A4742" stroke-width="3"/><circle cx="44" cy="52" r="3" fill="#4A4742"/><circle cx="56" cy="52" r="3" fill="#4A4742"/></svg>`
            };

            return svgs[key] || svgs['mela'];
        }

        // =========================================================
        // GIOCO 1: DENTRO O FUORI (Ray-Casting Algoritmo)
        // =========================================================
        const canvasG1 = document.getElementById('canvasG1');
        const ctxG1 = canvasG1.getContext('2d');
        let g1ColorMode = 'out'; // 'out' = arancione, 'in' = grigio
        let g1Polygon = [];
        let g1Items = [];

        function setG1Color(mode) {
            g1ColorMode = mode;
            document.getElementById('btn-col-out').style.border = mode === 'out' ? '4px solid #4A4742' : '2px solid transparent';
            document.getElementById('btn-col-in').style.border = mode === 'in' ? '4px solid #4A4742' : '2px solid transparent';
        }

        function isInsidePolygon(point, vs) {
            let x = point.x, y = point.y;
            let inside = false;
            for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                let xi = vs[i].x, yi = vs[i].y;
                let xj = vs[j].x, yj = vs[j].y;
                let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        }

        let g1Initialized = false;
        let g2Initialized = false;
        let g3Initialized = false;
        let g4Initialized = false;
        
        function initGame1() {
            g1Initialized = true;
            setG1Color('out');
            
            g1Polygon = [];
            const cx = canvasG1.width / 2;
            const cy = canvasG1.height / 2;
            const pts = 12;
            let rBase = 180;
            for(let i=0; i<pts; i++) {
                let angle = (i/pts) * Math.PI * 2;
                let r = rBase + (Math.sin(angle * 4) * 60);
                g1Polygon.push({ x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r });
            }

            const animalKeys = ['gatto', 'cane', 'coniglio', 'orso', 'uccellino', 'volpe'];
            g1Items = [];
            for(let i=0; i<6; i++) {
                let p, isInside;
                let ok = false;
                while(!ok) {
                    p = { x: 100 + Math.random()*(canvasG1.width-200), y: 100 + Math.random()*(canvasG1.height-200) };
                    isInside = isInsidePolygon(p, g1Polygon);
                    ok = true;
                    for(let j=0; j<g1Items.length; j++) {
                        if(Math.hypot(g1Items[j].x - p.x, g1Items[j].y - p.y) < 95) ok = false;
                    }
                    let distCenter = Math.hypot(p.x - cx, p.y - cy);
                    if(Math.abs(distCenter - rBase) < 35) ok = false;
                }
                g1Items.push({ 
                    x: p.x, 
                    y: p.y, 
                    inside: isInside, 
                    colorState: 'none', 
                    type: animalKeys[i % animalKeys.length] 
                });
            }
            drawG1();
        }

        function drawG1() {
            ctxG1.clearRect(0, 0, canvasG1.width, canvasG1.height);
            
            // Recinto
            ctxG1.beginPath();
            ctxG1.moveTo(g1Polygon[0].x, g1Polygon[0].y);
            for (let i = 1; i <= g1Polygon.length; i++) {
                let p0 = g1Polygon[(i-1) % g1Polygon.length];
                let p1 = g1Polygon[i % g1Polygon.length];
                let xc = (p0.x + p1.x) / 2;
                let yc = (p0.y + p1.y) / 2;
                if(i===1) ctxG1.moveTo(xc, yc);
                else ctxG1.quadraticCurveTo(p0.x, p0.y, xc, yc);
            }
            ctxG1.closePath();
            ctxG1.lineWidth = 6;
            ctxG1.strokeStyle = '#4A4742';
            ctxG1.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctxG1.fill();
            ctxG1.stroke();

            // Elementi
            g1Items.forEach(item => {
                let size = 65;
                if(item.colorState !== 'none') {
                    ctxG1.beginPath();
                    ctxG1.arc(item.x, item.y, size/2 + 6, 0, Math.PI*2);
                    ctxG1.fillStyle = item.colorState === 'out' ? '#F4C4A3' : '#D3D0CB';
                    ctxG1.fill();
                }
                
                // Rendering Vettoriale Canvas
                let tempDiv = document.createElement('div');
                tempDiv.innerHTML = getSvgIcon(item.type);
                let svgEl = tempDiv.querySelector('svg');
                let xml = new XMLSerializer().serializeToString(svgEl);
                let svgImg = new Image();
                svgImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(xml);
                
                if(svgImg.complete) {
                    ctxG1.drawImage(svgImg, item.x - size/2, item.y - size/2, size, size);
                } else {
                    svgImg.onload = () => {
                        ctxG1.drawImage(svgImg, item.x - size/2, item.y - size/2, size, size);
                    };
                }
            });
        }

        canvasG1.addEventListener('pointerdown', (e) => {
            const rect = canvasG1.getBoundingClientRect();
            const scaleX = canvasG1.width / rect.width;
            const scaleY = canvasG1.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            g1Items.forEach(item => {
                if(Math.hypot(item.x - x, item.y - y) < 40) {
                    item.colorState = g1ColorMode;
                    playSound('pop');
                    drawG1();
                }
            });
        });

        function checkAnswersG1() {
            let done = true;
            let correct = true;
            g1Items.forEach(item => {
                if(item.colorState === 'none') done = false;
                let needed = item.inside ? 'in' : 'out';
                if(item.colorState !== 'none' && item.colorState !== needed) correct = false;
            });

            if(!done) {
                showModal("Un attimo...", "Assicurati di aver colorato tutte le figure.", "retry");
            } else if(correct) {
                playSound('success');
                showModal("Bravissimo!", "Hai individuato correttamente chi è dentro e chi è fuori.", "success");
            } else {
                showModal("Osserva bene", "Qualcosa non torna. Ricorda: arancione fuori, grigio dentro. Riprova con calma.", "retry");
            }
        }

        // =========================================================
        // GIOCO 2: RIPASSA LE LINEE - DIFFICOLTÀ PROGRESSIVA
        // =========================================================
        const canvasG2 = document.getElementById('canvasG2');
        const ctxG2 = canvasG2.getContext('2d');
        let g2Paths = [];
        let isDrawingG2 = false;
        let lastX2 = 0, lastY2 = 0;

        let g2Drawings = [];
        let g2CurrentStroke = null;

        // La difficoltà aumenta solo dopo aver superato una scheda.
        // Ogni livello contiene più tipologie di tracciato e mantiene
        // una certa varietà grazie alla generazione casuale.
        const g2Levels = [
            {
                name: 'Linee semplici',
                description: 'Linee dritte e facilmente prevedibili.',
                paths: [
                    { type: 'straight', amplitude: 0 },
                    { type: 'straight', amplitude: 0 },
                    { type: 'straight', amplitude: 0 }
                ]
            },
            {
                name: 'Linee curve',
                description: 'Curve dolci da seguire con calma.',
                paths: [
                    { type: 'curve', amplitude: 34 },
                    { type: 'curve', amplitude: 42 },
                    { type: 'straight', amplitude: 0 }
                ]
            },
            {
                name: 'Onde',
                description: 'Percorsi ondulati con cambi di direzione.',
                paths: [
                    { type: 'wave', amplitude: 32, waves: 2 },
                    { type: 'wave', amplitude: 40, waves: 3 },
                    { type: 'curve', amplitude: 45 }
                ]
            },
            {
                name: 'Zig-zag',
                description: 'Percorsi con cambi di direzione più marcati.',
                paths: [
                    { type: 'zigzag', amplitude: 48, turns: 4 },
                    { type: 'zigzag', amplitude: 58, turns: 5 },
                    { type: 'wave', amplitude: 48, waves: 4 }
                ]
            },
            {
                name: 'Percorsi misti',
                description: 'Tracciati più lunghi e complessi da seguire.',
                paths: [
                    { type: 'mixed', amplitude: 50 },
                    { type: 'mixed', amplitude: 58 },
                    { type: 'zigzag', amplitude: 62, turns: 6 }
                ]
            }
        ];

        let g2CurrentLevel = 0;
        let g2SheetNumber = 1;

        function getG2Level() {
            return g2Levels[Math.max(0, Math.min(g2CurrentLevel, g2Levels.length - 1))];
        }

        function updateG2DifficultyUI() {
            const level = getG2Level();
            const badge = document.getElementById('g2-level-badge');
            const progress = document.getElementById('g2-progress');

            if (badge) {
                badge.innerText = `Livello ${g2CurrentLevel + 1} di ${g2Levels.length} · ${level.name}`;
            }

            if (progress) {
                progress.innerHTML = g2Levels.map((item, index) => {
                    const state = index < g2CurrentLevel ? 'completed'
                        : index === g2CurrentLevel ? 'current'
                        : 'locked';
                    const label = index < g2CurrentLevel ? '✓'
                        : index === g2CurrentLevel ? String(index + 1)
                        : '•';
                    return `<span class="g2-progress-step ${state}" title="${item.name}">${label}</span>`;
                }).join('');
            }
        }

        function initGame2(resetProgress = false) {
            g2Initialized = true;

            if (resetProgress) {
                g2CurrentLevel = 0;
                g2SheetNumber = 1;
            }

            g2Drawings = [];
            g2CurrentStroke = null;
            isDrawingG2 = false;

            const level = getG2Level();
            const h = canvasG2.height;
            const animals = ['gatto', 'coniglio', 'orso'];
            const targets = ['mela', 'carota', 'fiore'];

            // Per ogni scheda scegliamo 3 percorsi dal livello corrente.
            // L'ordine viene leggermente variato, senza uscire dalla difficoltà.
            const templates = level.paths
                .map(path => ({ ...path }))
                .sort(() => Math.random() - 0.5);

            g2Paths = templates.map((template, i) => ({
                ...template,
                y: (h / 4) * (i + 1),
                phase: Math.random() * Math.PI * 2,
                startKey: animals[i % animals.length],
                endKey: targets[i % targets.length]
            }));

            drawG2Base();
            updateG2DifficultyUI();

            document.getElementById('g2-status').innerText =
                `${level.description} Scheda ${g2SheetNumber}. Quando hai finito, premi “Verifica percorso”.`;

            // Leggera variazione sonora solo all'avvio della scheda.
            playSound('pop');
        }

        function startGame2() {
            initGame2(true);
        }

        function newSheetSameLevelG2() {
            g2SheetNumber++;
            initGame2(false);
        }

        function getG2PointAt(path, t) {
            const startX = 120;
            const endX = canvasG2.width - 120;
            const centerY = path.y;
            let y = centerY;

            if (path.type === 'straight') {
                y = centerY;
            } else if (path.type === 'curve') {
                // Una curva morbida che sale e poi ritorna.
                y = centerY + Math.sin((t - 0.15) * Math.PI) * path.amplitude;
            } else if (path.type === 'wave') {
                y = centerY + Math.sin(t * Math.PI * path.waves * 2 + path.phase) * path.amplitude;
            } else if (path.type === 'zigzag') {
                const turns = path.turns || 4;
                const segment = t * turns;
                const local = segment - Math.floor(segment);
                const direction = Math.floor(segment) % 2 === 0 ? 1 : -1;
                y = centerY + (local * 2 - 1) * path.amplitude * direction;
            } else if (path.type === 'mixed') {
                // Combina curva, onda e piccoli cambi di direzione.
                const wave = Math.sin(t * Math.PI * 4 + path.phase) * path.amplitude * 0.52;
                const curve = Math.sin(t * Math.PI) * path.amplitude * 0.48;
                y = centerY + wave + curve;
            }

            return { x: startX + (endX - startX) * t, y };
        }

        function drawG2Base() {
            ctxG2.clearRect(0, 0, canvasG2.width, canvasG2.height);

            g2Paths.forEach(path => {
                ctxG2.beginPath();
                ctxG2.lineWidth = 14;
                ctxG2.lineCap = 'round';
                ctxG2.lineJoin = 'round';
                ctxG2.strokeStyle = '#E8E5DF';

                for (let j = 0; j <= 120; j++) {
                    const p = getG2PointAt(path, j / 120);
                    if (j === 0) ctxG2.moveTo(p.x, p.y);
                    else ctxG2.lineTo(p.x, p.y);
                }
                ctxG2.stroke();

                // Piccoli punti di partenza/arrivo per rendere evidente
                // la direzione del percorso.
                const start = getG2PointAt(path, 0);
                const end = getG2PointAt(path, 1);

                ctxG2.fillStyle = '#B0C4B1';
                ctxG2.beginPath();
                ctxG2.arc(start.x, start.y, 9, 0, Math.PI * 2);
                ctxG2.fill();

                ctxG2.fillStyle = '#F4C4A3';
                ctxG2.beginPath();
                ctxG2.arc(end.x, end.y, 9, 0, Math.PI * 2);
                ctxG2.fill();
            });
        }

        function clearCanvasG2() {
            g2Drawings = [];
            g2CurrentStroke = null;
            drawG2Base();
            document.getElementById('g2-status').innerText =
                'Pronto per un nuovo tentativo. Segui una linea alla volta.';
        }

        function getPosG2(e) {
            const rect = canvasG2.getBoundingClientRect();
            const scaleX = canvasG2.width / rect.width;
            const scaleY = canvasG2.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        }

        canvasG2.addEventListener('pointerdown', (e) => {
            if (e.button && e.button !== 0) return;
            isDrawingG2 = true;
            canvasG2.setPointerCapture?.(e.pointerId);
            g2CurrentStroke = [getPosG2(e)];
            playSound('pop');
        });

        canvasG2.addEventListener('pointermove', (e) => {
            if (!isDrawingG2 || !g2CurrentStroke) return;
            e.preventDefault();

            const pos = getPosG2(e);
            const prev = g2CurrentStroke[g2CurrentStroke.length - 1];

            ctxG2.beginPath();
            ctxG2.moveTo(prev.x, prev.y);
            ctxG2.lineTo(pos.x, pos.y);
            ctxG2.strokeStyle = '#4A4742';
            ctxG2.lineWidth = 8;
            ctxG2.lineCap = 'round';
            ctxG2.stroke();

            g2CurrentStroke.push(pos);
        });

        canvasG2.addEventListener('pointerup', (e) => {
            if (!isDrawingG2) return;

            isDrawingG2 = false;
            canvasG2.releasePointerCapture?.(e.pointerId);

            if (g2CurrentStroke && g2CurrentStroke.length > 1) {
                g2Drawings.push(g2CurrentStroke);
            }

            g2CurrentStroke = null;
        });

        canvasG2.addEventListener('pointercancel', () => {
            isDrawingG2 = false;
            g2CurrentStroke = null;
        });

        function distancePointToSegment(p, a, b) {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len2 = dx * dx + dy * dy;

            if (!len2) return Math.hypot(p.x - a.x, p.y - a.y);

            let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
            t = Math.max(0, Math.min(1, t));

            return Math.hypot(
                p.x - (a.x + t * dx),
                p.y - (a.y + t * dy)
            );
        }

        function minDistanceToDrawings(point) {
            let min = Infinity;

            for (const stroke of g2Drawings) {
                for (let i = 1; i < stroke.length; i++) {
                    min = Math.min(
                        min,
                        distancePointToSegment(point, stroke[i - 1], stroke[i])
                    );
                }
            }

            return min;
        }

        function evaluateG2Path(path) {
            // La soglia resta abbastanza ampia da non penalizzare
            // piccoli tremori della mano.
            const samples = 41;
            const threshold = g2CurrentLevel <= 1 ? 38 : 42;
            let covered = 0;
            let started = false;
            let ended = false;

            for (let i = 0; i < samples; i++) {
                const p = getG2PointAt(path, i / (samples - 1));
                const near = minDistanceToDrawings(p);

                if (near <= threshold) covered++;
                if (i < 5 && near <= threshold) started = true;
                if (i >= samples - 5 && near <= threshold) ended = true;
            }

            return {
                coverage: covered / samples,
                started,
                ended
            };
        }

        function checkAnswersG2() {
            const status = document.getElementById('g2-status');

            if (!g2Drawings.length) {
                status.innerText = 'Non hai ancora tracciato una linea. Prova con calma.';
                playSound('gentle-notice');
                return;
            }

            const results = g2Paths.map(evaluateG2Path);
            const good = results.filter(result =>
                result.coverage >= (g2CurrentLevel <= 1 ? 0.72 : 0.68) &&
                result.started &&
                result.ended
            ).length;

            const all = good === g2Paths.length;

            if (all) {
                playSound('success');

                if (g2CurrentLevel < g2Levels.length - 1) {
                    const nextLevel = g2Levels[g2CurrentLevel + 1];

                    status.innerText =
                        `Scheda superata! Ora puoi provare il livello ${g2CurrentLevel + 2}: ${nextLevel.name}.`;

                    showModal(
                        'Ottimo lavoro!',
                        `Hai seguito tutti i percorsi. La prossima scheda sarà un po' più difficile: ${nextLevel.name}.`,
                        'success',
                        'Prossimo livello →',
                        () => {
                            g2CurrentLevel++;
                            g2SheetNumber = 1;
                            initGame2(false);
                        }
                    );
                } else {
                    status.innerText =
                        'Hai completato tutti i livelli di tracciamento! Puoi continuare ad allenarti.';
                    showModal(
                        'Percorso completato!',
                        'Hai superato anche il livello più complesso. Puoi continuare ad allenarti con nuove schede.',
                        'success',
                        'Nuova scheda →',
                        () => {
                            g2SheetNumber++;
                            initGame2(false);
                        }
                    );
                }
            } else {
                const remaining = g2Paths.length - good;
                status.innerText =
                    `${good} percorsi su ${g2Paths.length} sono ben seguiti. Ce ne sono ancora ${remaining} da riprovare.`;

                playSound('gentle-notice');
            }
        }

        // =========================================================
        // GIOCO 3: CATEGORIZZAZIONE OGGETTI (Drag & Drop)
        // =========================================================
        let currentG3SeriesIndex = 0;

        const g3SeriesData = [
            {
                title: "Serie 1: Cibo e Animali",
                catA: { id: "cibo", label: "Cibo 🍎", icon: "mela" },
                catB: { id: "animali", label: "Animali 🐱", icon: "gatto" },
                items: [
                    { id: "mela", label: "Mela", cat: "cibo" },
                    { id: "banana", label: "Banana", cat: "cibo" },
                    { id: "carota", label: "Carota", cat: "cibo" },
                    { id: "pizza", label: "Pizza", cat: "cibo" },
                    { id: "pane", label: "Pane", cat: "cibo" },
                    { id: "gatto", label: "Gatto", cat: "animali" },
                    { id: "cane", label: "Cane", cat: "animali" },
                    { id: "coniglio", label: "Coniglio", cat: "animali" },
                    { id: "orso", label: "Orso", cat: "animali" },
                    { id: "uccellino", label: "Uccello", cat: "animali" }
                ]
            },
            {
                title: "Serie 2: Frutta e Forme",
                catA: { id: "frutta", label: "Frutta 🍇", icon: "uva" },
                catB: { id: "forme", label: "Forme 🟩", icon: "quadrato" },
                items: [
                    { id: "mela", label: "Mela", cat: "frutta" },
                    { id: "banana", label: "Banana", cat: "frutta" },
                    { id: "uva", label: "Uva", cat: "frutta" },
                    { id: "fragola", label: "Fragola", cat: "frutta" },
                    { id: "arancia", label: "Arancia", cat: "frutta" },
                    { id: "cerchio", label: "Cerchio", cat: "forme" },
                    { id: "quadrato", label: "Quadrato", cat: "forme" },
                    { id: "triangolo", label: "Triangolo", cat: "forme" },
                    { id: "stella", label: "Stella", cat: "forme" },
                    { id: "cuore", label: "Cuore", cat: "forme" }
                ]
            },
            {
                title: "Serie 3: Vestiti e Veicoli",
                catA: { id: "vestiti", label: "Vestiti 👕", icon: "maglietta" },
                catB: { id: "veicoli", label: "Veicoli 🚗", icon: "auto" },
                items: [
                    { id: "maglietta", label: "Maglietta", cat: "vestiti" },
                    { id: "pantaloni", label: "Pantaloni", cat: "vestiti" },
                    { id: "cappello", label: "Cappello", cat: "vestiti" },
                    { id: "scarpa", label: "Scarpa", cat: "vestiti" },
                    { id: "calzino", label: "Calzino", cat: "vestiti" },
                    { id: "auto", label: "Auto", cat: "veicoli" },
                    { id: "autobus", label: "Autobus", cat: "veicoli" },
                    { id: "bici", label: "Bicicletta", cat: "veicoli" },
                    { id: "treno", label: "Treno", cat: "veicoli" },
                    { id: "aereo", label: "Aereo", cat: "veicoli" }
                ]
            },
            {
                title: "Serie 4: Terrestri e Volatili",
                catA: { id: "terrestri", label: "Terrestri 🐕", icon: "cane" },
                catB: { id: "volatili", label: "Volatili 🐦", icon: "uccellino" },
                items: [
                    { id: "cane", label: "Cane", cat: "terrestri" },
                    { id: "gatto", label: "Gatto", cat: "terrestri" },
                    { id: "coniglio", label: "Coniglio", cat: "terrestri" },
                    { id: "orso", label: "Orso", cat: "terrestri" },
                    { id: "volpe", label: "Volpe", cat: "terrestri" },
                    { id: "uccellino", label: "Uccellino", cat: "volatili" },
                    { id: "gufo", label: "Gufo", cat: "volatili" },
                    { id: "anatra", label: "Anatra", cat: "volatili" },
                    { id: "pappagallo", label: "Pappagallo", cat: "volatili" },
                    { id: "pinguino", label: "Pinguino", cat: "volatili" }
                ]
            },
            {
                title: "Serie 5: Cucina e Giocattoli",
                catA: { id: "cucina", label: "Cucina 🍴", icon: "forchetta" },
                catB: { id: "giocattoli", label: "Giocattoli 🧸", icon: "orsetto" },
                items: [
                    { id: "forchetta", label: "Forchetta", cat: "cucina" },
                    { id: "cucchiaio", label: "Cucchiaio", cat: "cucina" },
                    { id: "tazza", label: "Tazza", cat: "cucina" },
                    { id: "pentola", label: "Pentola", cat: "cucina" },
                    { id: "piatto", label: "Piatto", cat: "cucina" },
                    { id: "palla", label: "Palla", cat: "giocattoli" },
                    { id: "orsetto", label: "Orsetto", cat: "giocattoli" },
                    { id: "macchinina", label: "Macchinina", cat: "giocattoli" },
                    { id: "robot", label: "Robot", cat: "giocattoli" },
                    { id: "cubo", label: "Cubo A-B-C", cat: "giocattoli" }
                ]
            },
            {
                title: "Serie 6: Piante e Arredamento",
                catA: { id: "piante", label: "Piante 🌻", icon: "fiore" },
                catB: { id: "casa", label: "Arredamento 🪑", icon: "sedia" },
                items: [
                    { id: "fiore", label: "Fiore", cat: "piante" },
                    { id: "albero", label: "Albero", cat: "piante" },
                    { id: "cactus", label: "Cactus", cat: "piante" },
                    { id: "foglia", label: "Foglia", cat: "piante" },
                    { id: "fungo", label: "Fungo", cat: "piante" },
                    { id: "sedia", label: "Sedia", cat: "casa" },
                    { id: "tavolo", label: "Tavolo", cat: "casa" },
                    { id: "letto", label: "Letto", cat: "casa" },
                    { id: "lampada", label: "Lampada", cat: "casa" },
                    { id: "armadio", label: "Armadio", cat: "casa" }
                ]
            }
        ];

        function initGame3() {
            g3Initialized = true;
            loadG3Series(currentG3SeriesIndex);
        }

        function speakGame3Instruction() {
            const series = g3SeriesData[currentG3SeriesIndex];
            speakText(`Trascina ciascun oggetto nel contenitore giusto: ${series.catA.label} oppure ${series.catB.label}.`);
        }

        function loadG3Series(index) {
            currentG3SeriesIndex = index;
            const data = g3SeriesData[index];

            document.getElementById('g3-series-badge').innerText = `Serie ${index + 1} di 6`;
            document.getElementById('g3-instruction-text').innerHTML = 
                `Metti gli elementi di <strong>${data.catA.label}</strong> a sinistra e <strong>${data.catB.label}</strong> a destra.`;

            // Configura Contenitore A
            const zoneATitle = document.getElementById('zone-a-title');
            zoneATitle.innerHTML = `${getSvgIcon(data.catA.icon)} <span>${data.catA.label}</span>`;
            document.getElementById('zone-a').dataset.catId = data.catA.id;
            document.getElementById('zone-a-items').innerHTML = '';

            // Configura Contenitore B
            const zoneBTitle = document.getElementById('zone-b-title');
            zoneBTitle.innerHTML = `${getSvgIcon(data.catB.icon)} <span>${data.catB.label}</span>`;
            document.getElementById('zone-b').dataset.catId = data.catB.id;
            document.getElementById('zone-b-items').innerHTML = '';

            // Popola Pool
            const pool = document.getElementById('items-pool');
            pool.innerHTML = '';

            // Mescola oggetti
            const shuffled = [...data.items].sort(() => Math.random() - 0.5);

            shuffled.forEach(item => {
                const el = document.createElement('div');
                el.className = 'drag-item';
                el.dataset.id = item.id;
                el.dataset.correctCat = item.cat;
                el.innerHTML = `${getSvgIcon(item.id)}<span class="drag-item-label">${item.label}</span>`;
                
                setupItemPointerDrag(el);
                pool.appendChild(el);
            });

            document.getElementById('g3-status').innerText = 'Trascina gli oggetti e osserva il feedback del contenitore.';
            updatePoolCount();
        }

        function updatePoolCount() {
            const pool = document.getElementById('items-pool');
            const remaining = pool.children.length;
            document.getElementById('pool-title').innerText = `Oggetti da sistemare (${remaining})`;
        }

        let activeDragEl = null;
        let dragOffsetX = 0, dragOffsetY = 0;

        function setupItemPointerDrag(el) {
            el.addEventListener('pointerdown', (e) => {
                if (e.button && e.button !== 0) return;
                
                activeDragEl = el;
                el.setPointerCapture(e.pointerId);

                const rect = el.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;

                el.classList.add('dragging');
                el.style.position = 'fixed';
                el.style.zIndex = '1000';
                el.style.left = (e.clientX - dragOffsetX) + 'px';
                el.style.top = (e.clientY - dragOffsetY) + 'px';
                el.style.width = rect.width + 'px';

                playSound('pop');
            });

            el.addEventListener('pointermove', (e) => {
                if (!activeDragEl || activeDragEl !== el) return;
                el.style.left = (e.clientX - dragOffsetX) + 'px';
                el.style.top = (e.clientY - dragOffsetY) + 'px';
            });

            el.addEventListener('pointerup', (e) => {
                if (!activeDragEl || activeDragEl !== el) return;
                el.releasePointerCapture(e.pointerId);

                el.classList.remove('dragging');
                el.style.position = 'static';
                el.style.zIndex = 'auto';
                el.style.left = 'auto';
                el.style.top = 'auto';
                el.style.width = 'auto';

                // Individua elemento sottostante alla posizione di rilascio
                el.style.display = 'none';
                const target = document.elementFromPoint(e.clientX, e.clientY);
                el.style.display = 'flex';

                const zoneA = document.getElementById('zone-a');
                const zoneB = document.getElementById('zone-b');
                const pool = document.getElementById('items-pool');

                const closestZoneA = target ? target.closest('#zone-a') : null;
                const closestZoneB = target ? target.closest('#zone-b') : null;

                let placedZone = null;
                if (closestZoneA) { placedZone = zoneA; document.getElementById('zone-a-items').appendChild(el); }
                else if (closestZoneB) { placedZone = zoneB; document.getElementById('zone-b-items').appendChild(el); }
                else { pool.appendChild(el); }

                el.classList.remove('drop-correct','drop-wrong');
                if (placedZone) {
                    const correct = placedZone.dataset.catId === el.dataset.correctCat;
                    el.classList.add(correct ? 'drop-correct' : 'drop-wrong');
                    document.getElementById('g3-status').innerText = correct ? 'Giusto! Questo oggetto sta bene qui.' : 'Quasi! Osserva la categoria e, se vuoi, spostalo nell’altro contenitore.';
                    playSound(correct ? 'pop' : 'gentle-notice');
                } else {
                    document.getElementById('g3-status').innerText = 'Oggetto riportato nel gruppo da sistemare.';
                }
                activeDragEl = null;
                updatePoolCount();
            });

            el.addEventListener('pointercancel', (e) => {
                if (!activeDragEl || activeDragEl !== el) return;
                el.classList.remove('dragging');
                el.style.position = 'static';
                el.style.zIndex = 'auto';
                document.getElementById('items-pool').appendChild(el);
                activeDragEl = null;
                updatePoolCount();
            });
        }

        function checkAnswersG3() {
            const pool = document.getElementById('items-pool');
            if (pool.children.length > 0) {
                showModal("Un attimo...", "Trascina tutti e 10 gli oggetti nei due contenitori prima di verificare.", "retry");
                return;
            }

            const data = g3SeriesData[currentG3SeriesIndex];
            const zoneAItems = Array.from(document.getElementById('zone-a-items').children);
            const zoneBItems = Array.from(document.getElementById('zone-b-items').children);

            let allCorrect = true;

            zoneAItems.forEach(item => {
                if (item.dataset.correctCat !== data.catA.id) allCorrect = false;
            });

            zoneBItems.forEach(item => {
                if (item.dataset.correctCat !== data.catB.id) allCorrect = false;
            });

            if (allCorrect) {
                playSound('success');
                if (currentG3SeriesIndex < g3SeriesData.length - 1) {
                    showModal("Bravissimo!", "Hai raggruppato tutti gli oggetti nel posto corretto!", "success", "Prossima serie →", () => {
                        nextG3Series();
                    });
                } else {
                    showModal("Complimenti!", "Hai completato tutte e 6 le serie di categorizzazione!", "success", "Ricomincia dalla prima", () => {
                        loadG3Series(0);
                    });
                }
            } else {
                const wrongItems = [...zoneAItems, ...zoneBItems].filter(item => {
                    const parentZone = item.closest('.drop-zone');
                    return parentZone && parentZone.dataset.catId !== item.dataset.correctCat;
                });
                const names = wrongItems.slice(0,3).map(item => item.querySelector('.drag-item-label')?.innerText || 'un oggetto').join(', ');
                document.getElementById('g3-status').innerText = `Da rivedere: ${wrongItems.length}. ${names ? 'Puoi controllare: ' + names + '.' : 'Osserva nuovamente le categorie.'}`;
                playSound('gentle-notice');
            }
        }

        function nextG3Series() {
            currentG3SeriesIndex = (currentG3SeriesIndex + 1) % g3SeriesData.length;
            loadG3Series(currentG3SeriesIndex);
        }

        function resetCurrentG3Series() {
            loadG3Series(currentG3SeriesIndex);
        }

        // =========================================================
        // GIOCO 5: IL BOSCO DEL SILENZIO
        // Microfono locale: analisi del livello sonoro relativo, senza registrazione.
        // =========================================================
        const g5State = {
            initialized: false,
            running: false,
            calibrating: false,
            trial: false,
            started: false,
            completed: false,
            progress: 0,
            baseline: 0.025,
            threshold: 0.030,
            stream: null,
            audioContext: null,
            analyser: null,
            data: null,
            raf: null,
            calibrationSamples: [],
            calibrationStartedAt: 0,
            lastFrameAt: 0,
            noisyDuration: 0,
            gameElapsed: 0,
            spawnElapsed: 0,
            decorationElapsed: 0,
            goblinsOut: 0,
            trialSpawned: 0,
            returning: false,
            lastDecorationAt: 0,
            nextDecorationAt: 0
        };

        // Asset emoji riutilizzabili: durante il gioco possono comparire più folletti dello stesso tipo.
        const g5GoblinEmojis = ['🧚', '🧝', '🧚‍♀️', '🧝‍♀️', '🧚'];
        const g5SpawnHouses = [0, 0, 1, 3, 4];
        let g5GoblinSerial = 0;

        // Colonna sonora generativa 8-bit: delicata, senza file audio esterni.
        let g5MusicCtx = null;
        let g5MusicTimer = null;
        let g5MusicStep = 0;
        const g5MusicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

        function g5MusicLevel() {
            const goblins = document.querySelectorAll('.g5-goblin.out').length;
            const decorations = document.querySelectorAll('.g5-decoration').length;
            const richness = goblins + Math.floor(decorations / 6);
            if (richness >= 12) return 5;
            if (richness >= 8) return 4;
            if (richness >= 5) return 3;
            if (richness >= 2) return 2;
            return 1;
        }

        function g5Tone(freq, when, duration=.16, volume=.018, type='square') {
            if (!prefs.music || !g5MusicCtx) return;
            const osc = g5MusicCtx.createOscillator();
            const gain = g5MusicCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, when);
            gain.gain.setValueAtTime(0.0001, when);
            gain.gain.exponentialRampToValueAtTime(volume, when + .018);
            gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
            osc.connect(gain); gain.connect(g5MusicCtx.destination);
            osc.start(when); osc.stop(when + duration + .02);
        }

        function g5MusicTick() {
            if (!prefs.music || !g5State.running || !g5State.started || g5State.completed) return;
            if (!g5MusicCtx) g5MusicCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (g5MusicCtx.state === 'suspended') g5MusicCtx.resume();
            const now = g5MusicCtx.currentTime + .02;
            const level = g5MusicLevel();
            const melody = [0,2,4,2,1,3,5,3];
            const i = g5MusicStep % melody.length;
            g5Tone(g5MusicScale[melody[i]], now, .18, .014, 'square');
            if (level >= 2 && g5MusicStep % 2 === 0) g5Tone(g5MusicScale[[0,3,1,4][Math.floor(g5MusicStep/2)%4]]/2, now, .28, .010, 'triangle');
            if (level >= 3) g5Tone(g5MusicScale[(melody[i]+2)%g5MusicScale.length]*2, now+.20, .10, .007, 'square');
            if (level >= 4 && g5MusicStep % 4 === 0) {
                [0,2,4].forEach((n,k)=>g5Tone(g5MusicScale[n]*2, now+.08*k, .09, .0055, 'square'));
            }
            if (level >= 5 && g5MusicStep % 4 === 2) g5Tone(1046.5, now+.12, .12, .0045, 'sine');
            g5MusicStep++;
        }

        function startGame5Music() {
            if (!prefs.music || g5MusicTimer) return;
            try {
                if (!g5MusicCtx) g5MusicCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (g5MusicCtx.state === 'suspended') g5MusicCtx.resume();
                g5MusicStep = 0;
                g5MusicTick();
                g5MusicTimer = setInterval(g5MusicTick, 720);
            } catch(e) {}
        }

        function stopGame5Music(closeContext=false) {
            if (g5MusicTimer) clearInterval(g5MusicTimer);
            g5MusicTimer = null;
            if (closeContext && g5MusicCtx) {
                try { g5MusicCtx.close(); } catch(e) {}
                g5MusicCtx = null;
            }
        }

        function toggleGame5Music() {
            prefs.music = !prefs.music;
            localStorage.setItem('pref_music', prefs.music);
            updatePrefUI('music');
            const btn = document.getElementById('g5-music-btn');
            if (btn) btn.textContent = prefs.music ? '🎵 Musica ON' : '🔇 Musica OFF';
            if (prefs.music && g5State.running && g5State.started && !g5State.completed) startGame5Music();
            else stopGame5Music(false);
        }

        function initGame5() {
            if (g5State.initialized) return;
            g5State.initialized = true;
            buildGame5Forest();
            resetGame5Visuals();
            updateGame5Progress();
        }

        function buildGame5Forest() {
            const forest = document.getElementById('g5-forest');
            if (!forest) return;
            forest.innerHTML = '';

            const houses = ['🏡','🏠','🏡','🏠','🏡'];
            houses.forEach((emoji, index) => {
                const house = document.createElement('div');
                house.className = 'g5-house';
                house.dataset.house = index;
                house.innerHTML = `
                    <div class="g5-house-emoji" aria-hidden="true">${emoji}</div>
                    <div class="g5-door" aria-hidden="true">🚪</div>
                `;
                forest.appendChild(house);
            });

            const decorations = document.createElement('div');
            decorations.id = 'g5-decorations';
            decorations.className = 'g5-decorations';
            decorations.setAttribute('aria-hidden', 'true');
            forest.appendChild(decorations);
        }

        function speakGame5Instruction(announce = true) {
            if (!announce) return;
            speakText('Fate silenzio insieme. Prima facciamo una piccola prova. Quando tutti e cinque i folletti sono usciti, comincia il vero gioco. Il gioco dura cinque minuti.');
        }

        function setGame5Status(text) {
            const el = document.getElementById('g5-status');
            if (el) el.textContent = text;
        }

        function resetGame5Visuals() {
            document.querySelectorAll('.g5-goblin').forEach(g => g.remove());
            g5GoblinSerial = 0;
            const decorations = document.getElementById('g5-decorations');
            if (decorations) decorations.innerHTML = '';
        }

        function updateGame5Progress() {
            const progress = Math.max(0, Math.min(100, g5State.progress));
            const fill = document.getElementById('g5-progress-fill');
            const text = document.getElementById('g5-progress-text');
            if (fill) fill.style.width = `${progress}%`;
            if (text) text.textContent = `${Math.round(progress)}%`;
        }

        function formatG5Time(seconds) {
            const remaining = Math.max(0, Math.ceil(300 - seconds));
            return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2,'0')}`;
        }

        function updateGame5Timer() {
            const el = document.getElementById('g5-timer-text');
            if (el) el.textContent = formatG5Time(g5State.gameElapsed);
        }

        function setGame5Phase(text) {
            const el = document.getElementById('g5-phase-badge');
            if (el) el.textContent = text;
        }

        function getG5HousePosition(houseIndex) {
            const forest = document.getElementById('g5-forest');
            const house = document.querySelector(`.g5-house[data-house="${houseIndex}"]`);
            if (!forest || !house) return {x:50,y:65};
            const f = forest.getBoundingClientRect();
            const h = house.getBoundingClientRect();
            return {
                x: ((h.left + h.width/2 - f.left) / f.width) * 100,
                y: ((h.top + h.height*0.52 - f.top) / f.height) * 100
            };
        }

        function spawnGoblin(assetIndex = null, fast = false) {
            const forest = document.getElementById('g5-forest');
            if (!forest) return null;
            const chosen = assetIndex === null ? Math.floor(Math.random()*g5GoblinEmojis.length) : assetIndex % g5GoblinEmojis.length;
            const houseIndex = assetIndex === null ? Math.floor(Math.random()*5) : g5SpawnHouses[chosen];
            const home = getG5HousePosition(houseIndex);
            const goblin = document.createElement('div');
            goblin.className = 'g5-goblin';
            goblin.id = `g5-goblin-${g5GoblinSerial++}`;
            goblin.textContent = g5GoblinEmojis[chosen];
            goblin.setAttribute('aria-hidden', 'true');
            goblin.dataset.house = houseIndex;
            goblin.style.left = `${home.x}%`;
            goblin.style.top = `${home.y}%`;
            goblin.style.setProperty('--home-x', `${home.x}%`);
            goblin.style.setProperty('--home-y', `${home.y}%`);
            forest.appendChild(goblin);
            requestAnimationFrame(() => goblin.classList.add('out'));
            g5State.goblinsOut = document.querySelectorAll('.g5-goblin.out').length + 1;
            setTimeout(() => startGoblinWander(goblin), fast ? 120 : 650);
            playSound('pop');
            return goblin;
        }

        function startGoblinWander(goblin) {
            if (!goblin || !goblin.isConnected || !goblin.classList.contains('out') || goblin.classList.contains('returning')) return;
            const move = () => {
                if (!goblin.isConnected || !goblin.classList.contains('out') || goblin.classList.contains('returning')) return;
                const x = 10 + Math.random() * 80;
                const y = 28 + Math.random() * 56;
                const duration = 7 + Math.random() * 6;
                goblin.style.transition = `left ${duration}s ease-in-out, top ${duration}s ease-in-out, transform 2.4s ease-in-out, opacity .25s ease`;
                goblin.style.left = `${x}%`;
                goblin.style.top = `${y}%`;
                goblin.classList.add('wandering');
                goblin._wanderTimer = setTimeout(move, duration * 1000);
            };
            move();
        }

        function spawnDecoration() {
            const box = document.getElementById('g5-decorations');
            if (!box) return;
            if (box.children.length >= 70) return;
            const choices = ['🌱','🌟','💚','🌱','⭐','💖'];
            const item = document.createElement('span');
            item.className = 'g5-decoration';
            item.textContent = choices[Math.floor(Math.random()*choices.length)];
            item.style.left = `${10 + Math.random()*80}%`;
            item.style.top = `${38 + Math.random()*48}%`;
            box.appendChild(item);
        }

        function returnAllGoblinsHome() {
            if (g5State.returning) return;
            const active = [...document.querySelectorAll('.g5-goblin.out')];
            if (!active.length) { g5State.noisyDuration = 0; return; }
            g5State.returning = true;
            setGame5Status('🤫 Il bosco ha sentito troppo rumore… i folletti tornano a casa!');
            setGame5Phase('🏡 I folletti tornano a casa');
            active.forEach(g => {
                if (g._wanderTimer) clearTimeout(g._wanderTimer);
                const home = getG5HousePosition(Number(g.dataset.house || 0));
                g.classList.remove('wandering');
                g.classList.add('returning');
                g.style.transition = 'left .75s cubic-bezier(.65,0,.85,.35), top .75s cubic-bezier(.65,0,.85,.35), transform .75s ease, opacity .18s ease .62s';
                g.style.left = `${home.x}%`;
                g.style.top = `${home.y}%`;
            });
            setTimeout(() => {
                active.forEach(g => g.remove());
                g5State.goblinsOut = document.querySelectorAll('.g5-goblin.out').length;
                g5State.spawnElapsed = 0;
                g5State.returning = false;
                g5State.noisyDuration = 0;
                setGame5Phase(g5State.started ? '🌿 Gioco vero · 5 minuti' : '🌱 Prova del bosco');
                setGame5Status('I folletti sono al sicuro. Quando torna la calma, possono uscire di nuovo.');
            }, 900);
        }

        async function startGame5() {
            initGame5();
            if (g5State.running) return;
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setGame5Status('Il browser non permette di usare il microfono qui. Prova la versione pubblicata su GitHub Pages (HTTPS).');
                return;
            }
            try {
                g5State.stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
                    video: false
                });
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) throw new Error('AudioContext non disponibile');
                g5State.audioContext = new AudioCtx();
                const source = g5State.audioContext.createMediaStreamSource(g5State.stream);
                g5State.analyser = g5State.audioContext.createAnalyser();
                g5State.analyser.fftSize = 1024;
                g5State.analyser.smoothingTimeConstant = 0.65;
                g5State.data = new Uint8Array(g5State.analyser.fftSize);
                source.connect(g5State.analyser);

                resetGame5State(false);
                g5State.running = true;
                document.getElementById('g5-start-btn').disabled = true;
                document.getElementById('g5-restart-btn').disabled = false;
                document.getElementById('g5-stop-btn').disabled = false;
                setGame5Status('Microfono attivo. Restiamo in silenzio per ascoltare il bosco…');
                await calibrateGame5();
                if (!g5State.running) return;

                // LIVELLO DI PROVA: tutti i cinque folletti escono. Al quinto parte il vero gioco.
                g5State.trial = true;
                setGame5Phase('🌱 Prova del bosco');
                setGame5Status('Prova: guardate come i folletti escono e si muovono nel bosco.');
                g5State.lastFrameAt = performance.now();
                g5State.raf = requestAnimationFrame(game5Loop);
            } catch (error) {
                stopGame5();
                if (error?.name === 'NotAllowedError') setGame5Status('Permesso del microfono non concesso. Puoi abilitarlo dalle impostazioni del browser e riprovare.');
                else if (error?.name === 'NotFoundError') setGame5Status('Non trovo un microfono disponibile su questo dispositivo.');
                else setGame5Status('Non riesco ad attivare il microfono. Controlla i permessi e riprova.');
            }
        }

        function resetGame5State(keepMicrophone = true) {
            g5State.calibrating = false;
            g5State.trial = false;
            g5State.started = false;
            g5State.completed = false;
            g5State.progress = 0;
            g5State.noisyDuration = 0;
            g5State.gameElapsed = 0;
            g5State.spawnElapsed = 0;
            g5State.decorationElapsed = 0;
            g5State.goblinsOut = 0;
            g5State.trialSpawned = 0;
            g5State.returning = false;
            g5State.lastDecorationAt = 0;
            g5State.nextDecorationAt = 0;
            stopGame5Music(false);
            resetGame5Visuals();
            updateGame5Progress();
            updateGame5Timer();
            setGame5Phase('🌱 Prova del bosco');
            if (!keepMicrophone) {
                const startBtn = document.getElementById('g5-start-btn');
                if (startBtn) startBtn.disabled = false;
            }
        }

        function restartGame5() {
            if (!g5State.running) {
                startGame5();
                return;
            }
            resetGame5State(true);
            setGame5Status('Nuova partita! Prima osserviamo la prova del bosco. 🌱');
            g5State.lastFrameAt = performance.now();
        }

        function readGame5Rms() {
            if (!g5State.analyser || !g5State.data) return 0;
            g5State.analyser.getByteTimeDomainData(g5State.data);
            let sum = 0;
            for (let i = 0; i < g5State.data.length; i++) {
                const sample = (g5State.data[i] - 128) / 128;
                sum += sample * sample;
            }
            return Math.sqrt(sum / g5State.data.length);
        }

        function calibrateGame5() {
            return new Promise(resolve => {
                if (!g5State.running || !g5State.analyser) { resolve(false); return; }
                g5State.calibrating = true;
                g5State.calibrationSamples = [];
                g5State.calibrationStartedAt = performance.now();
                setGame5Status('Ascoltiamo per un momento il rumore normale della stanza…');
                const collect = () => {
                    if (!g5State.running || !g5State.calibrating) { resolve(false); return; }
                    g5State.calibrationSamples.push(readGame5Rms());
                    if (performance.now() - g5State.calibrationStartedAt < 2200) { requestAnimationFrame(collect); return; }
                    const samples = g5State.calibrationSamples.slice().sort((a,b)=>a-b);
                    const trim = Math.floor(samples.length * 0.10);
                    const useful = samples.slice(trim, Math.max(trim + 1, samples.length - trim));
                    const average = useful.reduce((sum,v)=>sum+v,0) / Math.max(1,useful.length);
                    g5State.baseline = Math.max(0.008, average);
                    g5State.threshold = Math.min(0.070, Math.max(0.010, g5State.baseline * 1.15 + 0.002));
                    g5State.calibrating = false;
                    resolve(true);
                };
                requestAnimationFrame(collect);
            });
        }

        function beginRealGame5() {
            if (g5State.started) return;
            g5State.started = true;
            g5State.trial = false;
            g5State.gameElapsed = 0;
            g5State.spawnElapsed = 0;
            g5State.decorationElapsed = 0;
            g5State.progress = 0;
            g5State.noisyDuration = 0;
            g5State.nextDecorationAt = 122 + Math.random();
            setGame5Phase('🌿 Gioco vero · 5 minuti');
            setGame5Status('Il gioco è iniziato! Ogni 20 secondi un folletto può uscire. 🌱');
            updateGame5Timer();
            startGame5Music();
        }

        function game5Loop(now) {
            if (!g5State.running || !g5State.analyser) return;
            const dt = Math.min(0.08, Math.max(0.01, (now - g5State.lastFrameAt) / 1000));
            g5State.lastFrameAt = now;
            const rms = readGame5Rms();
            const ratio = rms / Math.max(g5State.threshold, 0.001);
            const quiet = ratio < 1;

            if (!g5State.calibrating) {
                if (g5State.trial) {
                    // La prova non consuma il tempo di gioco: fa uscire i 5 folletti uno alla volta.
                    if (quiet) {
                        g5State.progress = Math.min(100, g5State.progress + dt * 18);
                    } else {
                        g5State.progress = Math.max(0, g5State.progress - dt * 6);
                    }
                    updateGame5Progress();
                    if (quiet) g5State.noisyDuration = 0;
                    else g5State.noisyDuration += dt;
                    if (g5State.noisyDuration >= 5 && !g5State.returning) {
                        returnAllGoblinsHome();
                        g5State.trialSpawned = 0;
                        g5State.progress = 0;
                        updateGame5Progress();
                    }
                    const target = Math.min(5, Math.floor(g5State.progress / 20) + 1);
                    while (g5State.trialSpawned < target) {
                        spawnGoblin(g5State.trialSpawned, true);
                        g5State.trialSpawned++;
                    }
                    if (g5State.trialSpawned >= 5) {
                        beginRealGame5();
                    }
                } else if (g5State.started && !g5State.completed) {
                    g5State.gameElapsed += dt;
                    g5State.spawnElapsed += dt;
                    if (quiet) {
                        g5State.progress = Math.min(100, g5State.progress + dt * 0.55);
                        g5State.noisyDuration = 0;
                    } else {
                        g5State.progress = Math.max(0, g5State.progress - dt * 0.12);
                        g5State.noisyDuration += dt;
                    }

                    // Nei primi 2 minuti: un nuovo folletto ogni 20 secondi.
                    if (g5State.gameElapsed <= 120 && g5State.spawnElapsed >= 20 && !g5State.returning) {
                        spawnGoblin();
                        g5State.goblinsOut = document.querySelectorAll('.g5-goblin.out').length;
                        g5State.spawnElapsed = 0;
                    }

                    // Dopo i 2 minuti: un nuovo elemento fisso ogni 2–3 secondi, con ritmo leggermente irregolare.
                    if (g5State.gameElapsed >= 120 && g5State.gameElapsed >= g5State.nextDecorationAt) {
                        spawnDecoration();
                        g5State.lastDecorationAt = g5State.gameElapsed;
                        g5State.nextDecorationAt = g5State.gameElapsed + 2 + Math.random();
                    }

                    updateGame5Progress();
                    updateGame5Timer();

                    if (g5State.noisyDuration >= 5 && !g5State.returning) {
                        returnAllGoblinsHome();
                    }

                    if (g5State.gameElapsed >= 300) {
                        g5State.completed = true;
                        g5State.progress = 100;
                        updateGame5Progress();
                        updateGame5Timer();
                        document.querySelectorAll('.g5-goblin').forEach(g => g.classList.add('happy'));
                        setGame5Phase('🎉 Bosco in festa!');
                        setGame5Status('🎉 Avete completato i 5 minuti! Il bosco è pieno di vita.');
                        stopGame5Music(false);
                        playSound('success');
                    } else if (g5State.noisyDuration > 2 && !g5State.returning) {
                        setGame5Status('🤫 Il bosco sta ascoltando… proviamo a ritrovare la calma.');
                    }
                }
            }
            g5State.raf = requestAnimationFrame(game5Loop);
        }

        function stopGame5() {
            stopGame5Music(true);
            if (g5State.raf) cancelAnimationFrame(g5State.raf);
            g5State.raf = null;
            g5State.running = false;
            g5State.calibrating = false;
            g5State.calibrationSamples = [];
            if (g5State.stream) {
                g5State.stream.getTracks().forEach(track => track.stop());
                g5State.stream = null;
            }
            if (g5State.audioContext) {
                try { g5State.audioContext.close(); } catch(e) {}
                g5State.audioContext = null;
            }
            g5State.analyser = null;
            g5State.data = null;
            const startBtn = document.getElementById('g5-start-btn');
            const restartBtn = document.getElementById('g5-restart-btn');
            const stopBtn = document.getElementById('g5-stop-btn');
            if (startBtn) startBtn.disabled = false;
            if (restartBtn) restartBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = true;
            setGame5Status('Microfono spento. Quando volete, potete ricominciare.');
        }

        // =========================================================
        // GIOCO 4: QUANTE FIGURE CI SONO? (CONTEGGIO)
        // =========================================================
        let g4CurrentTargetCount = 0;
        let g4CurrentThemeIndex = 0;
        let g4CorrectOptionIndex = 0;

        const g4Themes = [
            {
                name: "Animali",
                items: ['gatto', 'cane', 'coniglio', 'orso', 'uccellino', 'volpe', 'gufo', 'pinguino']
            },
            {
                name: "Frutta",
                items: ['mela', 'banana', 'carota', 'uva', 'fragola', 'arancia']
            },
            {
                name: "Forme Geometriche",
                items: ['cerchio', 'quadrato', 'triangolo', 'stella', 'cuore']
            }
        ];

        function generateGame4(){
            const theme = g4Themes[g4CurrentThemeIndex];
            document.getElementById('g4-theme-badge').innerText = `Tema: ${theme.name}`;
            g4CurrentTargetCount = Math.floor(Math.random() * 10) + 1;
            const randomItemKey = theme.items[Math.floor(Math.random() * theme.items.length)];
            const grid = document.getElementById('count-figures-grid'); grid.innerHTML = '';
            for (let i=0;i<g4CurrentTargetCount;i++){ const card=document.createElement('div'); card.className='count-card'; card.innerHTML=getSvgIcon(randomItemKey); grid.appendChild(card); }
            let wrongCount=g4CurrentTargetCount;
            while(wrongCount===g4CurrentTargetCount){ let delta=Math.random()<0.5?-1:1; if(g4CurrentTargetCount===1)delta=1; if(g4CurrentTargetCount===10)delta=-1; wrongCount=Math.max(1,Math.min(10,g4CurrentTargetCount+delta)); }
            g4CorrectOptionIndex=Math.random()<0.5?0:1;
            const btn1=document.getElementById('opt-btn-1'), btn2=document.getElementById('opt-btn-2');
            if(g4CorrectOptionIndex===0){btn1.innerText=g4CurrentTargetCount;btn2.innerText=wrongCount;}else{btn1.innerText=wrongCount;btn2.innerText=g4CurrentTargetCount;}
        }
        function startGame4(){ g4Initialized=true; g4CurrentThemeIndex=0; generateGame4(); }
        function nextGame4(){ g4CurrentThemeIndex=(g4CurrentThemeIndex+1)%g4Themes.length; generateGame4(); }
        function initGame4(){ nextGame4(); }

        function speakGame4Instruction() {
            speakText(`Conta quante figure ci sono e seleziona il numero corretto.`);
        }

        function checkCountChoice(chosenIndex) {
            if (chosenIndex === g4CorrectOptionIndex) {
                playSound('success');
                showModal("Esatto!", `Bravissimo! Ci sono proprio ${g4CurrentTargetCount} figure.`, "success", "Prossima scheda →", () => {
                    nextGame4();
                });
            } else {
                showModal("Contiamo insieme", "Prova a ricontare le figure una per una con calma.", "retry");
            }
        }

        // Avvio Applicazione
        window.onload = function() {
            loadPrefs();
            showMenu();
        };
