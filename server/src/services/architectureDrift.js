import fs from 'fs/promises';
import path from 'path';

/**
 * Default Architectural Layer Inference Rules
 */
export const DEFAULT_ARCHITECTURE_RULES = [
  {
    id: 'rule-ctrl-db',
    name: 'Controller Cannot Directly Access Database',
    sourceLayer: 'Controller',
    forbiddenTarget: 'Database',
    expectedRelationship: 'Controller\n↓\nService\n↓\nRepository\n↓\nDatabase',
    actualRelationship: 'Controller\n↓\nDatabase',
    severity: 'HIGH',
    description: 'Controllers must not query or import database connections directly. Queries must be mediated through Domain Services and Data Access Repositories to ensure transaction safety and business rule encapsulation.',
    recommendation: 'Move database query logic into a method inside UserRepository (or appropriate Repository) and invoke it through UserService.',
    enabled: true,
  },
  {
    id: 'rule-ctrl-repo',
    name: 'Controller Should Not Bypass Service Layer',
    sourceLayer: 'Controller',
    forbiddenTarget: 'Repository',
    expectedRelationship: 'Controller\n↓\nService\n↓\nRepository',
    actualRelationship: 'Controller\n↓\nRepository',
    severity: 'MEDIUM',
    description: 'Controllers should communicate directly with Services instead of Repositories to maintain separation of concerns and ensure authorization/audit hooks are not bypassed.',
    recommendation: 'Encapsulate repository calls inside a Service method and call the service from Controller.',
    enabled: false, // Optional strict rule
  },
  {
    id: 'rule-repo-service',
    name: 'Repository Cannot Import Service (No Reverse Coupling)',
    sourceLayer: 'Repository',
    forbiddenTarget: 'Service',
    expectedRelationship: 'Service\n↓\nRepository',
    actualRelationship: 'Repository\n↓\nService',
    severity: 'HIGH',
    description: 'Lower data-access layers must not depend on higher-level business logic services, which creates cyclic dependencies and impairs unit testing.',
    recommendation: 'Remove service import from repository. Pass required domain entities or parameters into repository methods directly.',
    enabled: true,
  },
  {
    id: 'rule-repo-ctrl',
    name: 'Repository Cannot Import Controller',
    sourceLayer: 'Repository',
    forbiddenTarget: 'Controller',
    expectedRelationship: 'Controller\n↓\nService\n↓\nRepository',
    actualRelationship: 'Repository\n↓\nController',
    severity: 'CRITICAL',
    description: 'Data access repositories must never depend on HTTP presentation controllers.',
    recommendation: 'Eliminate controller imports from repository layers.',
    enabled: true,
  },
  {
    id: 'rule-ui-db',
    name: 'UI Components Cannot Import Database',
    sourceLayer: 'UI',
    forbiddenTarget: 'Database',
    expectedRelationship: 'UI\n↓\nAPI Gateway\n↓\nDatabase',
    actualRelationship: 'UI\n↓\nDatabase',
    severity: 'CRITICAL',
    description: 'Client frontend components must never directly import server-side database connections or persistence drivers.',
    recommendation: 'Consume REST or GraphQL endpoints via the API service layer.',
    enabled: true,
  },
];

/**
 * Classifies a file path into an architectural layer
 */
export function classifyFileLayer(filePath) {
  const norm = filePath.replace(/\\/g, '/').toLowerCase();
  const filename = path.basename(norm);

  // 1. Tests
  if (
    norm.includes('/test/') ||
    norm.includes('/tests/') ||
    norm.includes('.test.') ||
    norm.includes('.spec.') ||
    filename.startsWith('test_')
  ) {
    return 'Test';
  }

  // 2. Controller / Presentation / API
  if (
    norm.includes('/api/') ||
    norm.includes('/controller') ||
    norm.includes('/routes/') ||
    norm.includes('/endpoints/') ||
    filename.includes('controller') ||
    filename.includes('routes')
  ) {
    return 'Controller';
  }

  // 3. Service / Business Logic
  if (
    norm.includes('/service') ||
    norm.includes('/usecases/') ||
    norm.includes('/domain/') ||
    norm.includes('/logic/') ||
    filename.includes('service')
  ) {
    return 'Service';
  }

  // 4. Repository / Data Access
  if (
    norm.includes('/repositories/') ||
    norm.includes('/repository/') ||
    norm.includes('/dao/') ||
    norm.includes('/models/') ||
    norm.includes('/entities/') ||
    filename.includes('repository') ||
    filename.includes('dao')
  ) {
    return 'Repository';
  }

  // 5. Database / Infrastructure Persistence
  if (
    norm.includes('/database/') ||
    norm.includes('/db/') ||
    filename.includes('dbconnection') ||
    filename.includes('database') ||
    filename.includes('datasource') ||
    filename.includes('connection')
  ) {
    return 'Database';
  }

  // 6. UI / Frontend
  if (
    norm.includes('/components/') ||
    norm.includes('/views/') ||
    norm.includes('/pages/') ||
    norm.endsWith('.jsx') ||
    norm.endsWith('.tsx')
  ) {
    return 'UI';
  }

  // 7. Config / Setup
  if (norm.includes('config') || norm.includes('.env') || filename.endsWith('.json')) {
    return 'Config';
  }

  return 'Other';
}

