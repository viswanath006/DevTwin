import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  Header,
  Footer,
  DashboardView,
  ProjectAnalyzerView,
  AIDebuggerView,
  ImpactAnalyzerView,
  TestVerificationView,
  SecurityScannerView,
  CodeReviewView,
  AskCodebaseView,
  GitIntelligenceView,
  ArchitectureView,
  WhatIfAnalysisView,
  MasterReferenceView,
  LoginView,
} from './components';
import { api } from './api/client';

export default function App() {
  // Demo Authentication State (stored safely in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('devtwin_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [repoPath, setRepoPath] = useState('C:/Users/viswa/Desktop/DevTwin/sample-projects/demo-polyglot');
  const [scanData, setScanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);

  // Shared workflow context across Debugger, Impact Analyzer, and Verification
  const [sharedFixContext, setSharedFixContext] = useState({
    targetFile: 'src/repositories/userRepository.js',
    initialError: "500 Internal Server Error: DatabaseValidationError: Column 'user_id' does not exist. Expected 'id'.",
    initialLogs: `500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'.\n    at UserRepository.findById (src/repositories/userRepository.js:34:13)\n    at UserService.getUserProfile (src/services/userService.js:18:38)\n    at userController.getUser (src/api/userController.js:19:35)`,
    proposedPatch: `--- a/src/repositories/userRepository.js\n+++ b/src/repositories/userRepository.js\n@@ -32,5 +32,5 @@\n-    const primaryKey = record['user_id'];\n+    const primaryKey = record['id'];\n     return {\n-      id: record['user_id'],\n+      id: record['id'],\n       email: record.email,`,
    recommendedTests: ['tests/user.test.js', 'tests/auth.test.js'],
    testFile: 'tests/run_demo_tests.js',
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

  // Check health on mount and establish background connection
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
   * Load Demo Mode SaaS Application
   */
  const handleLoadDemoProject = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await api.loadDemoProject();
      if (res.success) {
        setScanData(res.data);
        setRepoPath(res.data.rootPath);

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

  // Seamless navigation handlers connecting the primary journey
  const handleNavigateToDebugger = (filePath, error) => {
    setSharedFixContext((prev) => ({
      ...prev,
      targetFile: filePath || prev.targetFile,
      initialError: error || prev.initialError,
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

  const handleLogout = () => {
    localStorage.removeItem('devtwin_auth');
    setCurrentUser(null);
  };

  // If user is not logged in, present clean Demo Developer Login experience
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('dashboard');
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#08090C' }}>
      {/* Left Slim Rail Dock */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        onLoadDemo={handleLoadDemoProject}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Canvas Area */}
      <main className="ref-canvas" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Dynamic Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          repoPath={repoPath}
          onScan={handleScan}
          onFolderUpload={handleFolderUpload}
          onLoadDemo={handleLoadDemoProject}
          isScanning={isScanning}
          stats={scanData?.stats}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* View Routing with smooth enter animations */}
        <div className="view-enter" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              scanData={scanData}
              onScan={handleScan}
              onLoadDemo={handleLoadDemoProject}
              isScanning={isScanning}
              onNavigateToTab={setActiveTab}
              onNavigateToDebugger={handleNavigateToDebugger}
              onNavigateToImpact={handleNavigateToImpact}
              onNavigateToVerification={handleNavigateToVerification}
            />
          )}

          {activeTab === 'twin-details' && (
            <MasterReferenceView
              scanData={scanData}
              onNavigateToTab={setActiveTab}
              embedded={true}
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
              onNavigateToCodebase={() => setActiveTab('codebase')}
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

        {/* Minimal Footer (Requirement 8) */}
        <Footer />
      </main>
    </div>
  );
}
