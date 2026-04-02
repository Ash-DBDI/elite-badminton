// THE SMASHER — overhead smash, cape, lightning bolt
function Smasher() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Cape */}
      <path d="M70 75 Q55 110 50 160 L85 130 Q80 100 78 80Z" fill="#0d3d24" opacity="0.8"/>
      <path d="M130 75 Q145 110 150 160 L115 130 Q120 100 122 80Z" fill="#0d3d24" opacity="0.8"/>
      {/* Body */}
      <rect x="80" y="70" width="40" height="50" rx="4" fill="#c9a84c"/>
      {/* Lightning bolt on chest */}
      <polygon points="96,78 102,78 98,90 105,90 93,108 97,95 90,95" fill="#0a0a0a"/>
      {/* Head */}
      <circle cx="100" cy="55" r="18" fill="#c9a84c"/>
      <rect x="88" y="46" width="24" height="6" rx="3" fill="#0a0a0a" opacity="0.7"/>
      {/* Raised arm + racket */}
      <rect x="118" y="40" width="10" height="40" rx="4" fill="#c9a84c" transform="rotate(20 123 60)"/>
      <ellipse cx="135" cy="28" rx="10" ry="14" fill="none" stroke="#c9a84c" strokeWidth="2.5" transform="rotate(20 135 28)"/>
      {/* Other arm */}
      <rect x="68" y="78" width="10" height="30" rx="4" fill="#c9a84c" transform="rotate(-20 73 93)"/>
      {/* Legs */}
      <rect x="83" y="118" width="14" height="40" rx="4" fill="#c9a84c"/>
      <rect x="103" y="118" width="14" height="40" rx="4" fill="#c9a84c"/>
      {/* Energy lines */}
      <line x1="145" y1="15" x2="160" y2="8" stroke="#c9a84c" strokeWidth="2" opacity="0.5"/>
      <line x1="150" y1="25" x2="168" y2="20" stroke="#c9a84c" strokeWidth="1.5" opacity="0.4"/>
      <line x1="140" y1="10" x2="155" y2="2" stroke="#c9a84c" strokeWidth="1" opacity="0.3"/>
      {/* Name */}
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE SMASHER</text>
    </svg>
  )
}

// THE GUARDIAN — defensive wide stance, shield energy
function Guardian() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Shield energy */}
      <ellipse cx="100" cy="95" rx="55" ry="45" fill="none" stroke="#0d3d24" strokeWidth="3" opacity="0.5"/>
      <ellipse cx="100" cy="95" rx="65" ry="52" fill="none" stroke="#0d3d24" strokeWidth="1.5" opacity="0.3"/>
      {/* Head */}
      <circle cx="100" cy="48" r="17" fill="#c9a84c"/>
      <rect x="86" y="40" width="28" height="5" rx="2.5" fill="#0a0a0a" opacity="0.7"/>
      {/* Body — wide stance */}
      <path d="M82 65 L78 115 L122 115 L118 65Z" fill="#c9a84c"/>
      {/* Shield emblem on chest */}
      <path d="M95 75 L95 92 Q100 97 105 92 L105 75Z" fill="#0d3d24"/>
      {/* Arms spread wide */}
      <rect x="40" y="72" width="42" height="11" rx="5" fill="#c9a84c"/>
      <rect x="118" y="72" width="42" height="11" rx="5" fill="#c9a84c"/>
      {/* Fists */}
      <circle cx="38" cy="77" r="8" fill="#c9a84c"/>
      <circle cx="162" cy="77" r="8" fill="#c9a84c"/>
      {/* Wide legs */}
      <rect x="72" y="113" width="16" height="42" rx="5" fill="#c9a84c" transform="rotate(-10 80 134)"/>
      <rect x="112" y="113" width="16" height="42" rx="5" fill="#c9a84c" transform="rotate(10 120 134)"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE GUARDIAN</text>
    </svg>
  )
}

