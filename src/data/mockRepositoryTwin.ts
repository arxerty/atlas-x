import { BuildingNodeData, DistrictData, GitCommitData, SimulationScenario, DebuggerFrame } from '../types/atlas';

export const MOCK_DISTRICTS: DistrictData[] = [
  { id: 'dist-gateway', name: 'API Gateway District', color: '#00F0FF', bounds: { x: -15, z: -15, width: 14, depth: 14 } },
  { id: 'dist-auth', name: 'Identity & Auth District', color: '#7000FF', bounds: { x: 5, z: -15, width: 14, depth: 14 } },
  { id: 'dist-checkout', name: 'Checkout Core District', color: '#00FF66', bounds: { x: -15, z: 5, width: 14, depth: 14 } },
  { id: 'dist-payment', name: 'Payment Engine District', color: '#FF0055', bounds: { x: 5, z: 5, width: 14, depth: 14 } },
  { id: 'dist-infra', name: 'Infrastructure & Data Zone', color: '#FFB800', bounds: { x: -5, z: 22, width: 24, depth: 10 } },
];

export const MOCK_BUILDINGS: BuildingNodeData[] = [
  // API Gateway
  {
    id: 'b-gateway-main',
    name: 'router.ts',
    path: 'apps/gateway/src/router.ts',
    district: 'dist-gateway',
    type: 'file',
    position: [-15, 0, -15],
    dimensions: [3, 10, 3],
    color: '#00F0FF',
    linesOfCode: 840,
    complexity: 12,
    functions: [
      { id: 'fn-route-req', name: 'routeRequest()', linesOfCode: 120, complexity: 5, isAsync: true },
      { id: 'fn-rate-limit', name: 'checkRateLimit()', linesOfCode: 80, complexity: 4, isAsync: true },
    ],
    dependencies: ['b-auth-service', 'b-checkout-controller'],
    rps: 3400,
    latencyMs: 14,
    errorRate: 0.01,
    heatLevel: 0.3,
  },
  {
    id: 'b-gateway-middleware',
    name: 'security.middleware.ts',
    path: 'apps/gateway/src/security.middleware.ts',
    district: 'dist-gateway',
    type: 'file',
    position: [-10, 0, -12],
    dimensions: [2.5, 6, 2.5],
    color: '#00D8F0',
    linesOfCode: 380,
    complexity: 8,
    functions: [
      { id: 'fn-cors', name: 'validateCors()', linesOfCode: 45, complexity: 2, isAsync: false },
      { id: 'fn-csrf', name: 'verifyCsrfToken()', linesOfCode: 90, complexity: 4, isAsync: true },
    ],
    dependencies: ['b-redis-cache'],
    rps: 3400,
    latencyMs: 3,
    errorRate: 0.001,
    heatLevel: 0.1,
  },

  // Auth Service
  {
    id: 'b-auth-service',
    name: 'auth.service.ts',
    path: 'services/auth/src/auth.service.ts',
    district: 'dist-auth',
    type: 'file',
    position: [5, 0, -15],
    dimensions: [3.2, 14, 3.2],
    color: '#7000FF',
    linesOfCode: 1420,
    complexity: 24,
    functions: [
      { id: 'fn-login', name: 'authenticateUser()', linesOfCode: 210, complexity: 9, isAsync: true },
      { id: 'fn-jwt', name: 'issueJwtToken()', linesOfCode: 110, complexity: 6, isAsync: true },
      { id: 'fn-oauth', name: 'verifyOAuthCode()', linesOfCode: 180, complexity: 8, isAsync: true },
    ],
    dependencies: ['b-user-db', 'b-redis-cache'],
    rps: 1200,
    latencyMs: 28,
    errorRate: 0.03,
    heatLevel: 0.5,
  },
  {
    id: 'b-jwt-provider',
    name: 'jwt.strategy.ts',
    path: 'services/auth/src/jwt.strategy.ts',
    district: 'dist-auth',
    type: 'file',
    position: [11, 0, -11],
    dimensions: [2.2, 5, 2.2],
    color: '#9D00FF',
    linesOfCode: 290,
    complexity: 6,
    functions: [
      { id: 'fn-verify-jwt', name: 'validateToken()', linesOfCode: 65, complexity: 3, isAsync: true },
    ],
    dependencies: ['b-redis-cache'],
    rps: 2800,
    latencyMs: 2,
    errorRate: 0.0,
    heatLevel: 0.1,
  },

  // Checkout Service
  {
    id: 'b-checkout-controller',
    name: 'checkout.controller.ts',
    path: 'services/checkout/src/checkout.controller.ts',
    district: 'dist-checkout',
    type: 'file',
    position: [-15, 0, 5],
    dimensions: [3.8, 18, 3.8],
    color: '#00FF66',
    linesOfCode: 2150,
    complexity: 38,
    functions: [
      { id: 'fn-process-order', name: 'processOrder()', linesOfCode: 340, complexity: 16, isAsync: true },
      { id: 'fn-calc-tax', name: 'calculateTaxAndShipping()', linesOfCode: 190, complexity: 9, isAsync: true },
      { id: 'fn-apply-coupon', name: 'applyDiscountCoupon()', linesOfCode: 150, complexity: 7, isAsync: true },
    ],
    dependencies: ['b-payment-gateway', 'b-orders-db', 'b-rabbitmq-queue'],
    rps: 850,
    latencyMs: 145,
    errorRate: 0.08,
    heatLevel: 0.85,
  },

  // Payment Engine
  {
    id: 'b-payment-gateway',
    name: 'stripe.processor.ts',
    path: 'services/payment/src/stripe.processor.ts',
    district: 'dist-payment',
    type: 'file',
    position: [5, 0, 5],
    dimensions: [3.5, 15, 3.5],
    color: '#FF0055',
    linesOfCode: 1890,
    complexity: 31,
    functions: [
      { id: 'fn-charge-card', name: 'executeStripeCharge()', linesOfCode: 280, complexity: 12, isAsync: true },
      { id: 'fn-webhook', name: 'handleStripeWebhook()', linesOfCode: 220, complexity: 10, isAsync: true },
    ],
    dependencies: ['b-payment-db', 'b-redis-cache'],
    rps: 420,
    latencyMs: 290,
    errorRate: 0.04,
    heatLevel: 0.7,
  },

  // Infrastructure Zones
  {
    id: 'b-user-db',
    name: 'PostgreSQL User Cluster',
    path: 'infra/postgres/user_db',
    district: 'dist-infra',
    type: 'database',
    position: [-10, 0, 22],
    dimensions: [4.5, 7, 4.5],
    color: '#FFB800',
    linesOfCode: 0,
    complexity: 0,
    functions: [],
    dependencies: [],
    rps: 1800,
    latencyMs: 8,
    heatLevel: 0.2,
  },
  {
    id: 'b-orders-db',
    name: 'PostgreSQL Orders DB',
    path: 'infra/postgres/orders_db',
    district: 'dist-infra',
    type: 'database',
    position: [-3, 0, 22],
    dimensions: [4.5, 9, 4.5],
    color: '#FFB800',
    linesOfCode: 0,
    complexity: 0,
    functions: [],
    dependencies: [],
    rps: 950,
    latencyMs: 18,
    heatLevel: 0.4,
  },
  {
    id: 'b-redis-cache',
    name: 'Redis L2 Cluster',
    path: 'infra/redis/session_cache',
    district: 'dist-infra',
    type: 'cache',
    position: [4, 0, 22],
    dimensions: [4, 6, 4],
    color: '#00F0FF',
    linesOfCode: 0,
    complexity: 0,
    functions: [],
    dependencies: [],
    rps: 6200,
    latencyMs: 1.2,
    cacheHitRatio: 0.94,
    heatLevel: 0.1,
  },
  {
    id: 'b-rabbitmq-queue',
    name: 'RabbitMQ Event Bus',
    path: 'infra/rabbitmq/events',
    district: 'dist-infra',
    type: 'queue',
    position: [11, 0, 22],
    dimensions: [4.2, 5, 4.2],
    color: '#FF7700',
    linesOfCode: 0,
    complexity: 0,
    functions: [],
    dependencies: [],
    rps: 1400,
    latencyMs: 5,
    heatLevel: 0.25,
  },
];

