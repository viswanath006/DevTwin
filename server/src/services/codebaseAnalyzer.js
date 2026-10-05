import fs from 'fs/promises';
import path from 'path';

/**
 * Parses package and dependency files across ecosystems (Node, Python, Java, etc.)
 */
export async function extractDependencies(fileList, rootPath) {
  const dependencies = [];
  const processedFiles = new Set();

  for (const file of fileList) {
    const filename = path.basename(file.relativePath).toLowerCase();

    // 1. Node.js (package.json)
    if (filename === 'package.json' && !processedFiles.has(file.relativePath)) {
      processedFiles.add(file.relativePath);
      try {
        const raw = await fs.readFile(file.fullPath, 'utf-8');
        const pkg = JSON.parse(raw);

        if (pkg.dependencies) {
          for (const [name, version] of Object.entries(pkg.dependencies)) {
            dependencies.push({
              name,
              version: String(version),
              type: 'production',
              ecosystem: 'npm',
              sourceFile: file.relativePath,
            });
          }
        }
        if (pkg.devDependencies) {
          for (const [name, version] of Object.entries(pkg.devDependencies)) {
            dependencies.push({
              name,
              version: String(version),
              type: 'development',
              ecosystem: 'npm',
              sourceFile: file.relativePath,
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to parse ${file.relativePath}:`, err.message);
      }
    }

    // 2. Python (requirements.txt, Pipfile, pyproject.toml)
    else if (filename === 'requirements.txt' && !processedFiles.has(file.relativePath)) {
      processedFiles.add(file.relativePath);
      try {
        const raw = await fs.readFile(file.fullPath, 'utf-8');
        const lines = raw.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
            // Match package==1.0.0 or package>=1.0.0 or package
            const match = trimmed.match(/^([A-Za-z0-9_.-]+)\s*([=><~^!].*)?$/);
            if (match) {
              dependencies.push({
                name: match[1],
                version: match[2]?.trim() || 'latest',
                type: 'production',
                ecosystem: 'pypi',
                sourceFile: file.relativePath,
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Failed to parse ${file.relativePath}:`, err.message);
      }
    }

    // 3. Java Maven (pom.xml)
    else if (filename === 'pom.xml' && !processedFiles.has(file.relativePath)) {
      processedFiles.add(file.relativePath);
      try {
        const raw = await fs.readFile(file.fullPath, 'utf-8');
        const depRegex = /<dependency>[\s\S]*?<groupId>([\w.-]+)<\/groupId>[\s\S]*?<artifactId>([\w.-]+)<\/artifactId>(?:[\s\S]*?<version>([\w.-]+)<\/version>)?[\s\S]*?<\/dependency>/g;
        let match;
        while ((match = depRegex.exec(raw)) !== null) {
          dependencies.push({
            name: `${match[1]}:${match[2]}`,
            version: match[3] || 'managed',
            type: 'production',
            ecosystem: 'maven',
            sourceFile: file.relativePath,
          });
        }
      } catch (err) {
        console.warn(`Failed to parse ${file.relativePath}:`, err.message);
      }
    }

    // 4. Java Gradle (build.gradle, build.gradle.kts)
    else if ((filename === 'build.gradle' || filename === 'build.gradle.kts') && !processedFiles.has(file.relativePath)) {
      processedFiles.add(file.relativePath);
      try {
        const raw = await fs.readFile(file.fullPath, 'utf-8');
        const gradleRegex = /(?:implementation|api|testImplementation|compileOnly)\s*\(?['"]([^'"]+)['"]\)?/g;
        let match;
        while ((match = gradleRegex.exec(raw)) !== null) {
          const parts = match[1].split(':');
          dependencies.push({
            name: parts.length >= 2 ? `${parts[0]}:${parts[1]}` : match[1],
            version: parts[2] || 'latest',
            type: match[0].includes('test') ? 'test' : 'production',
            ecosystem: 'gradle',
            sourceFile: file.relativePath,
          });
        }
      } catch (err) {
        console.warn(`Failed to parse ${file.relativePath}:`, err.message);
      }
    }
  }

  return dependencies;
}

/**
 * Extracts API routes detectable from Express, FastAPI, Flask, Spring Boot, etc.
 */
export function extractApis(content, ext, relativePath) {
  const apis = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Node.js / Express routes: app.get('/path', ...), router.post('/path', ...)
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
      const expressMatch = line.match(/(?:app|router|server)\.(get|post|put|delete|patch|options)\s*\(\s*['"`]([^'"`]+)['"`]/i);
      if (expressMatch) {
        apis.push({
          method: expressMatch[1].toUpperCase(),
          path: expressMatch[2],
          file: relativePath,
          line: lineNum,
          framework: 'Express / Node.js',
        });
      }
    }

    // 2. Python (FastAPI / Flask): @app.get('/path'), @router.post('/path'), @bp.route('/path', methods=['GET'])
    if (ext === '.py') {
      const fastApiMatch = line.match(/@(?:app|router|api|bp)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/i);
      if (fastApiMatch) {
        apis.push({
          method: fastApiMatch[1].toUpperCase(),
          path: fastApiMatch[2],
          file: relativePath,
          line: lineNum,
          framework: 'FastAPI / Python',
        });
      } else {
        const flaskMatch = line.match(/@(?:app|bp)\.route\s*\(\s*['"]([^'"]+)['"](?:.*methods\s*=\s*\[\s*['"](\w+)['"])?/i);
        if (flaskMatch) {
          apis.push({
            method: (flaskMatch[2] || 'GET').toUpperCase(),
            path: flaskMatch[1],
            file: relativePath,
            line: lineNum,
            framework: 'Flask / Python',
          });
        }
      }
    }

    // 3. Java Spring Boot: @GetMapping("/path"), @PostMapping("/path"), @RequestMapping("/path")
    if (ext === '.java') {
      const springMatch = line.match(/@(GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping|RequestMapping)\s*\(\s*(?:(?:value|path)\s*=\s*)?['"]([^'"]+)['"]/i);
      if (springMatch) {
        let method = 'GET';
        if (springMatch[1].includes('Post')) method = 'POST';
        else if (springMatch[1].includes('Put')) method = 'PUT';
        else if (springMatch[1].includes('Delete')) method = 'DELETE';
        else if (springMatch[1].includes('Patch')) method = 'PATCH';
        else if (springMatch[1].includes('Request')) method = 'ANY';

        apis.push({
          method,
          path: springMatch[2],
          file: relativePath,
          line: lineNum,
          framework: 'Spring Boot (Java)',
        });
      }
    }
  });

  return apis;
}

/**
 * Extracts classes, functions, and React components
 */
export function extractSymbols(content, ext, relativePath) {
  const components = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // A. JavaScript & TypeScript
    if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
      // 1. Classes
      const classMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?class\s+([A-Za-z0-9_$]+)(?:\s+extends\s+([A-Za-z0-9_$]+))?/);
      if (classMatch) {
        components.push({
          name: classMatch[1],
          kind: 'Class',
          file: relativePath,
          line: lineNum,
          details: classMatch[2] ? `extends ${classMatch[2]}` : 'Class definition',
        });
        return;
      }

      // 2. React Components (PascalCase function or const)
      const reactComponentMatch = trimmed.match(/^(?:export\s+)?(?:default\s+)?(?:function|const)\s+([A-Z][A-Za-z0-9_$]+)\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>|\([^)]*\)\s*\{)/);
      if (reactComponentMatch && (ext.includes('x') || relativePath.includes('component') || relativePath.includes('view'))) {
        components.push({
          name: reactComponentMatch[1],
          kind: 'React Component',
          file: relativePath,
          line: lineNum,
          details: 'UI Component',
        });
        return;
      }

      // 3. Named Functions
      const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/);
      if (funcMatch) {
        components.push({
          name: funcMatch[1],
          kind: 'Function',
          file: relativePath,
          line: lineNum,
          details: 'Standard Function',
        });
        return;
      }

      // 4. Arrow Functions (Exported)
      const arrowMatch = trimmed.match(/^(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
      if (arrowMatch) {
        components.push({
          name: arrowMatch[1],
          kind: 'Function',
          file: relativePath,
          line: lineNum,
          details: 'Arrow Function',
        });
        return;
      }
    }

    // B. Python
    if (ext === '.py') {
      const pyClass = trimmed.match(/^class\s+([A-Za-z0-9_]+)(?:\((.*?)\))?:/);
      if (pyClass) {
        components.push({
          name: pyClass[1],
          kind: 'Class',
          file: relativePath,
          line: lineNum,
          details: pyClass[2] ? `inherits ${pyClass[2]}` : 'Python Class',
        });
        return;
      }

      const pyFunc = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)\s*\(/);
      if (pyFunc && !pyFunc[1].startsWith('__')) {
        components.push({
          name: pyFunc[1],
          kind: 'Function',
          file: relativePath,
          line: lineNum,
          details: 'Python Function',
        });
        return;
      }
    }

    // C. Java
    if (ext === '.java') {
      const javaClass = trimmed.match(/^(?:public|protected|private)?\s*(?:static\s*)?(?:final\s*)?(?:abstract\s*)?(class|interface|enum|record)\s+([A-Za-z0-9_]+)/);
      if (javaClass) {
        components.push({
          name: javaClass[2],
          kind: javaClass[1].charAt(0).toUpperCase() + javaClass[1].slice(1),
          file: relativePath,
          line: lineNum,
          details: `Java ${javaClass[1]}`,
        });
        return;
      }

      const javaMethod = trimmed.match(/^(?:public|protected|private)\s+(?:static\s+)?([A-Za-z0-9_<>[\]]+)\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[\w, ]+)?\s*\{/);
      if (javaMethod) {
        components.push({
          name: javaMethod[2],
          kind: 'Method',
          file: relativePath,
          line: lineNum,
          details: `Returns ${javaMethod[1]}`,
        });
        return;
      }
    }
  });

  return components;
}

/**
 * Detects test files and extracts test suite / cases
 */
export function extractTestInfo(content, ext, relativePath) {
  const filename = path.basename(relativePath).toLowerCase();
  const isTestFile =
    filename.includes('.test.') ||
    filename.includes('.spec.') ||
    filename.endsWith('_test.py') ||
    filename.startsWith('test_') ||
    filename.endsWith('test.java') ||
    filename.endsWith('tests.java') ||
    relativePath.includes('/test/') ||
    relativePath.includes('/tests/') ||
    relativePath.includes('/__tests__/') ||
    relativePath.includes('/src/test/');

  if (!isTestFile) return null;

  const testCases = [];
  let framework = 'Generic / Test Runner';

  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
    framework = 'Jest / Vitest / Mocha';
    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      testCases.push(match[1]);
    }
  } else if (ext === '.py') {
    framework = 'Pytest / Unittest';
    const pyRegex = /def\s+(test_[A-Za-z0-9_]+)\s*\(/g;
    let match;
    while ((match = pyRegex.exec(content)) !== null) {
      testCases.push(match[1]);
    }
  } else if (ext === '.java') {
    framework = 'JUnit / TestNG';
    const junitRegex = /@Test[\s\S]*?(?:public\s+)?void\s+([A-Za-z0-9_]+)\s*\(/g;
    let match;
    while ((match = junitRegex.exec(content)) !== null) {
      testCases.push(match[1]);
    }
  }

  return {
    file: relativePath,
    framework,
    testCasesCount: testCases.length,
    testCases: testCases.slice(0, 10), // sample top 10 test cases
  };
}

/**
 * Categorizes files into architectural layers
 */
export function categorizeArchitecture(fileList) {
  const layers = {
    'API & Routes': [],
    'Services & Core Logic': [],
    'Models & Entities': [],
    'UI Components & Views': [],
    'Utilities & Helpers': [],
    'Configuration & Setup': [],
    'Tests & Verification': [],
    'Other Modules': [],
  };

  for (const file of fileList) {
    const p = file.relativePath.toLowerCase();
    const ext = path.extname(p);

    if (
      p.includes('.test.') ||
      p.includes('.spec.') ||
      p.includes('/test/') ||
      p.includes('/tests/') ||
      p.includes('test_') ||
      p.endsWith('_test.py')
    ) {
      layers['Tests & Verification'].push(file.relativePath);
    } else if (p.includes('route') || p.includes('controller') || p.includes('endpoint') || p.includes('/api/')) {
      layers['API & Routes'].push(file.relativePath);
    } else if (p.includes('service') || p.includes('manager') || p.includes('handler') || p.includes('logic')) {
      layers['Services & Core Logic'].push(file.relativePath);
    } else if (p.includes('model') || p.includes('entity') || p.includes('schema') || p.includes('dto') || p.includes('types/')) {
      layers['Models & Entities'].push(file.relativePath);
    } else if (p.includes('component') || p.includes('view') || p.includes('page') || ext === '.jsx' || ext === '.tsx') {
      layers['UI Components & Views'].push(file.relativePath);
    } else if (
      p.includes('config') ||
      p.includes('setting') ||
      p.includes('.env') ||
      ['.json', '.yaml', '.yml'].includes(ext)
    ) {
      layers['Configuration & Setup'].push(file.relativePath);
    } else if (p.includes('util') || p.includes('helper') || p.includes('lib/') || p.includes('tool')) {
      layers['Utilities & Helpers'].push(file.relativePath);
    } else {
      layers['Other Modules'].push(file.relativePath);
    }
  }

  return Object.entries(layers)
    .filter(([_, files]) => files.length > 0)
    .map(([layer, files]) => ({
      layer,
      fileCount: files.length,
      sampleFiles: files.slice(0, 5),
    }));
}

/**
 * Master analyzer function that builds the Normalized Project Context Object
 */
export async function analyzeCodebaseDeep(rootPath, scanData) {
  const { stats, tree } = scanData;
  const fileList = stats.fileList || [];

  const projectName = path.basename(path.resolve(rootPath)) || 'Project';
  const languagesDetected = Object.keys(stats.languages || {});

  // 1. Extract Dependencies
  const dependencies = await extractDependencies(fileList, rootPath);

  // 2. Extract APIs, Symbols (Classes/Functions/Components), and Tests
  const apis = [];
  const components = [];
  const tests = [];

  for (const file of fileList) {
    const ext = path.extname(file.relativePath).toLowerCase();

    // Only inspect source files under 600KB
    if (file.size > 600 * 1024) continue;
    if (!['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.json', '.yaml', '.yml'].includes(ext)) {
      continue;
    }

    try {
      const content = await fs.readFile(file.fullPath, 'utf-8');

      // Check tests
      const testInfo = extractTestInfo(content, ext, file.relativePath);
      if (testInfo) {
        tests.push(testInfo);
      }

      // Check APIs
      const detectedApis = extractApis(content, ext, file.relativePath);
      if (detectedApis.length > 0) {
        apis.push(...detectedApis);
      }

      // Check classes and functions
      const detectedSymbols = extractSymbols(content, ext, file.relativePath);
      if (detectedSymbols.length > 0) {
        components.push(...detectedSymbols);
      }
    } catch {
      // Skip unreadable files
    }
  }

  // 3. Categorize Architecture
  const architecture = categorizeArchitecture(fileList);

  // 4. Return Normalized Project Context Object
  return {
    projectName,
    rootPath: path.resolve(rootPath),
    fileCount: stats.totalFiles,
    totalLines: stats.totalLines,
    languages: languagesDetected,
    dependencies,
    components,
    apis,
    tests,
    architecture,
    stats,
    tree,
  };
}