// THE PHANTOM — mysterious figure at net, speed lines
function Phantom() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0d1a0d"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Net */}
      <line x1="0" y1="130" x2="200" y2="130" stroke="#c9a84c" strokeWidth="1.5" opacity="0.2"/>
      {/* Speed lines */}
      <line x1="20" y1="50" x2="55" y2="55" stroke="#c9a84c" strokeWidth="1" opacity="0.3"/>
      <line x1="15" y1="65" x2="50" y2="68" stroke="#c9a84c" strokeWidth="1.5" opacity="0.25"/>
      <line x1="25" y1="80" x2="55" y2="82" stroke="#c9a84c" strokeWidth="1" opacity="0.2"/>
      {/* Head with mask */}
      <circle cx="95" cy="52" r="18" fill="#c9a84c"/>
      <path d="M80 46 L110 46 L108 56 L82 56Z" fill="#0d1a0d"/>
      <circle cx="88" cy="50" r="2" fill="#c9a84c"/>
      <circle cx="102" cy="50" r="2" fill="#c9a84c"/>
      {/* Ghostly body */}
      <path d="M78 70 L75 128 L125 128 L122 70Z" fill="#c9a84c" opacity="0.85"/>
      {/* Reaching arm up at net */}
      <rect x="120" y="38" width="10" height="45" rx="4" fill="#c9a84c" transform="rotate(15 125 60)"/>
      <circle cx="135" cy="35" r="6" fill="#c9a84c"/>
      {/* Other arm */}
      <rect x="62" y="80" width="10" height="30" rx="4" fill="#c9a84c" transform="rotate(-15 67 95)"/>
      {/* Ghost trail */}
      <path d="M75 128 Q70 145 60 155 L85 145 Q80 140 78 128Z" fill="#c9a84c" opacity="0.3"/>
      <path d="M125 128 Q130 145 140 155 L115 145 Q120 140 122 128Z" fill="#c9a84c" opacity="0.3"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE PHANTOM</text>
    </svg>
  )
}

// THE ACE — serving with starburst
function Ace() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Starburst behind */}
      {[0,45,90,135,180,225,270,315].map(a => <line key={a} x1="100" y1="55" x2={100 + 50 * Math.cos(a * Math.PI/180)} y2={55 + 50 * Math.sin(a * Math.PI/180)} stroke="#c9a84c" strokeWidth="1" opacity="0.15"/>)}
      {/* Head */}
      <circle cx="100" cy="55" r="17" fill="#c9a84c"/>
      <rect x="88" y="48" width="24" height="5" rx="2.5" fill="#0a0a0a" opacity="0.6"/>
      {/* Body */}
      <rect x="82" y="72" width="36" height="48" rx="4" fill="#c9a84c"/>
      {/* Star on chest */}
      <polygon points="100,78 102,84 108,84 103,88 105,94 100,90 95,94 97,88 92,84 98,84" fill="#0a0a0a" opacity="0.6"/>
      {/* Toss arm raised */}
      <rect x="70" y="52" width="10" height="35" rx="4" fill="#c9a84c" transform="rotate(-30 75 70)"/>
      {/* Shuttle above toss hand */}
      <ellipse cx="58" cy="38" rx="5" ry="4" fill="white" opacity="0.8"/>
      <path d="M54 35 Q58 26 62 35" fill="none" stroke="white" strokeWidth="1" opacity="0.6"/>
      {/* Racket arm cocked */}
      <rect x="118" y="65" width="10" height="35" rx="4" fill="#c9a84c" transform="rotate(30 123 82)"/>
      <ellipse cx="140" cy="55" rx="9" ry="12" fill="none" stroke="#c9a84c" strokeWidth="2" transform="rotate(30 140 55)"/>
      {/* Legs */}
      <rect x="85" y="118" width="13" height="38" rx="4" fill="#c9a84c"/>
      <rect x="102" y="118" width="13" height="38" rx="4" fill="#c9a84c"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE ACE</text>
    </svg>
  )
}

