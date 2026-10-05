import React, { useRef } from 'react';
import { FolderSearch, RefreshCw, Upload, Sparkles } from 'lucide-react';

export default function Header({
  repoPath,
  setRepoPath,
  onScan,
  onFolderUpload,
  onLoadDemo,
  isScanning,
  stats,
}) {
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onScan();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = [];
    let projectName = 'uploaded-project';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = file.webkitRelativePath || file.name;
      if (!projectName && relPath.includes('/')) projectName = relPath.split('/')[0];
      if (file.size < 1024 * 1024) {
        try {
          const content = await file.text();
          fileArray.push({ path: relPath, content });
        } catch {}
      }
    }
    if (fileArray.length > 0) onFolderUpload(projectName, fileArray);
  };

  return (
    <header className="top-header">
      <form onSubmit={handleSubmit} className="repo-bar">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <FolderSearch
            size={14}
            style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="input-box"
            style={{ paddingLeft: 30 }}
            placeholder="Repository path (e.g. C:/Users/.../my-project)"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-secondary" disabled={isScanning}>
          <RefreshCw size={13} className={isScanning ? 'spin' : ''} />
          {isScanning ? 'Analyzing…' : 'Scan'}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          title="Upload local project folder"
        >
          <Upload size={13} />
          Upload
        </button>

        <button
          type="button"
          className="btn-demo"
          onClick={() => onLoadDemo && onLoadDemo()}
          disabled={isScanning}
          title="Load built-in demo project with database key defect"
        >
          <Sparkles size={13} />
          Demo
        </button>
      </form>

      {/* Project stats — minimal */}
      {stats && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 16 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{stats.totalFiles || 0}</span> files
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {(stats.totalLines || 0).toLocaleString()}
            </span>{' '}
            lines
          </span>
        </div>
      )}
    </header>
  );
}
