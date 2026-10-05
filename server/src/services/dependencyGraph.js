import fs from 'fs/promises';
import path from 'path';

/**
 * Extract imported paths from file content using fast regular expressions
 */
function extractImports(content, ext) {
  const imports = [];

  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    // ES module imports: import x from './foo' or import './bar'
    const esImportRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = esImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // CommonJS requires: require('./foo')
    const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Dynamic imports: import('./foo')
    const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (ext === '.py') {
    // Python imports: import foo, from foo.bar import baz, from .foo import bar
    const pyImportRegex = /^(?:from\s+([.\w]+)\s+import|import\s+([.\w]+))/gm;
    let match;
    while ((match = pyImportRegex.exec(content)) !== null) {
      const mod = match[1] || match[2];
      if (mod) imports.push(mod);
    }
  } else if (ext === '.java') {
    // Java imports: import com.demo.User;
    const javaImportRegex = /^import\s+(?:static\s+)?([a-zA-Z0-9_.]+);/gm;
    let match;
    while ((match = javaImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  }

  return [...new Set(imports)];
}

/**
 * Resolve import string to a relative project file path
 */
function resolveImportToProjectFile(importPath, currentRelativeFile, allFilesSet) {
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.json', '.py', '.java', '/index.js', '/index.ts'];

  // 1. Relative import (JS/TS/Python)
  if (importPath.startsWith('.')) {
    const currentDir = path.dirname(currentRelativeFile);
    const candidateBase = path.normalize(path.join(currentDir, importPath)).replace(/\\/g, '/');

    for (const ext of extensions) {
      const candidate = candidateBase + ext;
      if (allFilesSet.has(candidate)) {
        return candidate;
      }
    }
  }

  // 2. Python module path: e.g. 'services.payment_service' -> 'services/payment_service.py'
  const pyPathCandidate = importPath.replace(/\./g, '/') + '.py';
  if (allFilesSet.has(pyPathCandidate)) {
    return pyPathCandidate;
  }

  // 3. Java class name match: e.g. 'com.demo.User' -> find any file ending with 'User.java'
  if (importPath.includes('.')) {
    const className = importPath.split('.').pop() + '.java';
    for (const file of allFilesSet) {
      if (file.endsWith('/' + className) || file === className) {
        return file;
      }
    }
  }

  return null;
}

/**
 * Build the full dependency graph for the scanned files
 */
export async function buildDependencyGraph(rootPath, fileList) {
  const allFilesSet = new Set(fileList.map((f) => f.relativePath));
  const graph = {}; // relativePath -> { imports: [], importedBy: [] }

  for (const file of fileList) {
    graph[file.relativePath] = {
      relativePath: file.relativePath,
      language: file.language,
      imports: [],
      importedBy: [],
      externalPackages: [],
    };
  }

  // Parse imports for each code file under 500KB
  for (const file of fileList) {
    const ext = path.extname(file.relativePath).toLowerCase();
    if (!['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.java'].includes(ext)) {
      continue;
    }

    if (file.size > 500 * 1024) continue;

    try {
      const content = await fs.readFile(file.fullPath, 'utf-8');
      const rawImports = extractImports(content, ext);

      for (const imp of rawImports) {
        const resolved = resolveImportToProjectFile(imp, file.relativePath, allFilesSet);
        if (resolved && resolved !== file.relativePath) {
          if (!graph[file.relativePath].imports.includes(resolved)) {
            graph[file.relativePath].imports.push(resolved);
          }
          if (graph[resolved] && !graph[resolved].importedBy.includes(file.relativePath)) {
            graph[resolved].importedBy.push(file.relativePath);
          }
        } else if (!imp.startsWith('.')) {
          // Extract top-level package name
          const pkg = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
          if (!graph[file.relativePath].externalPackages.includes(pkg)) {
            graph[file.relativePath].externalPackages.push(pkg);
          }
        }
      }
    } catch {
      // Ignore read error
    }
  }

  return graph;
}

/**
 * Compute Blast Radius and Impact for a specific file
 */
export function computeBlastRadius(graph, targetRelativePath) {
  const normalizedTarget = targetRelativePath.replace(/\\/g, '/');
  const targetNode = graph[normalizedTarget];

  if (!targetNode) {
    return {
      targetFile: normalizedTarget,
      riskLevel: 'LOW',
      riskScore: 10,
      directDependents: [],
      indirectDependents: [],
      totalAffected: 0,
      summary: `File "${normalizedTarget}" has no direct dependencies registered.`,
    };
  }

  const direct = [...(targetNode.importedBy || [])];
  const visited = new Set([normalizedTarget, ...direct]);
  const indirect = [];
  const queue = [...direct];

  while (queue.length > 0) {
    const curr = queue.shift();
    const currNode = graph[curr];
    if (currNode && currNode.importedBy) {
      for (const caller of currNode.importedBy) {
        if (!visited.has(caller)) {
          visited.add(caller);
          indirect.push(caller);
          queue.push(caller);
        }
      }
    }
  }

  const totalAffected = direct.length + indirect.length;
  let riskLevel = 'LOW';
  let riskScore = 20;

  if (totalAffected >= 8) {
    riskLevel = 'CRITICAL';
    riskScore = 95;
  } else if (totalAffected >= 4) {
    riskLevel = 'HIGH';
    riskScore = 75;
  } else if (totalAffected >= 1) {
    riskLevel = 'MEDIUM';
    riskScore = 45;
  }

  return {
    targetFile: normalizedTarget,
    riskLevel,
    riskScore,
    directDependents: direct,
    indirectDependents: indirect,
    totalAffected,
    summary: `Modifying ${path.basename(normalizedTarget)} directly impacts ${direct.length} caller(s) and cascades to ${indirect.length} downstream component(s).`,
  };
}
