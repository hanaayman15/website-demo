import fs from 'node:fs/promises';
import path from 'node:path';

const reactRoot = process.cwd();
const legacyRoot = path.resolve(reactRoot, '..');

const SRC_DIR = path.join(reactRoot, 'src');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const HOOKS_DIR = path.join(SRC_DIR, 'hooks');
const SERVICES_DIR = path.join(SRC_DIR, 'services');
const ASSETS_STYLES_DIR = path.join(SRC_DIR, 'assets', 'styles');
const ASSETS_IMAGES_DIR = path.join(SRC_DIR, 'assets', 'images');
const PUBLIC_LEGACY_DIR = path.join(reactRoot, 'public', 'legacy');

const IGNORED_HTML = new Set([
  'backend/REFRESH_ENDPOINT_VERIFICATION.html',
  'images/Client base.html'
]);

function toPascalCase(input) {
  return input
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('') || 'Page';
}

function toRoutePath(fileName) {
  const base = fileName.replace(/\.html$/i, '');
  if (base.toLowerCase() === 'index') return '/';
  return `/${base.toLowerCase().replace(/_/g, '-')}`;
}

function toImportPath(fileName) {
  return `../assets/styles/${path.basename(fileName)}`;
}

function extractCssRefs(html) {
  const matches = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi)];
  return matches.map((m) => m[1]);
}

function countInlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi)].length;
}

function countForms(html) {
  return [...html.matchAll(/<form\b/gi)].length;
}

async function ensureDirs() {
  await fs.mkdir(PAGES_DIR, { recursive: true });
  await fs.mkdir(path.join(COMPONENTS_DIR, 'layout'), { recursive: true });
  await fs.mkdir(path.join(COMPONENTS_DIR, 'ui'), { recursive: true });
  await fs.mkdir(HOOKS_DIR, { recursive: true });
  await fs.mkdir(SERVICES_DIR, { recursive: true });
  await fs.mkdir(ASSETS_STYLES_DIR, { recursive: true });
  await fs.mkdir(ASSETS_IMAGES_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_LEGACY_DIR, { recursive: true });
}

