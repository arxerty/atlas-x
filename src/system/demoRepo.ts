import { Dependency, RawTreeEntry, SystemData } from './types';
import { layoutSystem, selectFiles } from './layout';
import { seededRandom } from './classify';

const MODULES: Record<string, Record<string, string[]>> = {
  apps: {
    'apps/web': ['App.tsx', 'main.tsx', 'router.ts', 'pages/Home.tsx', 'pages/Catalog.tsx', 'pages/Product.tsx', 'pages/Cart.tsx', 'pages/Checkout.tsx', 'pages/Account.tsx', 'hooks/useCart.ts', 'hooks/useSession.ts', 'store/cart.ts', 'store/user.ts', 'styles/global.css', 'styles/theme.css', 'index.html'],
    'apps/admin': ['App.tsx', 'main.tsx', 'pages/Dashboard.tsx', 'pages/Orders.tsx', 'pages/Inventory.tsx', 'pages/Users.tsx', 'charts/Revenue.tsx', 'charts/Funnel.tsx', 'api.ts', 'styles.css'],
    'apps/mobile': ['App.tsx', 'navigation.tsx', 'screens/Home.tsx', 'screens/Scan.tsx', 'screens/Wallet.tsx', 'push.ts', 'offline.ts'],
  },
  packages: {
    'packages/ui': ['index.ts', 'Button.tsx', 'Input.tsx', 'Modal.tsx', 'Table.tsx', 'Toast.tsx', 'Tabs.tsx', 'Card.tsx', 'tokens.ts', 'theme.css', 'README.md'],
    'packages/core': ['index.ts', 'money.ts', 'cart.ts', 'pricing.ts', 'tax.ts', 'discounts.ts', 'inventory.ts', 'events.ts', 'errors.ts', 'README.md'],
    'packages/api-client': ['index.ts', 'client.ts', 'auth.ts', 'orders.ts', 'payments.ts', 'catalog.ts', 'retry.ts', 'types.ts'],
    'packages/utils': ['index.ts', 'date.ts', 'format.ts', 'debounce.ts', 'logger.ts', 'invariant.ts'],
  },
  services: {
    'services/auth': ['main.go', 'handlers.go', 'tokens.go', 'sessions.go', 'oauth.go', 'store.go', 'Dockerfile'],
    'services/payments': ['main.py', 'gateway.py', 'stripe_adapter.py', 'refunds.py', 'ledger.py', 'fraud.py', 'models.py', 'Dockerfile'],
    'services/orders': ['index.ts', 'server.ts', 'routes.ts', 'repository.ts', 'saga.ts', 'queue.ts', 'schema.sql', 'Dockerfile'],
    'services/notifications': ['index.ts', 'email.ts', 'sms.ts', 'push.ts', 'templates.ts', 'Dockerfile'],
  },
  docs: {
    docs: ['getting-started.md', 'architecture.md', 'deployment.md', 'contributing.md', 'api.md', 'glossary.md'],
    'docs/adr': ['0001-monorepo.md', '0002-event-bus.md', '0003-payments-saga.md', '0004-design-tokens.md'],
    'docs/images': ['system-overview.png', 'checkout-flow.svg', 'logo.svg'],
  },
  tests: {
    'tests/e2e': ['checkout.spec.ts', 'login.spec.ts', 'admin.spec.ts', 'catalog.spec.ts'],
    'tests/unit': ['money.test.ts', 'pricing.test.ts', 'cart.test.ts', 'tax.test.ts', 'retry.test.ts'],
    'tests/fixtures': ['products.json', 'users.json', 'orders.json'],
  },
  scripts: {
    scripts: ['build.mjs', 'release.mjs', 'seed.ts', 'migrate.ts', 'lint-staged.mjs', 'bump-version.mjs'],
  },
  infra: {
    'infra/k8s': ['auth.yaml', 'payments.yaml', 'orders.yaml', 'ingress.yaml', 'redis.yaml'],
    'infra/terraform': ['main.tf', 'network.tf', 'database.tf', 'variables.tf'],
    infra: ['docker-compose.yml', 'README.md'],
  },
  assets: {
    'assets/icons': ['cart.svg', 'user.svg', 'search.svg', 'close.svg', 'arrow.svg'],
    'assets/fonts': ['Inter.woff2', 'Mono.woff2'],
    assets: ['hero.webp', 'og-image.png'],
  },
};