export const MOCK_COMMITS: GitCommitData[] = [
  {
    sha: 'a1b2c3d',
    author: 'Elena Rostova',
    message: 'feat(checkout): split tax calculation into async worker queue',
    date: '2 hours ago',
    changesCount: 4,
    aiNarration: 'Elena isolated high-latency tax calculation from the main checkout HTTP request path, reducing P99 latency by 320ms.',
    modifiedNodeIds: ['b-checkout-controller', 'b-rabbitmq-queue'],
  },
  {
    sha: 'e5f6g7h',
    author: 'Marcus Vance',
    message: 'perf(auth): introduce L2 Redis caching for JWT validation',
    date: '1 day ago',
    changesCount: 2,
    aiNarration: 'Marcus added a fast-path Redis lookup for active JWT session keys, mitigating PostgreSQL read lock spikes.',
    modifiedNodeIds: ['b-auth-service', 'b-redis-cache'],
  },
  {
    sha: 'i9j0k1l',
    author: 'Sarah Chen',
    message: 'refactor(gateway): add token bucket rate limiting middleware',
    date: '3 days ago',
    changesCount: 3,
    aiNarration: 'Sarah implemented DDOS mitigation rate limiting directly at the Gateway district boundary.',
    modifiedNodeIds: ['b-gateway-main', 'b-gateway-middleware'],
  },
];

