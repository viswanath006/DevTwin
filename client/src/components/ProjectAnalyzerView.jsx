import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Flame,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';

function TreeNode({ node, onSelectFile, selectedFile, level = 0 }) {
  const [isOpen, setIsOpen] = useState(level < 2);

  if (node.type === 'directory') {
    return (
      <div>
        <div
          className="tree-node"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isOpen ? (
            <FolderOpen size={16} color="var(--accent-blue)" />
          ) : (
            <Folder size={16} color="var(--accent-blue)" />
          )}
          <span>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div>
            {node.children.map((child, idx) => (
              <TreeNode
                key={idx}
                node={child}
                onSelectFile={onSelectFile}
                selectedFile={selectedFile}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFile?.relativePath === node.relativePath;
  return (
    <div
      className={`tree-node ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: `${level * 16 + 22}px` }}
      onClick={() => onSelectFile(node)}
    >
      <FileCode size={15} color={isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
      <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {node.name}
      </span>
      {node.lines > 0 && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {node.lines}L
        </span>
      )}
    </div>
  );
}

export default function ProjectAnalyzerView({
  scanData,
  onNavigateToImpact,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);
  const [copied, setCopied] = useState(false);

  const tree = scanData?.tree || [];
  const graph = scanData?.graph || {};

  const handleSelectFile = async (node) => {
    setSelectedFile(node);
    setLoadingFile(true);
    try {
      const res = await api.getFileContent(node.relativePath, scanData?.rootPath);
      if (res.success) {
        setFileContent(res.data.content);
      }
    } catch (err) {
      setFileContent(`// Error loading file: ${err.message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  // Pick first file automatically if none selected
  useEffect(() => {
    if (!selectedFile && scanData?.stats?.fileList?.length > 0) {
      const firstCodeFile =
        scanData.stats.fileList.find(
          (f) =>
            f.relativePath.includes('src/') ||
            f.relativePath.endsWith('.js') ||
            f.relativePath.endsWith('.jsx')
        ) || scanData.stats.fileList[0];
      if (firstCodeFile) {
        handleSelectFile(firstCodeFile);
      }
    }
  }, [scanData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fileNode = selectedFile ? graph[selectedFile.relativePath] : null;
  const importsList = fileNode?.imports || [];
  const callersList = fileNode?.importedBy || [];
  const externalPackages = fileNode?.externalPackages || [];

  return (
    <div className="view-content" style={{ padding: '16px' }}>
      <div className="split-layout">
        {/* Left: File Tree Explorer */}
        <div className="panel-container">
          <div className="panel-header">
            <span style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--accent-cyan)" />
              Codebase Explorer
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {scanData?.stats?.totalFiles || 0} files
            </span>
          </div>

          <div className="panel-body" style={{ padding: '8px 4px' }}>
            {tree.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px' }}>
                No files found. Please scan a repository directory.
              </div>
            ) : (
              tree.map((node, i) => (
                <TreeNode
                  key={i}
                  node={node}
                  onSelectFile={handleSelectFile}
                  selectedFile={selectedFile}
                />
              ))
            )}
          </div>
        </div>

        {/* Center & Right: File Viewer & Dependency Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
          {/* File Viewer */}
          <div className="panel-container" style={{ flex: '1 1 65%' }}>
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={16} color="var(--accent-cyan)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff' }}>
                  {selectedFile ? selectedFile.relativePath : 'Select a file to inspect'}
                </span>
                {selectedFile?.language && (
                  <span className="badge badge-purple">{selectedFile.language}</span>
                )}
              </div>

              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{ height: '32px', padding: '0 10px', fontSize: '0.78rem' }}
                    onClick={handleCopy}
                  >
                    {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    className="btn-secondary"
                    style={{ height: '32px', padding: '0 10px', fontSize: '0.78rem', color: 'var(--accent-amber)' }}
                    onClick={() => onNavigateToImpact(selectedFile.relativePath)}
                  >
                    <Flame size={14} /> Check Blast Radius
                  </button>
                </div>
              )}
            </div>

            <div className="panel-body" style={{ padding: '0', background: 'var(--bg-code)' }}>
              {loadingFile ? (
                <div style={{ padding: '24px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Reading file from local twin...
                </div>
              ) : selectedFile ? (
                <div className="code-viewer" style={{ border: 'none', borderRadius: '0', margin: '0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {fileContent.split('\n').map((line, idx) => (
                        <tr key={idx} style={{ lineHeight: '1.6' }}>
                          <td
                            style={{
                              width: '45px',
                              textAlign: 'right',
                              paddingRight: '16px',
                              color: 'var(--text-muted)',
                              userSelect: 'none',
                              fontSize: '0.75rem',
                              verticalAlign: 'top',
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {line || ' '}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Select any file from the explorer on the left to inspect its code and dependency relationships.
                </div>
              )}
            </div>
          </div>

          {/* Dependency Inspector Card */}
          {selectedFile && (
            <div className="panel-container" style={{ flex: '0 0 auto', maxHeight: '200px' }}>
              <div className="panel-header" style={{ padding: '10px 16px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Dependency Twin Inspector: {selectedFile.relativePath.split('/').pop()}
                </span>
                <span className="badge badge-blue">
                  {callersList.length} Callers / {importsList.length} Imports
                </span>
              </div>

              <div className="panel-body" style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                    DEPENDENT CALLERS ({callersList.length})
                  </div>
                  {callersList.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No callers registered</div>
                  ) : (
                    callersList.map((c) => (
                      <div
                        key={c}
                        style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)', cursor: 'pointer', padding: '2px 0' }}
                        onClick={() => handleSelectFile({ relativePath: c })}
                      >
                        ← {c}
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                    LOCAL IMPORTS ({importsList.length})
                  </div>
                  {importsList.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No local dependencies</div>
                  ) : (
                    importsList.map((imp) => (
                      <div
                        key={imp}
                        style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', cursor: 'pointer', padding: '2px 0' }}
                        onClick={() => handleSelectFile({ relativePath: imp })}
                      >
                        → {imp}
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                    EXTERNAL PACKAGES ({externalPackages.length})
                  </div>
                  {externalPackages.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>None</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {externalPackages.map((p) => (
                        <span key={p} className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