// THE BLADE — backhand with energy blade
function Blade() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Energy blade trail */}
      <path d="M30 60 Q50 45 55 55 Q48 50 35 62Z" fill="#c9a84c" opacity="0.3"/>
      <path d="M25 55 Q45 38 52 50 Q42 42 30 58Z" fill="#c9a84c" opacity="0.2"/>
      {/* Head */}
      <circle cx="105" cy="52" r="17" fill="#c9a84c"/>
      <path d="M92 45 L118 45 L116 52 L94 52Z" fill="#0a0a0a" opacity="0.6"/>
      {/* Body twisted */}
      <path d="M88 70 L85 118 L125 118 L122 70Z" fill="#c9a84c"/>
      {/* Blade emblem */}
      <path d="M100 80 L108 95 L100 110 L92 95Z" fill="#0a0a0a" opacity="0.4"/>
      {/* Backhand arm with racket */}
      <rect x="55" y="60" width="35" height="10" rx="4" fill="#c9a84c" transform="rotate(-10 72 65)"/>
      <ellipse cx="45" cy="55" rx="10" ry="13" fill="none" stroke="#c9a84c" strokeWidth="2.5" transform="rotate(-10 45 55)"/>
      {/* Energy glow on racket */}
      <ellipse cx="45" cy="55" rx="14" ry="17" fill="none" stroke="#c9a84c" strokeWidth="1" opacity="0.3" transform="rotate(-10 45 55)"/>
      {/* Other arm */}
      <rect x="120" y="75" width="10" height="28" rx="4" fill="#c9a84c" transform="rotate(15 125 89)"/>
      {/* Legs */}
      <rect x="85" y="116" width="14" height="40" rx="5" fill="#c9a84c" transform="rotate(-5 92 136)"/>
      <rect x="105" y="116" width="14" height="40" rx="5" fill="#c9a84c" transform="rotate(8 112 136)"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE BLADE</text>
    </svg>
  )
}

// THE FALCON — airborne jump smash, wings
function Falcon() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Wing shapes */}
      <path d="M70 65 Q30 55 20 75 Q40 70 65 80Z" fill="#0d3d24" opacity="0.7"/>
      <path d="M130 65 Q170 55 180 75 Q160 70 135 80Z" fill="#0d3d24" opacity="0.7"/>
      {/* Head */}
      <circle cx="100" cy="45" r="16" fill="#c9a84c"/>
      <path d="M88 38 L112 38 L110 45 L90 45Z" fill="#0a0a0a" opacity="0.6"/>
      {/* Body */}
      <rect x="84" y="60" width="32" height="42" rx="4" fill="#c9a84c"/>
      {/* Falcon emblem */}
      <path d="M100 68 L106 78 L100 88 L94 78Z" fill="#0d3d24"/>
      {/* Arms spread */}
      <rect x="42" y="58" width="42" height="10" rx="4" fill="#c9a84c" transform="rotate(-15 63 63)"/>
      <rect x="116" y="58" width="42" height="10" rx="4" fill="#c9a84c" transform="rotate(15 137 63)"/>
      {/* Racket */}
      <ellipse cx="165" cy="48" rx="10" ry="13" fill="none" stroke="#c9a84c" strokeWidth="2" transform="rotate(15 165 48)"/>
      {/* Legs tucked */}
      <rect x="86" y="100" width="12" height="35" rx="4" fill="#c9a84c" transform="rotate(15 92 118)"/>
      <rect x="102" y="100" width="12" height="35" rx="4" fill="#c9a84c" transform="rotate(-15 108 118)"/>
      {/* Shuttle trail */}
      <circle cx="170" cy="30" r="4" fill="white" opacity="0.6"/>
      <line x1="170" y1="30" x2="185" y2="22" stroke="white" strokeWidth="1" opacity="0.3"/>
      <line x1="170" y1="30" x2="180" y2="18" stroke="white" strokeWidth="1" opacity="0.3"/>
      {/* Air gap line */}
      <line x1="60" y1="148" x2="140" y2="148" stroke="#c9a84c" strokeWidth="1" opacity="0.15" strokeDasharray="4 4"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE FALCON</text>
    </svg>
  )
}

