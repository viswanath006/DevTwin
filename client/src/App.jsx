import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ProjectAnalyzerView from './components/ProjectAnalyzerView';
import AIDebuggerView from './components/AIDebuggerView';
import ImpactAnalyzerView from './components/ImpactAnalyzerView';
import TestVerificationView from './components/TestVerificationView';
import SecurityScannerView from './components/SecurityScannerView';
import CodeReviewView from './components/CodeReviewView';
import AskCodebaseView from './components/AskCodebaseView';
import GitIntelligenceView from './components/GitIntelligenceView';
import ArchitectureView from './components/ArchitectureView';
import WhatIfAnalysisView from './components/WhatIfAnalysisView';
import MasterReferenceView from './components/MasterReferenceView';
import { api } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [repoPath, setRepoPath] = useState('C:/Users/viswa/Desktop/DevTwin/sample-projects/demo-polyglot');
  const [scanData, setScanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Shared workflow context across Debugger, Impact Analyzer, and Verification
  const [sharedFixContext, setSharedFixContext] = useState({
    targetFile: 'sample-projects/demo-polyglot/services/broken_calculator.py',
    proposedPatch: '',
    recommendedTests: [],
    testFile: 'sample-projects/demo-polyglot/tests/test_calculator.py',
    command: 'devtwin-verify all',
    verificationResult: null,
  });

  const checkServerConnection = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  };

  const handleScan = async (pathOverride) => {
    const target = pathOverride || repoPath;
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await api.scanCodebase(target);
      if (res.success) {
        setScanData(res.data);
      } else {
        setScanError(res.error || 'Failed to scan repository.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Error communicating with server.');
    } finally {
      setIsScanning(false);
    }
  };

  // Check health and establish connection on mount
  useEffect(() => {
    checkServerConnection();
    const interval = setInterval(checkServerConnection, 8000);
    return () => clearInterval(interval);
  }, []);

  // Initial auto-scan on startup
  useEffect(() => {
    handleScan();
  }, []);

  const handleFolderUpload = async (projectName, files) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await api.uploadCodebase({ projectName, files });
      if (res.success) {
        setScanData(res.data);
        setRepoPath(res.data.rootPath);
      } else {
        setScanError(res.error || 'Failed to upload and analyze files.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setScanError(err.message || 'Error uploading files.');
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * Phase 9: Demo Mode - Loads built-in SaaS application with database key error
   * Executes through the exact same scanning, AST parsing, and AI analysis pipeline
   */
  const handleLoadDemoProject = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await api.loadDemoProject();
      if (res.success) {
        setScanData(res.data);
        setRepoPath(res.data.rootPath);

        // Pre-configure shared workflow context for the 14-step demo journey
        if (res.data.demoScenario) {
          setSharedFixContext({
            targetFile: res.data.demoScenario.targetFile,
            initialError: res.data.demoScenario.error,
            initialLogs: res.data.demoScenario.logs,
            proposedPatch: `--- a/src/repositories/userRepository.js\n+++ b/src/repositories/userRepository.js\n@@ -32,5 +32,5 @@\n-    const primaryKey = record['user_id'];\n+    const primaryKey = record['id'];\n     return {\n-      id: record['user_id'],\n+      id: record['id'],\n       email: record.email,`,
            recommendedTests: ['tests/user.test.js', 'tests/auth.test.js'],
            testFile: 'tests/run_demo_tests.js',
            command: 'devtwin-verify all',
            verificationResult: null,
          });
        }
        setActiveTab('dashboard');
      } else {
        setScanError(res.error || 'Failed to load demo project.');
      }
    } catch (err) {
      console.error('Demo load error:', err);
      setScanError(err.message || 'Error loading demo project.');
    } finally {
      setIsScanning(false);
    }
  };

  // Seamless navigation handlers connecting the 14-step primary journey
  const handleNavigateToDebugger = (filePath, error) => {
    setSharedFixContext((prev) => ({
      ...prev,
      targetFile: filePath || prev.targetFile,
      error: error || prev.error,
    }));
    setActiveTab('debugger');
  };

  const handleNavigateToVerification = (testFile, command) => {
    setSharedFixContext((prev) => ({
      ...prev,
      testFile: testFile || prev.testFile,
      command: command || prev.command,
    }));
    setActiveTab('verification');
  };

  const handleNavigateToImpact = (filePath, patch) => {
    setSharedFixContext((prev) => ({
      ...prev,
      targetFile: filePath || prev.targetFile,
      proposedPatch: patch || prev.proposedPatch,
    }));
    setActiveTab('impact');
  };

  if (activeTab === 'dashboard') {
    return (
      <MasterReferenceView
        scanData={scanData}
        onNavigateToTab={setActiveTab}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        isConnected={isConnected}
        onLoadDemo={handleLoadDemoProject}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          repoPath={repoPath}
          setRepoPath={setRepoPath}
          onScan={handleScan}
          onFolderUpload={handleFolderUpload}
          onLoadDemo={handleLoadDemoProject}
          isScanning={isScanning}
          stats={scanData?.stats}
        />

        {/* View Routing */}
        {activeTab === 'dashboard' && (
          <DashboardView
            scanData={scanData}
            setActiveTab={setActiveTab}
            onScan={handleScan}
            onLoadDemo={handleLoadDemoProject}
            isScanning={isScanning}
            error={scanError}
            onNavigateToDebugger={handleNavigateToDebugger}
            onNavigateToImpact={handleNavigateToImpact}
            onNavigateToVerification={handleNavigateToVerification}
          />
        )}

        {(activeTab === 'codebase' || activeTab === 'analyzer') && (
          <ProjectAnalyzerView
            scanData={scanData}
            onNavigateToImpact={handleNavigateToImpact}
            onNavigateToDebugger={handleNavigateToDebugger}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView
            scanData={scanData}
            onNavigateToCodebase={(file) => {
              setActiveTab('codebase');
            }}
            onNavigateToDebugger={handleNavigateToDebugger}
            onNavigateToImpact={handleNavigateToImpact}
            onLoadDemo={handleLoadDemoProject}
          />
        )}

        {activeTab === 'debugger' && (
          <AIDebuggerView
            scanData={scanData}
            initialFile={sharedFixContext.targetFile}
            initialError={sharedFixContext.initialError}
            initialLogs={sharedFixContext.initialLogs}
            onNavigateToImpact={handleNavigateToImpact}
            onNavigateToVerification={handleNavigateToVerification}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactAnalyzerView
            scanData={scanData}
            targetFileProp={sharedFixContext.targetFile}
            initialDiffProp={sharedFixContext.proposedPatch}
          />
        )}

        {activeTab === 'verification' && (
          <TestVerificationView
            scanData={scanData}
            initialTestFile={sharedFixContext.testFile}
            onVerificationComplete={(result) => {
              setSharedFixContext((prev) => ({ ...prev, verificationResult: result }));
            }}
          />
        )}

        {activeTab === 'security' && (
          <SecurityScannerView
            scanData={scanData}
            onNavigateToAnalyzer={(filePath) => {
              setActiveTab('analyzer');
            }}
            onNavigateToDebugger={handleNavigateToDebugger}
          />
        )}

        {activeTab === 'review' && (
          <CodeReviewView
            scanData={scanData}
            onNavigateToDebugger={handleNavigateToDebugger}
            onNavigateToSecurity={() => setActiveTab('security')}
          />
        )}

        {activeTab === 'ask' && (
          <AskCodebaseView
            scanData={scanData}
            onNavigateToDebugger={handleNavigateToDebugger}
            onNavigateToImpact={handleNavigateToImpact}
          />
        )}

        {activeTab === 'git' && (
          <GitIntelligenceView
            scanData={scanData}
          />
        )}

        {activeTab === 'whatif' && (
          <WhatIfAnalysisView
            scanData={scanData}
            onNavigateToDebugger={handleNavigateToDebugger}
          />
        )}
      </div>
    </div>
  );
}
