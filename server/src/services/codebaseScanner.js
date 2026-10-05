import fs from 'fs/promises';
import path from 'path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'target',
  'bin',
  '.gradle',
  'out',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'env',
  '.gemini',
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db',
]);

const EXTENSION_LANGUAGE_MAP = {
  '.js': 'JavaScript',
  '.jsx': 'JavaScript React',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript React',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.c': 'C',
  '.cpp': 'C++',
  '.cs': 'C#',
  '.php': 'PHP',
  '.rb': 'Ruby',
  '.html': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.yaml': 'YAML',
  '.yml': 'YAML',
};

/**
 * Scan a codebase directory recursively to generate the digital twin file tree and metadata
 */
export async function scanCodebase(targetPath) {
  const resolvedPath = path.resolve(targetPath);
  
  // Verify targetPath exists and is a directory
  const stat = await fs.stat(resolvedPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path "${targetPath}" is not a valid directory.`);
  }

  const stats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalLines: 0,
    languages: {},
    fileList: [],
  };

  async function walk(dirPath, relativeDir = '') {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.env.example' && entry.name !== '.gitignore') {
        if (entry.name === '.git') continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        stats.totalDirectories++;
        const subChildren = await walk(fullPath, relativePath);
        children.push({
          name: entry.name,
          type: 'directory',
          path: fullPath,
          relativePath,
          children: subChildren,
        });
      } else if (entry.isFile()) {
        if (IGNORED_FILES.has(entry.name)) continue;

        const ext = path.extname(entry.name).toLowerCase();
        const language = EXTENSION_LANGUAGE_MAP[ext] || 'Text';

        let lineCount = 0;
        let fileSize = 0;
        try {
          const fileStat = await fs.stat(fullPath);
          fileSize = fileStat.size;

          // Only count lines for non-binary files under 1MB
          if (fileSize < 1024 * 1024) {
            const content = await fs.readFile(fullPath, 'utf-8');
            lineCount = content.split('\n').length;
            stats.totalLines += lineCount;
          }
        } catch {
          // Skip if binary or unreadable
        }

        stats.totalFiles++;
        stats.languages[language] = (stats.languages[language] || 0) + 1;
        stats.fileList.push({
          relativePath,
          fullPath,
          language,
          lines: lineCount,
          size: fileSize,
        });

        children.push({
          name: entry.name,
          type: 'file',
          path: fullPath,
          relativePath,
          extension: ext,
          language,
          lines: lineCount,
          size: fileSize,
        });
      }
    }

    // Sort folders first, then alphabetically
    children.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    return children;
  }

  const tree = await walk(resolvedPath);

  return {
    rootPath: resolvedPath,
    stats,
    tree,
  };
}

/**
 * Read the content of a single file safely within the scanned project root
 */
export async function getFileContent(rootPath, relativeFilePath) {
  const safeRoot = path.resolve(rootPath);
  const targetFile = path.resolve(safeRoot, relativeFilePath);

  // Path traversal guard
  if (!targetFile.startsWith(safeRoot)) {
    throw new Error('Access denied: Path traversal attempted.');
  }

  const stat = await fs.stat(targetFile);
  if (!stat.isFile()) {
    throw new Error(`"${relativeFilePath}" is not a file.`);
  }

  const content = await fs.readFile(targetFile, 'utf-8');
  return {
    relativePath: relativeFilePath.replace(/\\/g, '/'),
    fullPath: targetFile,
    content,
    lines: content.split('\n').length,
    size: stat.size,
  };
}