export const MOCK_SIMULATIONS: SimulationScenario[] = [
  {
    id: 'sim-1',
    title: 'Extract Payment Engine into Independent gRPC Microservice',
    description: 'Decouple Stripe payment processor from monolith HTTP pipeline and transition to zero-copy protobuf gRPC over persistent HTTP/2.',
    proposedChanges: [
      'Replace REST endpoint in payment.processor.ts with gRPC proto definition',
      'Deploy Payment service as isolated Kubernetes deployment with dedicated pod autoscaler',
      'Add Envoy proxy sidecar for gRPC load balancing'
    ],
    metricsDelta: {
      latencyPct: -42.5,
      costUsd: +180,
      complexityDelta: -14,
      securityRiskScore: 2,
    }
  },
  {
    id: 'sim-2',
    title: 'Introduce Multi-Region Redis Cache Cluster for Auth',
    description: 'Deploy distributed Redis Enterprise cluster with Active-Active CRDT replication across us-east-1 and eu-west-1.',
    proposedChanges: [
      'Provision 2x Redis Cloud nodes in AWS EU & US',
      'Update auth.service.ts to use fallback dual-read cache driver'
    ],
    metricsDelta: {
      latencyPct: -68.0,
      costUsd: +450,
      complexityDelta: +8,
      securityRiskScore: 1,
    }
  }
];

export const MOCK_DEBUGGER_FRAMES: DebuggerFrame[] = [
  {
    id: 'frame-1',
    functionName: 'processOrder()',
    buildingId: 'b-checkout-controller',
    line: 342,
    variables: [
      { name: 'orderId', type: 'string', value: '"ord_9981428x"' },
      { name: 'cartTotal', type: 'number', value: '489.50' },
      { name: 'userTier', type: 'string', value: '"PLATINUM_VIP"' },
      { name: 'stripeToken', type: 'string', value: '"tok_1N8x2yLkd..."' },
    ]
  },
  {
    id: 'frame-2',
    functionName: 'executeStripeCharge()',
    buildingId: 'b-payment-gateway',
    line: 284,
    variables: [
      { name: 'idempotencyKey', type: 'string', value: '"idemp_a18f92"' },
      { name: 'retryAttempt', type: 'number', value: '1' },
      { name: 'timeoutMs', type: 'number', value: '5000' },
    ]
  }
];
