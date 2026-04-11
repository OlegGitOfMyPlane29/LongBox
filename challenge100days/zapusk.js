const { spawnSync, spawn } = require('child_process')
const { existsSync, rmSync, readFileSync } = require('fs')
const http = require('http')
const path = require('path')

const projectRoot = __dirname
const backendDir = path.join(projectRoot, 'backend')
const frontendDir = path.join(projectRoot, 'frontend')
const venvDir = path.join(projectRoot, '.venv')
const pythonVenvPath = path.join(venvDir, 'Scripts', 'python.exe')
const sqliteDbPath = path.join(backendDir, 'challenge100days.db')
const sqliteUrl = `sqlite:///${sqliteDbPath.replace(/\\/g, '/')}`

const isCheckMode = process.argv.includes('--check')
let runtimeDatabaseUrl = ''

const toCommandLine = (command, args = []) =>
  [command, ...args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg))].join(' ')

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(toCommandLine(command, args), {
    cwd: options.cwd || projectRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...(options.env || {}) },
  })
  if (result.status !== 0) {
    throw new Error(`Команда завершилась с ошибкой: ${command} ${args.join(' ')}`)
  }
}

const commandSucceeds = (command, args, cwd = projectRoot) => {
  const result = spawnSync(toCommandLine(command, args), {
    cwd,
    stdio: 'ignore',
    shell: true,
    env: process.env,
  })
  return result.status === 0
}

const checkCommand = (command) => {
  const result = spawnSync(toCommandLine(command, ['--version']), { stdio: 'ignore', shell: true })
  return result.status === 0
}

const startDetachedWindow = (title, cmd) => {
  const command = `start "${title}" cmd /k "${cmd}"`
  spawn(command, {
    cwd: projectRoot,
    shell: true,
    detached: true,
    stdio: 'ignore',
  }).unref()
}

const openBrowser = () => {
  spawn('start "" "http://localhost:5173"', {
    cwd: projectRoot,
    shell: true,
    detached: true,
    stdio: 'ignore',
  }).unref()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const pingFrontend = () =>
  new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:5173', (response) => {
      response.resume()
      resolve(response.statusCode >= 200 && response.statusCode < 500)
    })
    request.on('error', () => resolve(false))
    request.setTimeout(1500, () => {
      request.destroy()
      resolve(false)
    })
  })

const waitForFrontendReady = async (attempts = 40, intervalMs = 1500) => {
  for (let i = 0; i < attempts; i += 1) {
    if (await pingFrontend()) {
      return true
    }
    await sleep(intervalMs)
  }
  return false
}

const readEnvDatabaseUrl = () => {
  const envFile = path.join(projectRoot, '.env')
  if (!existsSync(envFile)) return ''

  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    if (!trimmed.startsWith('DATABASE_URL=')) continue
    return trimmed.slice('DATABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '')
  }
  return ''
}

const looksLikePostgres = (url) => /^postgres(ql)?(\+\w+)?\:\/\//i.test(url)

const ensureVenvAndPip = () => {
  if (!existsSync(venvDir)) {
    runCommand('python', ['-m', 'venv', '.venv'])
  }

  if (!commandSucceeds(pythonVenvPath, ['-m', 'pip', '--version'])) {
    console.log('Восстанавливаю pip в .venv через ensurepip...')
    runCommand(pythonVenvPath, ['-m', 'ensurepip', '--upgrade'], { cwd: projectRoot })
  }

  if (!commandSucceeds(pythonVenvPath, ['-m', 'pip', '--version'])) {
    console.log('pip в .venv поврежден. Пересоздаю .venv...')
    rmSync(venvDir, { recursive: true, force: true })
    runCommand('python', ['-m', 'venv', '.venv'])
    runCommand(pythonVenvPath, ['-m', 'ensurepip', '--upgrade'], { cwd: projectRoot })
  }

  runCommand(pythonVenvPath, ['-m', 'pip', 'install', '--upgrade', 'pip', 'setuptools', 'wheel'], {
    cwd: projectRoot,
  })
}

const runMigrationsWithFallback = () => {
  const envDatabaseUrl = readEnvDatabaseUrl()
  runtimeDatabaseUrl =
    envDatabaseUrl || process.env.DATABASE_URL || 'postgresql+psycopg2://postgres:postgres@localhost:5432/challenge100days'

  try {
    runCommand(pythonVenvPath, ['-m', 'alembic', 'upgrade', 'head'], {
      cwd: backendDir,
      env: { DATABASE_URL: runtimeDatabaseUrl },
    })
    return
  } catch (error) {
    if (!looksLikePostgres(runtimeDatabaseUrl)) {
      throw error
    }
    console.log('PostgreSQL недоступен. Переключаюсь на локальную SQLite базу для быстрого запуска...')
    runtimeDatabaseUrl = sqliteUrl
    runCommand(pythonVenvPath, ['-m', 'alembic', 'upgrade', 'head'], {
      cwd: backendDir,
      env: { DATABASE_URL: runtimeDatabaseUrl },
    })
    console.log(`SQLite активирована: ${sqliteDbPath}`)
  }
}

const main = async () => {
  console.log('Проверяю окружение...')
  if (!checkCommand('node')) {
    throw new Error('Node.js не найден. Установите Node.js и повторите запуск.')
  }
  if (!checkCommand('npm')) {
    throw new Error('npm не найден. Установите Node.js LTS и повторите запуск.')
  }
  if (!checkCommand('python')) {
    throw new Error('Python не найден. Установите Python 3.10+ и повторите запуск.')
  }

  console.log('Готовлю Python-окружение...')
  ensureVenvAndPip()

  if (isCheckMode) {
    console.log('Режим проверки: Node.js/npm/Python и .venv/pip в порядке.')
    console.log('Можно запускать: zapusk.bat или zapusk.vbs')
    return
  }

  runCommand(pythonVenvPath, ['-m', 'pip', 'install', '-r', 'backend/requirements.txt'], { cwd: projectRoot })

  console.log('Применяю миграции базы...')
  runMigrationsWithFallback()

  console.log('Устанавливаю frontend-зависимости...')
  runCommand('npm', ['install'], { cwd: frontendDir })

  console.log('Запускаю backend и frontend в отдельных консолях...')
  const backendCmd =
    `cd /d ${backendDir} && set DATABASE_URL=${runtimeDatabaseUrl} && ${pythonVenvPath} -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
  const frontendCmd =
    `cd /d ${frontendDir} && npm run dev -- --host 0.0.0.0 --port 5173 --strictPort`

  startDetachedWindow('challenge100days backend', backendCmd)
  startDetachedWindow('challenge100days frontend', frontendCmd)

  console.log('Жду запуск frontend (до 60 секунд)...')
  const isFrontendReady = await waitForFrontendReady()
  if (isFrontendReady) {
    console.log('Открываю браузер...')
    openBrowser()
  } else {
    console.log('Frontend не поднялся автоматически. Проверь окно "challenge100days frontend".')
  }

  console.log('Готово: проект запускается. Работает как с VPN, так и без VPN через localhost.')
}

main().catch((error) => {
  console.error(`Ошибка запуска: ${error.message}`)
  process.exit(1)
})
