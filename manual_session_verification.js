const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = process.cwd();
const frontendDir = path.join(root, 'frontend');

const pages = [
  'client-home.html',
  'client-dashboard.html',
  'mental-coaching.html',
  'anti-doping.html',
  'progress-tracking.html',
  'settings.html'
];

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(String(k), String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

function makeContext(pageName) {
  const appendedNodes = [];
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();

  const document = {
    body: {
      appendChild: (node) => appendedNodes.push(node),
    },
    createElement: (tag) => ({
      tag,
      id: '',
      style: {},
      innerHTML: '',
      remove() {},
    }),
    getElementById: (id) => appendedNodes.find((n) => n.id === id) || null,
    querySelectorAll: () => [],
    addEventListener() {},
  };

  const windowObj = {
    location: {
      pathname: `/${pageName}`,
      href: pageName,
    },
    addEventListener() {},
    __global401HandlerInstalled: false,
  };

  const timers = [];
  const setTimeoutShim = (fn, delay) => {
    timers.push({ fn, delay });
    // Execute immediately so we can assert redirect side effects.
    fn();
    return timers.length;
  };

  const consoleShim = {
    log() {},
    warn() {},
    error() {},
    group() {},
    groupEnd() {},
  };

  const context = {
    window: windowObj,
    document,
    localStorage,
    sessionStorage,
    console: consoleShim,
    setTimeout: setTimeoutShim,
    clearTimeout() {},
  };

  context.window.localStorage = localStorage;
  context.window.sessionStorage = sessionStorage;
  context.window.document = document;
  context.window.console = consoleShim;
  context.window.setTimeout = setTimeoutShim;
  context.window.clearTimeout = context.clearTimeout;

  return { context, appendedNodes, timers };
}

function verifyPageInit(pageName) {
  const filePath = path.join(frontendDir, pageName);
  const content = fs.readFileSync(filePath, 'utf8');
  const hasInit = content.includes('initGlobalNavbarAuthState(');
  const hasSessionAlert = /alert\([^\)]*(session|expired|login|log in|401|unauthorized)/i.test(content);
  return { pageName, hasInit, hasSessionAlert };
}

function runConfigBehaviorCheck() {
  const configPath = path.join(frontendDir, 'config.js');
  const configCode = fs.readFileSync(configPath, 'utf8');

  const missingTokenResults = [];
  const force401Results = [];
  const messageTextOk = configCode.includes('Your session has expired. Please log in again.');

  for (const page of pages) {
    const { context, appendedNodes, timers } = makeContext(page);
    vm.createContext(context);
    vm.runInContext(configCode, context);

    context.initGlobalNavbarAuthState();

    const hasOverlay = !!context.document.getElementById('session-expired-overlay');
    const redirected = context.window.location.href === 'client-login.html';
    const delay = timers.length ? timers[timers.length - 1].delay : null;

    missingTokenResults.push({
      page,
      hasOverlay,
      redirected,
      delay,
      protected: context.isProtectedClientPage(),
    });

    // Reset state for forced 401 simulation on same page.
    const second = makeContext(page);
    vm.createContext(second.context);
    vm.runInContext(configCode, second.context);

    second.context.localStorage.setItem('clientToken', 'dummy-token');
    second.context.isTokenExpired = () => false;

    second.context.window.fetch = async () => ({ status: 401, ok: false });
    second.context.installGlobal401Handler();

    force401Results.push(
      second.context.window.fetch('/api/client/profile').then(() => {
        const hasOverlay2 = !!second.context.document.getElementById('session-expired-overlay');
        const redirected2 = second.context.window.location.href === 'client-login.html';
        return {
          page,
          hasOverlay: hasOverlay2,
          redirected: redirected2,
          protected: second.context.isProtectedClientPage(),
        };
      })
    );
  }

  return Promise.all(force401Results).then((f401) => ({
    missingTokenResults,
    forced401Results: f401,
    messageTextOk,
  }));
}

(async () => {
  const pageChecks = pages.map(verifyPageInit);
  const configChecks = await runConfigBehaviorCheck();

  const report = {
    generatedAt: new Date().toISOString(),
    pageChecks,
    configChecks,
  };

  const outPath = path.join(root, 'session_expiry_manual_verification_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`REPORT_WRITTEN=${outPath}\n`);
})();