/**
 * Searches file content on disk to extract the exact import line and usage evidence
 */
async function extractImportEvidence(rootPath, sourceRelativeFile, targetRelativeFile) {
  try {
    const fullPath = path.isAbsolute(sourceRelativeFile)
      ? sourceRelativeFile
      : path.join(rootPath, sourceRelativeFile);

    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');

    const targetBase = path.basename(targetRelativeFile, path.extname(targetRelativeFile));
    let importLine = null;
    let importLineNum = null;
    let usageSnippet = null;
    let usageLineNum = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check for import of target
      if (
        (trimmed.startsWith('import ') || trimmed.includes('require(')) &&
        (trimmed.includes(targetBase) || trimmed.includes(targetRelativeFile.split('/').pop()))
      ) {
        importLine = trimmed;
        importLineNum = i + 1;
        break;
      }
    }

    // Check for direct invocations (e.g. db.query, query, connection)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (
        i !== (importLineNum - 1) &&
        (trimmed.includes('db.query') || trimmed.includes('.query(') || trimmed.includes('DatabaseConnection') || trimmed.includes('db.'))
      ) {
        usageSnippet = trimmed;
        usageLineNum = i + 1;
        break;
      }
    }

    return {
      line: importLineNum || 1,
      statement: importLine || `import ... from '${targetRelativeFile}';`,
      usage: usageSnippet ? `Line ${usageLineNum}: ${usageSnippet}` : null,
    };
  } catch (err) {
    return {
      line: 1,
      statement: `import ... from '${targetRelativeFile}';`,
      usage: null,
    };
  }
}

/**
 * Core Architecture Drift Detection Engine
 */