// THE TITAN — massive power stance
function Titan() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Head */}
      <circle cx="100" cy="42" r="20" fill="#c9a84c"/>
      <rect x="85" y="34" width="30" height="7" rx="3" fill="#0a0a0a" opacity="0.6"/>
      {/* Massive body */}
      <path d="M72 62 L68 120 L132 120 L128 62Z" fill="#c9a84c"/>
      {/* Chest detail */}
      <line x1="100" y1="68" x2="100" y2="115" stroke="#0a0a0a" strokeWidth="2" opacity="0.3"/>
      <line x1="80" y1="80" x2="120" y2="80" stroke="#0a0a0a" strokeWidth="1.5" opacity="0.2"/>
      {/* Thick arms */}
      <rect x="40" y="65" width="32" height="14" rx="6" fill="#c9a84c"/>
      <rect x="128" y="65" width="32" height="14" rx="6" fill="#c9a84c"/>
      {/* Fists */}
      <circle cx="38" cy="72" r="10" fill="#c9a84c"/>
      <circle cx="162" cy="72" r="10" fill="#c9a84c"/>
      {/* Wide legs */}
      <rect x="68" y="118" width="18" height="42" rx="6" fill="#c9a84c" transform="rotate(-8 77 139)"/>
      <rect x="114" y="118" width="18" height="42" rx="6" fill="#c9a84c" transform="rotate(8 123 139)"/>
      {/* Power cracks */}
      <line x1="35" y1="155" x2="25" y2="165" stroke="#c9a84c" strokeWidth="2" opacity="0.3"/>
      <line x1="165" y1="155" x2="175" y2="165" stroke="#c9a84c" strokeWidth="2" opacity="0.3"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE TITAN</text>
    </svg>
  )
}

// THE SWIFT — sprinting, extreme lean, speed lines
function Swift() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Speed lines */}
      <line x1="10" y1="60" x2="50" y2="62" stroke="#c9a84c" strokeWidth="2" opacity="0.25"/>
      <line x1="15" y1="75" x2="55" y2="76" stroke="#c9a84c" strokeWidth="1.5" opacity="0.2"/>
      <line x1="8" y1="90" x2="48" y2="90" stroke="#c9a84c" strokeWidth="2" opacity="0.3"/>
      <line x1="12" y1="105" x2="52" y2="104" stroke="#c9a84c" strokeWidth="1.5" opacity="0.2"/>
      <line x1="18" y1="118" x2="55" y2="116" stroke="#c9a84c" strokeWidth="1" opacity="0.15"/>
      {/* Head leaning forward */}
      <circle cx="120" cy="50" r="16" fill="#c9a84c"/>
      <path d="M108 44 L132 44 L130 50 L110 50Z" fill="#0a0a0a" opacity="0.6"/>
      {/* Body at extreme lean */}
      <path d="M95 65 L80 120 L115 120 L118 65Z" fill="#c9a84c" transform="rotate(15 100 92)"/>
      {/* Lightning on chest */}
      <polygon points="105,75 108,82 112,82 106,92" fill="#0a0a0a" opacity="0.4" transform="rotate(15 108 83)"/>
      {/* Arms pumping */}
      <rect x="125" y="60" width="8" height="30" rx="3" fill="#c9a84c" transform="rotate(40 129 75)"/>
      <rect x="70" y="75" width="8" height="30" rx="3" fill="#c9a84c" transform="rotate(-20 74 90)"/>
      {/* Legs in sprint */}
      <rect x="75" y="118" width="12" height="38" rx="4" fill="#c9a84c" transform="rotate(-25 81 137)"/>
      <rect x="108" y="118" width="12" height="38" rx="4" fill="#c9a84c" transform="rotate(20 114 137)"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE SWIFT</text>
    </svg>
  )
}

// THE ORACLE — meditative, wisdom energy
function Oracle() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0d1a0d"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Wisdom energy rings */}
      <circle cx="100" cy="85" r="40" fill="none" stroke="#c9a84c" strokeWidth="0.8" opacity="0.15"/>
      <circle cx="100" cy="85" r="52" fill="none" stroke="#c9a84c" strokeWidth="0.6" opacity="0.1"/>
      <circle cx="100" cy="85" r="64" fill="none" stroke="#c9a84c" strokeWidth="0.5" opacity="0.08"/>
      {/* Head with third eye */}
      <circle cx="100" cy="48" r="17" fill="#c9a84c"/>
      <line x1="88" y1="45" x2="112" y2="45" stroke="#0d1a0d" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="100" cy="38" r="3" fill="#0d3d24" stroke="#c9a84c" strokeWidth="0.8"/>
      {/* Seated body */}
      <path d="M82 65 L78 110 L122 110 L118 65Z" fill="#c9a84c"/>
      {/* Racket held vertical */}
      <rect x="97" y="22" width="6" height="45" rx="2" fill="#c9a84c"/>
      <ellipse cx="100" cy="15" rx="8" ry="10" fill="none" stroke="#c9a84c" strokeWidth="1.8"/>
      {/* Crossed legs */}
      <path d="M78 108 Q72 130 65 135 L80 140 Q85 130 86 115Z" fill="#c9a84c"/>
      <path d="M122 108 Q128 130 135 135 L120 140 Q115 130 114 115Z" fill="#c9a84c"/>
      {/* Hands on knees */}
      <circle cx="72" cy="115" r="6" fill="#c9a84c"/>
      <circle cx="128" cy="115" r="6" fill="#c9a84c"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE ORACLE</text>
    </svg>
  )
}

