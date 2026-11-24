import { useState, useRef } from 'react'

const TEXTS = {
  en: {
    askLang: "Hello! I am VoiceBuddy, your friend. Please tell me your language. Bengali, English, Hindi?",
    welcomeLang: "Great! From now I will speak in English.",
    askName: "Please tell me your username, one letter at a time. For example, R, A, J. When done, say Done.",
    askPassword: "Now tell me your password. Five numbers, one by one. For example, 1, 2, 3, 4, 5.",
    home: "What do you want to do? Say Learn, Voice Quiz, Story, Homework, English, Parent Report, or Revision.",
    removed: "Okay, removed last one. Tell again."
  },
  bn: {
    askLang: "Hello! Ami VoiceBuddy, tomar bondhu. Tomar language bolo. Bengali, English, Hindi?",
    welcomeLang: "Thik ache! Ebar theke ami Banglay kotha bolbo.",
    askName: "Tomar username ta ekta ekta okkhor kore bolo. Jemon R, A, J. Ses hole bolo Hoye Geche.",
    askPassword: "Ebar tomar password bolo. 5 ta sonkha, ekta ekta kore bolo. Jemon 1, 2, 3, 4, 5.",
    home: "Ki korbe bolo? Sikhi, Voice Quiz, Golpo, Homework, English, Parent Report, na Revision?",
    removed: "Thik ache, ses ta kete dilam. Abar bolo."
  },
  hi: {
    askLang: "Hello! Main VoiceBuddy hoon, tumhara dost. Apni language batao. Bengali, English, Hindi?",
    welcomeLang: "Thik hai! Ab se main Hindi me baat karunga.",
    askName: "Apna username ek ek akshar karke bolo. Jaise R, A, J. Ho jaye to bolo Ho Gaya.",
    askPassword: "Ab apna password bolo. 5 number, ek ek karke bolo. Jaise 1, 2, 3, 4, 5.",
    home: "Kya karna hai bolo? Sikho, Voice Quiz, Kahani, Homework, English, Parent Report, ya Revision?",
    removed: "Thik hai, aakhri wala hata diya. Phir se bolo."
  }
}

const LETTER_MAP = {
  "a": "A", "ay": "A", "bee": "B", "be": "B", "cee": "C", "see": "C", "dee": "D", "d": "D",
  "e": "E", "ee": "E", "ef": "F", "f": "F", "gee": "G", "g": "G", "aitch": "H", "h": "H",
  "i": "I", "eye": "I", "jay": "J", "j": "J", "kay": "K", "k": "K", "el": "L", "l": "L",
  "em": "M", "m": "M", "en": "N", "n": "N", "o": "O", "oh": "O", "pee": "P", "p": "P",
  "cue": "Q", "q": "Q", "ar": "R", "r": "R", "ess": "S", "s": "S", "tee": "T", "t": "T",
  "u": "U", "you": "U", "vee": "V", "v": "V", "double u": "W", "w": "W", "ex": "X", "x": "X",
  "why": "Y", "y": "Y", "zee": "Z", "zed": "Z", "z": "Z"
}