export async function detectArchitectureDrift({
  projectContext,
  graph: providedGraph,
  rules = DEFAULT_ARCHITECTURE_RULES,
  rootPath: providedRootPath,
}) {
  const graph = providedGraph || projectContext?.graph || {};
  const fileList = projectContext?.stats?.fileList || [];
  const rootPath = providedRootPath || projectContext?.rootPath || '';

  // Determine active layers present in the project
  const layersDetected = new Set();
  const fileLayers = {};

  for (const file of fileList) {
    const layer = classifyFileLayer(file.relativePath);
    fileLayers[file.relativePath] = layer;
    if (layer !== 'Other' && layer !== 'Test' && layer !== 'Config') {
      layersDetected.add(layer);
    }
  }

  // Also include files in graph
  for (const filePath of Object.keys(graph)) {
    if (!fileLayers[filePath]) {
      const layer = classifyFileLayer(filePath);
      fileLayers[filePath] = layer;
      if (layer !== 'Other' && layer !== 'Test' && layer !== 'Config') {
        layersDetected.add(layer);
      }
    }
  }

  // Define Expected Architecture order
  const standardTierOrder = ['Controller', 'Service', 'Repository', 'Database'];
  const hasNtier = ['Controller', 'Service', 'Repository', 'Database'].filter((l) => layersDetected.has(l));
  
  const expectedArchitectureLayers = hasNtier.length >= 2
    ? standardTierOrder.filter((l) => layersDetected.has(l))
    : ['Controller', 'Service', 'Repository', 'Database'];

  // Map active rules (enabled only)
  const activeRules = rules.filter((r) => r.enabled !== false);

  const detectedDrifts = [];
  const checkedEdges = new Set();

  // Scan all dependency graph edges
  for (const [sourceFile, nodeData] of Object.entries(graph)) {
    const sourceLayer = fileLayers[sourceFile] || classifyFileLayer(sourceFile);
    const imports = nodeData.imports || [];

    for (const targetFile of imports) {
      const targetLayer = fileLayers[targetFile] || classifyFileLayer(targetFile);
      const edgeKey = `${sourceFile}->${targetFile}`;
      if (checkedEdges.has(edgeKey)) continue;
      checkedEdges.add(edgeKey);

      // Check if this edge violates any active rule
      for (const rule of activeRules) {
        const matchesSource =
          rule.sourceLayer === sourceLayer ||
          (rule.sourceFilePattern && sourceFile.includes(rule.sourceFilePattern));
        const matchesTarget =
          rule.forbiddenTarget === targetLayer ||
          (rule.targetFilePattern && targetFile.includes(rule.targetFilePattern));

        if (matchesSource && matchesTarget) {
          // Architecture drift detected!
          const evidenceDetails = await extractImportEvidence(rootPath, sourceFile, targetFile);

          detectedDrifts.push({
            id: `drift-${detectedDrifts.length + 1}`,
            ruleId: rule.id,
            ruleName: rule.name,
            sourceComponent: sourceFile,
            sourceLayer,
            targetComponent: targetFile,
            targetLayer,
            expectedRelationship: rule.expectedRelationship || 'Controller\n↓\nService\n↓\nRepository\n↓\nDatabase',
            actualRelationship: `${sourceLayer}\n↓\n${targetLayer}`,
            severity: rule.severity,
            description: rule.description,
            evidence: {
              sourceFile,
              targetFile,
              line: evidenceDetails.line,
              statement: evidenceDetails.statement,
              usage: evidenceDetails.usage,
              summary: `${sourceFile}:${evidenceDetails.line} -> "${evidenceDetails.statement}"`,
            },
            recommendation: rule.recommendation,
          });
        }
      }
    }
  }

  // Calculate Health & Drift Score
  let scoreDeduction = 0;
  for (const drift of detectedDrifts) {
    if (drift.severity === 'CRITICAL') scoreDeduction += 35;
    else if (drift.severity === 'HIGH') scoreDeduction += 25;
    else if (drift.severity === 'MEDIUM') scoreDeduction += 15;
    else scoreDeduction += 5;
  }
  const driftScore = Math.max(0, 100 - scoreDeduction);

  // Build Visual Dependency Graph for Architecture view
  // Shows expected vs actual edges with violation markers
  const layerNodes = [
    { id: 'Controller', label: 'Controller / API', type: 'presentation', layer: 'Controller', count: fileList.filter(f => fileLayers[f.relativePath] === 'Controller').length },
    { id: 'Service', label: 'Domain Service', type: 'business', layer: 'Service', count: fileList.filter(f => fileLayers[f.relativePath] === 'Service').length },
    { id: 'Repository', label: 'Repository / DAO', type: 'data-access', layer: 'Repository', count: fileList.filter(f => fileLayers[f.relativePath] === 'Repository').length },
    { id: 'Database', label: 'Database Connection', type: 'persistence', layer: 'Database', count: fileList.filter(f => fileLayers[f.relativePath] === 'Database').length },
  ];

  const graphEdges = [];
  // Standard compliant flows
  graphEdges.push({ from: 'Controller', to: 'Service', label: 'Dispatches', status: 'valid' });
  graphEdges.push({ from: 'Service', to: 'Repository', label: 'Queries DAO', status: 'valid' });
  graphEdges.push({ from: 'Repository', to: 'Database', label: 'SQL / Pool', status: 'valid' });

  // Add violation edges if detected
  for (const drift of detectedDrifts) {
    graphEdges.push({
      from: drift.sourceLayer,
      to: drift.targetLayer,
      label: `⚠ DRIFT: ${drift.sourceLayer} → ${drift.targetLayer}`,
      status: 'violation',
      severity: drift.severity,
      evidence: drift.evidence.summary,
    });
  }

  return {
    hasDrift: detectedDrifts.length > 0,
    totalDrifts: detectedDrifts.length,
    driftScore,
    severityBreakdown: {
      critical: detectedDrifts.filter((d) => d.severity === 'CRITICAL').length,
      high: detectedDrifts.filter((d) => d.severity === 'HIGH').length,
      medium: detectedDrifts.filter((d) => d.severity === 'MEDIUM').length,
      low: detectedDrifts.filter((d) => d.severity === 'LOW').length,
    },
    expectedArchitecture: expectedArchitectureLayers,
    expectedFlow: expectedArchitectureLayers.join(' ↓ '),
    detectedDrifts,
    visualGraph: {
      nodes: layerNodes,
      edges: graphEdges,
    },
    rulesApplied: activeRules.map((r) => ({
      id: r.id,
      name: r.name,
      severity: r.severity,
      sourceLayer: r.sourceLayer,
      forbiddenTarget: r.forbiddenTarget,
      enabled: r.enabled !== false,
    })),
    summary: detectedDrifts.length > 0
      ? `DevTwin detected ${detectedDrifts.length} architecture drift violation(s) across codebase dependencies.`
      : 'Codebase strictly adheres to expected architectural boundaries. Zero layer bypasses detected.',
  };
}