const ROOT_FILES = ['package.json', 'README.md', 'tsconfig.json', 'turbo.json', '.eslintrc.json', '.gitignore', 'LICENSE', 'pnpm-workspace.yaml', 'CHANGELOG.md'];

// [from pattern, to pattern] — wired between real demo paths below
const LINKS: [string, string][] = [
  ['apps/web/pages/', 'packages/ui/'],
  ['apps/web/pages/', 'packages/api-client/'],
  ['apps/web/hooks/', 'packages/core/cart.ts'],
  ['apps/web/store/', 'packages/core/'],
  ['apps/admin/pages/', 'packages/ui/'],
  ['apps/admin/charts/', 'packages/utils/format.ts'],
  ['apps/admin/api.ts', 'packages/api-client/client.ts'],
  ['apps/mobile/screens/', 'packages/api-client/'],
  ['apps/mobile/screens/', 'packages/core/money.ts'],
  ['packages/api-client/', 'packages/utils/logger.ts'],
  ['packages/core/', 'packages/utils/'],
  ['services/orders/', 'packages/core/'],
  ['services/orders/saga.ts', 'services/notifications/index.ts'],
  ['services/notifications/', 'packages/utils/logger.ts'],
  ['tests/unit/money', 'packages/core/money.ts'],
  ['tests/unit/pricing', 'packages/core/pricing.ts'],
  ['tests/unit/cart', 'packages/core/cart.ts'],
  ['tests/unit/tax', 'packages/core/tax.ts'],
  ['tests/unit/retry', 'packages/api-client/retry.ts'],
  ['tests/e2e/', 'apps/web/pages/'],
  ['tests/e2e/admin', 'apps/admin/pages/'],
  ['scripts/seed.ts', 'tests/fixtures/'],
  ['scripts/migrate.ts', 'services/orders/schema.sql'],
  ['scripts/build.mjs', 'package.json'],
  ['packages/ui/', 'assets/icons/'],
  ['apps/web/styles/', 'assets/fonts/'],
  ['apps/web/pages/Home', 'assets/hero.webp'],
  ['packages/ui/theme.css', 'packages/ui/tokens.ts'],
  ['docs/architecture.md', 'docs/images/'],
  ['infra/k8s/', 'services/'],
];

export function buildDemoSystem(): SystemData {
  const rand = seededRandom(42);
  const entries: RawTreeEntry[] = ROOT_FILES.map((p) => ({ path: p, size: Math.round(300 + rand() * 2500) }));
  for (const group of Object.values(MODULES)) {
    for (const [dir, names] of Object.entries(group)) {
      for (const n of names) {
        const heavy = /App|server|gateway|saga|pricing|Checkout|Dashboard|client|cart/.test(n) ? 4 : 1;
        entries.push({ path: `${dir}/${n}`, size: Math.round((800 + rand() * 7000) * heavy) });
      }
    }
  }

  const paths = entries.map((e) => e.path);
  const deps: Dependency[] = [];
  for (const [fromPat, toPat] of LINKS) {
    const froms = paths.filter((p) => p.startsWith(fromPat) || p.includes(fromPat));
    const tos = paths.filter((p) => p.startsWith(toPat) || p.includes(toPat));
    if (!tos.length) continue;
    for (const f of froms) {
      const count = 1 + Math.floor(rand() * Math.min(3, tos.length));
      for (let i = 0; i < count; i++) deps.push({ from: f, to: tos[Math.floor(rand() * tos.length)] });
    }
  }
  // intra-module wiring: every file imports its folder's index or a neighbour
  for (const p of paths) {
    const dir = p.slice(0, p.lastIndexOf('/'));
    const siblings = paths.filter((q) => q !== p && q.startsWith(dir + '/') && /\.(tsx?|py|go)$/.test(q));
    if (siblings.length && /\.(tsx?|py|go)$/.test(p) && rand() > 0.3) deps.push({ from: p, to: siblings[Math.floor(rand() * siblings.length)] });
  }

  const selection = selectFiles(entries);
  for (const f of selection.files) f.lines = Math.max(8, Math.round(f.size / 34));
  return layoutSystem(selection, deps, {
    slug: 'atlas-demo/orbital-commerce',
    branch: 'main',
    description: 'Демо-монорепозиторий: приложения, пакеты, сервисы, документация и инфраструктура',
    stars: null,
    source: 'demo',
    totalFiles: entries.length,
    parsedFiles: entries.length,
  });
}