const NUMBER_MAP = { "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "zero": "0", "ek": "1", "do": "2", "teen": "3", "char": "4", "paanch": "5" }

function App() {
  const [step, setStep] = useState("ready")
  const [displayText, setDisplayText] = useState("Click Start to begin VoiceBuddy")
  const [heardText, setHeardText] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [listening, setListening] = useState(false)
  const [waitingMic, setWaitingMic] = useState(false)
  const [started, setStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [totalQuiz, setTotalQuiz] = useState(0)
  const langRef = useRef("en")
  const userRef = useRef("")
  const passRef = useRef("")
  const scoreRef = useRef(0)
  const totalRef = useRef(0)
  const micResolverRef = useRef(null)

  const getLangCode = () => langRef.current === "bn" ? "bn-IN" : langRef.current === "hi" ? "hi-IN" : "en-IN"
  const L = () => TEXTS[langRef.current]
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  const speak = (msg) => {
    return new Promise((resolve) => {
      setDisplayText(msg)
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(msg)
      u.lang = getLangCode()
      u.onend = () => setTimeout(resolve, 400)
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
      setTimeout(resolve, 6000)
    })
  }

  // WHATSAPP STYLE - Mic button e click korle tobei sunbe
  const waitForMicClick = () => {
    return new Promise((resolve) => {
      setWaitingMic(true)
      setDisplayText("Mic button e click kore bolo...")
      micResolverRef.current = () => {
        setWaitingMic(false)
        resolve()
      }
    })
  }

  const onMicClick = () => {
    if (micResolverRef.current) {
      const fn = micResolverRef.current
      micResolverRef.current = null
      fn()
    }
  }

  const listenOnce = async () => {
    await waitForMicClick()
    return new Promise((resolve) => {
      let done = false
      const finish = (val) => {
        if (done) return
        done = true
        setListening(false)
        resolve(val)
      }
      const Rec = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!Rec) { finish(""); return }
      const rec = new Rec()
      rec.lang = getLangCode()
      rec.interimResults = false
      rec.continuous = false
      rec.onstart = () => setListening(true)
      rec.onend = () => finish("")
      rec.onerror = () => finish("")
      rec.onresult = (e) => {
        const txt = e.results[0][0].transcript
        setHeardText("You said: " + txt)
        finish(txt)
      }
      try { rec.start() } catch { finish("") }
      setTimeout(() => { try { rec.stop() } catch {} }, 8000)
    })
  }

  const parseLetter = (s) => {
    const clean = s.toLowerCase().trim()
    if (LETTER_MAP[clean]) return LETTER_MAP[clean]
    const words = clean.split(" ")
    for (let w of words) { if (LETTER_MAP[w]) return LETTER_MAP[w] }
    return clean.replace(/[^a-z]/g, "").toUpperCase().slice(-1)
  }

  const parseNumber = (s) => {
    const clean = s.toLowerCase().trim()
    if (NUMBER_MAP[clean]) return NUMBER_MAP[clean]
    let digit = clean.replace(/[^0-9]/g, "")
    if (digit) return digit[0]
    const words = clean.split(" ")
    for (let w of words) { if (NUMBER_MAP[w]) return NUMBER_MAP[w] }
    return ""
  }

  const say = async (bn, hi, en) => {
    const msg = langRef.current === "bn" ? bn : langRef.current === "hi" ? hi : en
    await speak(msg)
  }

  // 1. VOICE LEARN MODE
  const learnMode = async () => {
    await say("Ki sikhte chao bolo? Photosynthesis, Maths, na English?", "Kya sikhna hai bolo? Photosynthesis, Maths, ya English?", "What do you want to learn? Say Photosynthesis, Maths, or English?")
    const s = (await listenOnce()).toLowerCase()
    if (s.includes("photo")) await say("Photosynthesis mane gach rod theke khabar banay. Gach surjer alo, jol ar batas diye khabar banay. Bujhle?", "Photosynthesis matlab pedh dhoop se khana banata hai.", "Photosynthesis means plants make food from sunlight, water and air. Did you understand?")
    else if (s.includes("math")) await say("Maths mojar! Bolo, 12 ke 3 diye vag korle koto? 4 hobe. Karon 3 gun 4 soman 12.", "Maths mazedar hai! 12 ko 3 se bhag karne par 4 hoga.", "Maths is fun! 12 divided by 3 is 4, because 3 times 4 is 12.")
    else await say("Thik ache, eita niye pore sikhabo.", "Thik hai, iske baare me baad me sikhaunga.", "Okay, I will teach this later.")
  }

  // 2. VOICE QUIZ MODE
  const quizMode = async () => {
    await say("Voice Quiz suru! Prothom proshno. Jol er formula ki? Bolo H2O, na CO2?", "Voice Quiz shuru! Pehla sawal. Pani ka formula kya hai? H2O ya CO2?", "Voice Quiz started! First question. What is the formula of water? Say H2O or CO2?")
    totalRef.current += 1; setTotalQuiz(totalRef.current)
    let a1 = (await listenOnce()).toLowerCase()
    if (a1.includes("h2") || a1.includes("water") || a1.includes("h 2")) { scoreRef.current += 1; setScore(scoreRef.current); await say("Bravo! Ekdom thik!", "Bravo! Bilkul sahi!", "Bravo! Absolutely correct!") }
    else await say("Thik ta holo H2O.", "Sahi jawab H2O hai.", "Correct answer is H2O.")
    await say("Ditiyo proshno. 5 jog 3 koto? Bolo 8, na 9?", "Dusra sawal. 5 plus 3 kitna? 8 ya 9?", "Second question. 5 plus 3 is what? Say 8 or 9?")
    totalRef.current += 1; setTotalQuiz(totalRef.current)
    let a2 = await listenOnce()
    if (a2.includes("8") || a2.includes("eight")) { scoreRef.current += 1; setScore(scoreRef.current); await say("Darun! 8 ekdom thik!", "Shabash! 8 bilkul sahi!", "Great! 8 is absolutely correct!") }
    else await say("Thik ta holo 8.", "Sahi jawab 8 hai.", "Correct answer is 8.")
  }

  // 3. STORY MODE
  const storyMode = async () => {
    await say("Ekbar ek choto pakhi chilo. Se roj sokale gaan gaito. Sobai tar gaan sune khushi hoto. Kintu ekdin se gaan gaite bhule gelo. Tar bondhu ese bollo, bhoy peo na, abar chesta koro. Pakhi ta abar gaan gailo, ager cheyeo sundor. Golpo ses. Ebar bolo, pakhi ta roj kokhon gaan gaito?", "Ek baar ek chhoti chidiya thi. Wo roz subah gaana gaati thi.", "Once there was a little bird. She sang every morning. One day she forgot. Her friend said, dont fear, try again. She sang again, even more beautiful. Now tell me, when did the bird sing?")
    await listenOnce()
    await say("Thik bolecho! Sokale gaan gaito.", "Sahi bola! Subah gaati thi.", "Correct! She sang in the morning.")
  }

  // 4. HOMEWORK HELPER
  const homeworkMode = async () => {
    await say("Tomar homework ta mukhe bolo. Jemon, 12 ke 3 diye vag korle koto?", "Apna homework mukh se bolo.", "Tell me your homework. For example, what is 12 divided by 3?")
    let q = await listenOnce()
    await say("Bujhechi. Tumi bolle " + q + ". Cholo step by step kori. Prothom step, proshno ta ke choto kore vago. Ditiyo step, ek ek kore hisab koro. Ses step, uttor ta abar check koro.", "Samajh gaya. Chalo step by step karte hain.", "Got it. Lets do step by step.")
    await listenOnce()
    await say("Bah! Chesta korcho, etai sobcheye boro kotha.", "Wah! Koshish kar rahe ho.", "Wow! You are trying, that is the biggest thing.")
  }

  // 5. ENGLISH PRACTICE MODE
  const englishMode = async () => {
    await say("English Practice! Bolo, Ami school jacchi. Ami English e bolbo, tarpor tumi bolo.", "English Practice! Bolo, Main school ja raha hoon.", "English Practice! Say, I am going to school. I will say in English, then you repeat.")
    await listenOnce()
    await say("English e hobe - I am going to school. Ebar tumi bolo.", "English me hoga - I am going to school. Ab tum bolo.", "In English it is - I am going to school. Now you say it.")
    await listenOnce()
    await say("Khub sundor uccharon!", "Bahut sundar!", "Very good pronunciation!")
  }

  // 6. PARENT VOICE REPORT
  const parentMode = async () => {
    await say(`Parent Report. Aj ${userRef.current} ${totalRef.current} ta proshner moddhe ${scoreRef.current} ta pereche. Se khub bhalo chesta koreche.`, `Parent Report. Aaj ${userRef.current} ne ${totalRef.current} me se ${scoreRef.current} sahi kiya.`, `Parent Report. Today ${userRef.current} got ${scoreRef.current} correct out of ${totalRef.current} questions.`)
  }

  // 7. REVISION MODE
  const revisionMode = async () => {
    await say("Kal tumi Photosynthesis porechile, mone ache? Bolo, gach khabar banay kotha theke?", "Kal tumne Photosynthesis padha tha, yaad hai?", "Yesterday you learned Photosynthesis, do you remember? Tell me, where do plants make food from?")
    await listenOnce()
    await say("Thik ache, mone koriye di. Gach surjer alo theke khabar banay.", "Thik hai, yaad dila deta hoon. Pedh suraj ki roshni se khana banata hai.", "Okay, let me remind you. Plants make food from sunlight.")
  }

  const runFlow = async () => {
    setStep("language")
    await speak(TEXTS.en.askLang)
    let heard = (await listenOnce()).toLowerCase()
    if (heard.includes("bengali") || heard.includes("bangla")) langRef.current = "bn"
    else if (heard.includes("hindi")) langRef.current = "hi"
    else langRef.current = "en"
    await speak(L().welcomeLang)

    setStep("username")
    await speak(L().askName)
    userRef.current = ""
    while (true) {
      let s = (await listenOnce()).toLowerCase().trim()
      if (!s) continue
      if (s.includes("hoye geche") || s.includes("done") || s.includes("ho gaya") || s.includes("hogaya")) break
      if (s.includes("cut") || s.includes("kato")) {
        userRef.current = userRef.current.slice(0, -1)
        setUsername(userRef.current)
        await speak(L().removed)
        continue
      }
      let letter = parseLetter(s)
      if (letter) { userRef.current += letter; setUsername(userRef.current); await speak("Got it, " + letter) }
    }

    setStep("password")
    await speak(L().askPassword)
    passRef.current = ""
    while (passRef.current.length < 5) {
      let s = (await listenOnce()).toLowerCase().trim()
      if (!s) continue
      if (s.includes("cut") || s.includes("kato")) {
        passRef.current = passRef.current.slice(0, -1)
        setPassword("•".repeat(passRef.current.length))
        await speak(L().removed)
        continue
      }
      let num = parseNumber(s)
      if (num) { passRef.current += num; setPassword("•".repeat(passRef.current.length)); await speak("Got it, " + num) }
    }

    setStep("home")
    await speak(`Welcome ${userRef.current}! ${L().home}`)

    while (true) {
      let s = (await listenOnce()).toLowerCase()
      if (s.includes("quiz")) { setStep("Voice Quiz Mode"); await quizMode() }
      else if (s.includes("golpo") || s.includes("story") || s.includes("kahani")) { setStep("Story Mode"); await storyMode() }
      else if (s.includes("homework")) { setStep("Homework Helper"); await homeworkMode() }
      else if (s.includes("english")) { setStep("English Practice Mode"); await englishMode() }
      else if (s.includes("parent")) { setStep("Parent Voice Report"); await parentMode() }
      else if (s.includes("revision")) { setStep("Revision Mode"); await revisionMode() }
      else if (s.includes("sikhi") || s.includes("sikho") || s.includes("learn")) { setStep("Voice Learn Mode"); await learnMode() }
      else if (s) await say("Bujhte parlam na. Abar bolo - Sikhi, Voice Quiz, Golpo, Homework, English, Parent Report, na Revision?", "Samajh nahi aaya. Phir bolo.", "I did not understand. Say again.")
      await speak(L().home)
      setStep("home")
    }
  }

  const startApp = () => {
    if (started) return
    setStarted(true)
    setStep("language")
    runFlow()
  }

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎤 VoiceBuddy</h1>
      <p>India Runs on Voice | WhatsApp Style Voice</p>
      <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '10px' }}>
        <b>Mode:</b> {step} | {listening ? "🔴 Listening..." : waitingMic ? "🎤 Mic e Click Koro" : "🔊 Speaking..."} | Score: {score}/{totalQuiz}
      </div>
      <div style={{ background: '#f0f0ff', padding: '20px', borderRadius: '15px', minHeight: '100px', fontSize: '22px', marginTop: '15px' }}>{displayText}</div>
      <div style={{ background: '#fef9c3', padding: '10px', borderRadius: '10px', marginTop: '10px', fontSize: '16px' }}>{heardText || "Ami ja sunbo ekhane dekhabe"}</div>
      <div style={{ marginTop: '15px', fontSize: '20px' }}><b>Username:</b> {username || "___"} <br /><b>Password:</b> {password || "_____"}</div>

      {/* WHATSAPP STYLE MIC BUTTON */}
      {started && (
        <button onClick={onMicClick} style={{ width: '110px', height: '110px', borderRadius: '50%', fontSize: '50px', border: 'none', background: waitingMic ? '#22c55e' : listening ? '#ef4444' : '#9ca3af', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          🎤
        </button>
      )}
      {started && <p style={{ fontSize: '16px', fontWeight: 'bold' }}>{waitingMic ? "👆 Ebar Mic e click kore bolo" : listening ? "🔴 Sunchi... bolo" : "App bolche, ektu wait koro..."}</p>}

      <div style={{ marginTop: '15px', fontSize: '14px', textAlign: 'left', background: '#f9fafb', padding: '12px', borderRadius: '10px' }}>
        <b>7 Features:</b><br />1. Voice Learn Mode<br />2. Voice Quiz Mode<br />3. Story Mode<br />4. Homework Helper<br />5. English Practice Mode<br />6. Parent Voice Report<br />7. Revision Mode
      </div>
      {!started && (
        <button onClick={startApp} style={{ marginTop: '20px', padding: '15px 25px', fontSize: '18px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
          ▶️ Start VoiceBuddy
        </button>
      )}
    </div>
  )
}

export default App