// THE ROOKIE — young eager, fists pumped, star badge
function Rookie() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Sparkles around */}
      <circle cx="45" cy="40" r="2" fill="#c9a84c" opacity="0.5"/>
      <circle cx="155" cy="35" r="2.5" fill="#c9a84c" opacity="0.4"/>
      <circle cx="35" cy="70" r="1.5" fill="#c9a84c" opacity="0.3"/>
      <circle cx="165" cy="65" r="2" fill="#c9a84c" opacity="0.4"/>
      {/* Head */}
      <circle cx="100" cy="50" r="17" fill="#c9a84c"/>
      <rect x="88" y="43" width="24" height="5" rx="2.5" fill="#0a0a0a" opacity="0.5"/>
      {/* Open mouth grin */}
      <path d="M93 55 Q100 62 107 55" fill="none" stroke="#0a0a0a" strokeWidth="2" opacity="0.5"/>
      {/* Body */}
      <rect x="82" y="67" width="36" height="48" rx="4" fill="#c9a84c"/>
      {/* Star badge */}
      <polygon points="100,74 102,80 108,80 103,84 105,90 100,86 95,90 97,84 92,80 98,80" fill="white" opacity="0.8"/>
      {/* Fists pumped up */}
      <rect x="62" y="50" width="10" height="30" rx="4" fill="#c9a84c" transform="rotate(-30 67 65)"/>
      <circle cx="55" cy="42" r="7" fill="#c9a84c"/>
      <rect x="128" y="50" width="10" height="30" rx="4" fill="#c9a84c" transform="rotate(30 133 65)"/>
      <circle cx="145" cy="42" r="7" fill="#c9a84c"/>
      {/* Legs */}
      <rect x="84" y="113" width="13" height="40" rx="4" fill="#c9a84c"/>
      <rect x="103" y="113" width="13" height="40" rx="4" fill="#c9a84c"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE ROOKIE</text>
    </svg>
  )
}

// THE VETERAN — noble stance, stars on shoulder
function Veteran() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Head */}
      <circle cx="100" cy="45" r="18" fill="#c9a84c"/>
      <rect x="86" y="38" width="28" height="6" rx="3" fill="#0a0a0a" opacity="0.6"/>
      {/* Distinguished lines */}
      <line x1="86" y1="32" x2="92" y2="30" stroke="white" strokeWidth="1" opacity="0.3"/>
      <line x1="108" y1="32" x2="114" y2="30" stroke="white" strokeWidth="1" opacity="0.3"/>
      {/* Body — upright noble */}
      <rect x="80" y="63" width="40" height="55" rx="4" fill="#c9a84c"/>
      {/* Shoulder stars */}
      <polygon points="78,68 80,72 84,72 81,75 82,79 78,76 74,79 75,75 72,72 76,72" fill="white" opacity="0.7"/>
      <polygon points="122,68 124,72 128,72 125,75 126,79 122,76 118,79 119,75 116,72 120,72" fill="white" opacity="0.7"/>
      {/* Medal on chest */}
      <circle cx="100" cy="82" r="6" fill="#0d3d24" stroke="#c9a84c" strokeWidth="1"/>
      <rect x="97" y="72" width="6" height="6" fill="#c9a84c" opacity="0.6"/>
      {/* Salute arm */}
      <rect x="120" y="55" width="10" height="35" rx="4" fill="#c9a84c" transform="rotate(10 125 72)"/>
      <rect x="128" y="42" width="8" height="20" rx="3" fill="#c9a84c" transform="rotate(-5 132 52)"/>
      {/* Other arm at side */}
      <rect x="68" y="70" width="10" height="35" rx="4" fill="#c9a84c" transform="rotate(-5 73 87)"/>
      {/* Legs */}
      <rect x="83" y="116" width="14" height="42" rx="5" fill="#c9a84c"/>
      <rect x="103" y="116" width="14" height="42" rx="5" fill="#c9a84c"/>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE VETERAN</text>
    </svg>
  )
}