async function copyDirIfExists(src, dest) {
  try {
    await fs.access(src);
    await fs.cp(src, dest, { recursive: true, force: true });
  } catch {
    // Ignore missing source directories.
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getRootHtmlFiles() {
  const entries = await fs.readdir(legacyRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function makePageComponent({ componentName, legacyFile, cssImports, inlineScriptCount, formCount }) {
  const cssImportBlock = cssImports.length
    ? cssImports.map((cssPath) => `import '${cssPath}';`).join('\n')
    : '';

  return `import { useEffect } from 'react';
import { useLegacyPage } from '../hooks/useLegacyPage';
import LegacyHtmlRenderer from '../components/layout/LegacyHtmlRenderer';
${cssImportBlock}

function ${componentName}() {
  const { bodyHtml, inlineScripts, loading, error } = useLegacyPage('/legacy/${legacyFile}');

  useEffect(() => {
    // Migration metadata for this page.
    const migrationInfo = {
      file: '${legacyFile}',
      inlineScriptCount: ${inlineScriptCount},
      formCount: ${formCount},
    };

    if (migrationInfo.inlineScriptCount > 0) {
      // TODO: Replace legacy inline JS with dedicated React hooks and event handlers.
      // This scaffold intentionally avoids executing legacy inline scripts.
      console.debug('Legacy migration info', migrationInfo, inlineScripts.length);
    }
  }, [inlineScripts]);

  return (
    <LegacyHtmlRenderer
      pageName="${componentName}"
      loading={loading}
      error={error}
      bodyHtml={bodyHtml}
    />
  );
}

export default ${componentName};
`;
}

function makeRoutesFile(routeItems) {
  const imports = routeItems
    .map((item) => `import ${item.componentName} from './pages/${item.componentName}';`)
    .join('\n');

  const routeEntries = routeItems
    .map((item) => `  { path: '${item.routePath}', element: <${item.componentName} /> },`)
    .join('\n');

  return `import { createBrowserRouter } from 'react-router-dom';
${imports}

export const router = createBrowserRouter([
${routeEntries}
]);
`;
}

async function writeCoreFiles(routeItems) {
  const routesFile = makeRoutesFile(routeItems);
  await fs.writeFile(path.join(SRC_DIR, 'routes.jsx'), routesFile, 'utf8');

  await fs.writeFile(
    path.join(SRC_DIR, 'App.jsx'),
    `import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(HOOKS_DIR, 'useLegacyPage.js'),
    `import { useEffect, useMemo, useState } from 'react';

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\\s\\S]*?)<\\/body>/i);
  return match ? match[1] : html;
}

function extractInlineScripts(html) {
  return [...html.matchAll(/<script(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/gi)].map((m) => m[1]);
}

function stripScripts(html) {
  return html.replace(/<script[\\s\\S]*?<\\/script>/gi, '');
}

export function useLegacyPage(url) {
  const [rawHtml, setRawHtml] = useState('');
  const [inlineScripts, setInlineScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load page: ' + res.status);
        }
        return res.text();
      })
      .then((html) => {
        if (!mounted) return;
        setInlineScripts(extractInlineScripts(html));
        setRawHtml(stripScripts(extractBody(html)));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(String(err.message || err));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [url]);

  const bodyHtml = useMemo(() => rawHtml, [rawHtml]);
  return { bodyHtml, inlineScripts, loading, error };
}
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'layout', 'LegacyHtmlRenderer.jsx'),
    `function LegacyHtmlRenderer({ pageName, loading, error, bodyHtml }) {
  if (loading) {
    return <div style={{ padding: '1rem' }}>Loading {pageName}...</div>;
  }

  if (error) {
    return <div style={{ padding: '1rem', color: '#b91c1c' }}>Error: {error}</div>;
  }

  return <div data-page={pageName} dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}

export default LegacyHtmlRenderer;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'layout', 'Navbar.jsx'),
    `import { Link } from 'react-router-dom';

function Navbar({ links = [] }) {
  return (
    <nav className="app-navbar">
      {links.map((item) => (
        <Link key={item.path} to={item.path} className="app-nav-link">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default Navbar;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'layout', 'Sidebar.jsx'),
    `import { Link } from 'react-router-dom';

function Sidebar({ links = [] }) {
  return (
    <aside className="app-sidebar">
      {links.map((item) => (
        <Link key={item.path} to={item.path} className="app-sidebar-link">
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

export default Sidebar;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'ui', 'Card.jsx'),
    `function Card({ title, children }) {
  return (
    <section className="ui-card">
      {title ? <h3>{title}</h3> : null}
      <div>{children}</div>
    </section>
  );
}

export default Card;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'ui', 'Button.jsx'),
    `function Button({ type = 'button', onClick, children, ...props }) {
  return (
    <button type={type} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export default Button;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(COMPONENTS_DIR, 'ui', 'Modal.jsx'),
    `function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="ui-modal-backdrop" onClick={onClose}>
      <div className="ui-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close modal">x</button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(SERVICES_DIR, 'api.js'),
    `import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('Request failed: ' + response.status);
  }
  return response.json();
}
`,
    'utf8'
  );

  await fs.writeFile(
    path.join(SRC_DIR, 'index.css'),
    `:root {
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

body {
  margin: 0;
}

.app-navbar,
.app-sidebar {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
}

.ui-card {
  border: 1px solid #d4d4d8;
  border-radius: 0.5rem;
  padding: 1rem;
}

.ui-modal-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.4);
}

.ui-modal {
  background: #fff;
  border-radius: 0.5rem;
  width: min(90vw, 560px);
  padding: 1rem;
}
`,
    'utf8'
  );
}

async function updatePackageScripts() {
  const packageJsonPath = path.join(reactRoot, 'package.json');
  const packageRaw = await fs.readFile(packageJsonPath, 'utf8');
  const pkg = JSON.parse(packageRaw);
  pkg.scripts = pkg.scripts || {};
  pkg.scripts['migrate:legacy'] = 'node scripts/generate-migration.mjs';
  await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

async function run() {
  await ensureDirs();
  await copyDirIfExists(path.join(legacyRoot, 'assets', 'css'), ASSETS_STYLES_DIR);
  await copyDirIfExists(path.join(legacyRoot, 'images'), ASSETS_IMAGES_DIR);
  await copyDirIfExists(
    path.join(legacyRoot, 'assets', 'webfonts'),
    path.join(SRC_DIR, 'assets', 'webfonts')
  );
  await copyDirIfExists(
    path.join(legacyRoot, 'assets', 'css', 'images'),
    path.join(ASSETS_STYLES_DIR, 'images')
  );

  const htmlFiles = await getRootHtmlFiles();
  const routeItems = [];
  const seenComponentNames = new Set();
  const seenRoutePaths = new Set();

  for (const htmlFile of htmlFiles) {
    const relative = htmlFile.replace(/\\/g, '/');
    if (IGNORED_HTML.has(relative)) {
      continue;
    }

    const sourcePath = path.join(legacyRoot, htmlFile);
    const html = await fs.readFile(sourcePath, 'utf8');
    const cssRefNames = extractCssRefs(html)
      .map((href) => path.basename(href))
      .filter((name, index, all) => all.indexOf(name) === index);
    const cssRefs = [];
    for (const cssName of cssRefNames) {
      const cssTarget = path.join(ASSETS_STYLES_DIR, cssName);
      if (await fileExists(cssTarget)) {
        cssRefs.push(toImportPath(cssName));
      }
    }

    const componentName = toPascalCase(htmlFile);
    const routePath = toRoutePath(htmlFile);

    if (seenComponentNames.has(componentName) || seenRoutePaths.has(routePath)) {
      continue;
    }

    seenComponentNames.add(componentName);
    seenRoutePaths.add(routePath);
    const pageFilePath = path.join(PAGES_DIR, `${componentName}.jsx`);

    await fs.copyFile(sourcePath, path.join(PUBLIC_LEGACY_DIR, htmlFile));
    await fs.writeFile(
      pageFilePath,
      makePageComponent({
        componentName,
        legacyFile: htmlFile,
        cssImports: cssRefs,
        inlineScriptCount: countInlineScripts(html),
        formCount: countForms(html),
      }),
      'utf8'
    );

    routeItems.push({ componentName, routePath, htmlFile });
  }

  await writeCoreFiles(routeItems);
  await updatePackageScripts();

  console.log(`Generated ${routeItems.length} page components and routes.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
