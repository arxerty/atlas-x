export type Language = 'ru' | 'en';

export const TRANSLATIONS = {
  en: {
    brandTagline: 'The Digital Twin of Software',
    digitalTwinVersion: 'Digital Twin v2.4',
    connectGithub: 'Connect GitHub Repo',
    connectedRepo: 'Connected Repo',
    searchPlaceholder: 'Search buildings, APIs, functions...',
    liveTelemetryOn: 'LIVE TELEMETRY ON',
    liveTelemetryPaused: 'PAUSED',
    spatialDebugger: 'Spatial Debugger',
    aiGraphCopilot: 'AI Graph Copilot',
    
    // Modes
    modeExplore: 'Static Twin',
    modeTelemetry: 'Live Telemetry',
    modeReplay: 'Architecture Replay',
    modeSimulation: 'What-If Sandbox',
    modeDebugger: 'Live Debugger',

    // Inspector
    linesOfCode: 'Lines of Code',
    complexityIndex: 'Complexity Index',
    telemetryThroughput: 'Telemetry Throughput',
    p99Latency: 'P99 Latency',
    astFunctions: 'AST Function Rooms',
    outboundHighways: 'Outbound Highways',
    idle: 'Idle',

    // GitHub Modal
    githubModalTitle: 'Connect GitHub Repository',
    githubModalSubtitle: 'Import any public GitHub repository to generate its living 3D digital twin',
    repoUrlLabel: 'GitHub Repository URL',
    repoUrlPlaceholder: 'https://github.com/facebook/react',
    popularPresets: 'Or select a popular repository:',
    btnConnect: 'Connect Repository',
    btnCancel: 'Cancel',

    // AI Copilot
    aiTitle: 'AI Graph Copilot',
    aiSubtitle: 'Graph-RAG Engine Active',
    aiWelcome: 'Hello! I am the Atlas X AI reasoning engine. I have parsed your Neo4j code graph, OTel traces, and ASTs. Ask me about your system architecture or bottlenecks.',
    aiPlaceholder: 'Ask AI about architecture or code...',
    presetBottlenecks: 'Checkout Bottlenecks',
    presetTechDebt: 'Technical Debt',

    // Timeline Replay
    commitReplayTitle: 'Git Commit Architecture Replay',
    commitCount: 'Commit {current} of {total}',

    // Simulation Sandbox
    simulationTitle: 'What-If Architectural Simulation Sandbox',
    simulationSubtitle: 'Predictive Impact Engine',
    estLatency: 'Estimated P99 Latency',
    costDelta: 'Infrastructure Cost Delta',
    complexityReduction: 'Complexity Reduction',
    applyPlan: 'Apply Refactoring Plan',

    // Live Debugger
    debuggerTitle: 'Spatial Live Debugger',
    breakpointHit: 'BREAKPOINT HIT',
    callStack: 'Call Stack Trace',
    activeScope: 'Active Scope Variables',

    // Telemetry Vehicles
    roadTwoLane: 'Two-Lane Telemetry Highway',
    carSpeedLatency: 'Vehicle speed indicates network latency',
  },
  ru: {
    brandTagline: 'Цифровой Двойник Программы',
    digitalTwinVersion: 'Цифровой Двойник v2.4',
    connectGithub: 'Подключить GitHub',
    connectedRepo: 'Подключённый репозиторий',
    searchPlaceholder: 'Поиск зданий, API, функций...',
    liveTelemetryOn: 'ТЕЛЕМЕТРИЯ ВКЛ',
    liveTelemetryPaused: 'ПАУЗА',
    spatialDebugger: 'Пространственный Отладчик',
    aiGraphCopilot: 'ИИ Граф-Копилот',
    
    // Modes
    modeExplore: 'Статический Двойник',
    modeTelemetry: 'Живая Телеметрия',
    modeReplay: 'Реплей Архитектуры',
    modeSimulation: 'Песочница "Что Если"',
    modeDebugger: 'Живой Отладчик',

    // Inspector
    linesOfCode: 'Строк кода (LoC)',
    complexityIndex: 'Индекс сложности',
    telemetryThroughput: 'Пропускная способность',
    p99Latency: 'Задержка P99',
    astFunctions: 'Комнаты функций AST',
    outboundHighways: 'Исходящие магистрали',
    idle: 'Простой',

    // GitHub Modal
    githubModalTitle: 'Подключить GitHub репозиторий',
    githubModalSubtitle: 'Импортируйте любой открытый репозиторий GitHub для генерации 3D цифрового двойника',
    repoUrlLabel: 'Ссылка на репозиторий GitHub',
    repoUrlPlaceholder: 'https://github.com/facebook/react',
    popularPresets: 'Или выберите популярный репозиторий:',
    btnConnect: 'Подключить репозиторий',
    btnCancel: 'Отмена',

    // AI Copilot
    aiTitle: 'ИИ Граф-Копилот',
    aiSubtitle: 'Движок Graph-RAG активен',
    aiWelcome: 'Привет! Я ИИ-ассистент Atlas X. Я проанализировал граф кода Neo4j, OTel-трассировки и AST. Спросите меня об архитектуре или узких местах вашей системы.',
    aiPlaceholder: 'Задайте вопрос ИИ об архитектуре или коде...',
    presetBottlenecks: 'Заторы в Checkout',
    presetTechDebt: 'Технический долг',

    // Timeline Replay
    commitReplayTitle: 'Реплей эволюции архитектуры по Git-коммитам',
    commitCount: 'Коммит {current} из {total}',

    // Simulation Sandbox
    simulationTitle: 'Архитектурная Песочница "Что Если"',
    simulationSubtitle: 'Движок прогнозирования эффекта',
    estLatency: 'Прогноз задержки P99',
    costDelta: 'Изменение стоимости инфраструктуры',
    complexityReduction: 'Снижение сложности',
    applyPlan: 'Применить план рефакторинга',

    // Live Debugger
    debuggerTitle: 'Пространственный Отладчик',
    breakpointHit: 'ТОЧКА ОСТАНОВА',
    callStack: 'Стек вызовов (Call Stack)',
    activeScope: 'Переменные в области видимости',

    // Telemetry Vehicles
    roadTwoLane: 'Двухполосная автомагистраль телеметрии',
    carSpeedLatency: 'Скорость автомобилей отражает задержку сети',
  },
};