// THE CHAMPION — on podium, trophy, crown, confetti
function Champion() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="100" fill="#0a0a0a"/>
      <circle cx="100" cy="100" r="96" fill="none" stroke="#c9a84c" strokeWidth="2" opacity="0.6"/>
      {/* Confetti */}
      <rect x="30" y="25" width="4" height="8" rx="1" fill="#c9a84c" opacity="0.5" transform="rotate(30 32 29)"/>
      <rect x="160" y="30" width="4" height="8" rx="1" fill="#0d3d24" opacity="0.6" transform="rotate(-20 162 34)"/>
      <rect x="50" y="15" width="3" height="7" rx="1" fill="white" opacity="0.3" transform="rotate(45 51 18)"/>
      <rect x="145" y="18" width="3" height="7" rx="1" fill="#c9a84c" opacity="0.4" transform="rotate(-35 146 21)"/>
      <rect x="40" y="40" width="3" height="6" rx="1" fill="#c9a84c" opacity="0.3" transform="rotate(60 41 43)"/>
      <rect x="158" y="48" width="3" height="6" rx="1" fill="white" opacity="0.3" transform="rotate(-50 159 51)"/>
      {/* Crown */}
      <path d="M90 18 L95 28 L100 22 L105 28 L110 18 L108 30 L92 30Z" fill="#c9a84c"/>
      {/* Head */}
      <circle cx="100" cy="42" r="16" fill="#c9a84c"/>
      <rect x="88" y="36" width="24" height="5" rx="2.5" fill="#0a0a0a" opacity="0.5"/>
      {/* Body */}
      <rect x="82" y="58" width="36" height="42" rx="4" fill="#c9a84c"/>
      {/* Trophy in left hand */}
      <rect x="55" y="50" width="10" height="30" rx="4" fill="#c9a84c" transform="rotate(-25 60 65)"/>
      <path d="M40 35 L40 52 Q40 58 48 58 L48 62 L44 62 L44 65 L56 65 L56 62 L52 62 L52 58 Q60 58 60 52 L60 35Z" fill="#c9a84c"/>
      {/* Racket in right hand raised */}
      <rect x="120" y="40" width="10" height="35" rx="4" fill="#c9a84c" transform="rotate(20 125 57)"/>
      <ellipse cx="140" cy="28" rx="10" ry="13" fill="none" stroke="#c9a84c" strokeWidth="2" transform="rotate(20 140 28)"/>
      {/* Podium */}
      <rect x="70" y="100" width="60" height="55" rx="4" fill="#0d3d24"/>
      <text x="100" y="122" textAnchor="middle" fill="#c9a84c" fontSize="18" fontWeight="700" fontFamily="serif">1</text>
      <text x="100" y="185" textAnchor="middle" fill="#c9a84c" fontSize="8" fontFamily="sans-serif" fontWeight="600" letterSpacing="1.5" opacity="0.7">THE CHAMPION</text>
    </svg>
  )
}

export const AVATARS = [
  { id: 1, name: 'The Smasher', Component: Smasher },
  { id: 2, name: 'The Guardian', Component: Guardian },
  { id: 3, name: 'The Phantom', Component: Phantom },
  { id: 4, name: 'The Ace', Component: Ace },
  { id: 5, name: 'The Blade', Component: Blade },
  { id: 6, name: 'The Falcon', Component: Falcon },
  { id: 7, name: 'The Titan', Component: Titan },
  { id: 8, name: 'The Swift', Component: Swift },
  { id: 9, name: 'The Oracle', Component: Oracle },
  { id: 10, name: 'The Rookie', Component: Rookie },
  { id: 11, name: 'The Veteran', Component: Veteran },
  { id: 12, name: 'The Champion', Component: Champion },
]
