const https = require('https')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

function getEnv(key) {
  const line = envLines.find(l => l.startsWith(key + '='))
  return line ? line.split('=').slice(1).join('=').trim() : null
}

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL')
const SUPABASE_KEY = getEnv('VITE_SUPABASE_ANON_KEY')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Could not read .env file.')
  process.exit(1)
}

console.log('Connected to:', SUPABASE_URL)

function apiCall(table, method, body = null) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`)
    if (method === 'DELETE' || method === 'PATCH') {
      url.searchParams.set('id', 'neq.00000000-0000-0000-0000-000000000000')
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    }

    const bodyStr = body ? JSON.stringify(body) : null
    if (bodyStr) options.headers['Content-Length'] = Buffer.byteLength(bodyStr)

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`  OK  ${method} ${table} (${res.statusCode})`)
        } else {
          console.error(`  FAIL ${method} ${table} (${res.statusCode}): ${data}`)
        }
        resolve()
      })
    })

    req.on('error', err => { console.error(`  ERR ${table}:`, err.message); resolve() })
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

async function clearData() {
  console.log('\nClearing all test data from Supabase...\n')

  await apiCall('badges', 'DELETE')
  await apiCall('games', 'DELETE')
  await apiCall('session_players', 'DELETE')
  await apiCall('sessions', 'DELETE')

  await apiCall('players', 'PATCH', {
    skill_rating: 1000,
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    total_points_scored: 0,
    total_points_conceded: 0,
    current_streak: 0,
    best_streak: 0
  })

  console.log('\nDONE! All test data cleared. Players kept. Ready for real games.')
}

clearData()
