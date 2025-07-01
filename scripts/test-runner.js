#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all test types: Unit, Integration, E2E, Health Checks
 * Supports local development and CI/CD environments
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  environment: process.env.NODE_ENV || 'development',
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9002',
  skipE2E: process.env.SKIP_E2E === 'true',
  ci: process.env.CI === 'true',
  coverage: process.env.COVERAGE === 'true' || process.argv.includes('--coverage'),
  watch: process.argv.includes('--watch'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  testType: process.argv.find(arg => ['unit', 'integration', 'e2e', 'all'].includes(arg)) || 'all'
};

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.exitCode = 0;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🐛'
    }[level] || '🔵';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, description, options = {}) {
    this.log(`Running: ${description}`, 'info');
    
    return new Promise((resolve, reject) => {
      const childProcess = spawn(command.split(' ')[0], command.split(' ').slice(1), {
        stdio: options.silent ? 'pipe' : 'inherit',
        shell: true,
        cwd: options.cwd || __dirname,
        env: { ...process.env, ...options.env }
      });

      let stdout = '';
      let stderr = '';

      if (options.silent) {
        childProcess.stdout.on('data', (data) => stdout += data.toString());
        childProcess.stderr.on('data', (data) => stderr += data.toString());
      }

      childProcess.on('close', (code) => {
        const duration = Date.now() - this.startTime;
        const result = { description, code, duration, stdout, stderr };
        this.results.push(result);

        if (code === 0) {
          this.log(`✅ ${description} completed (${duration}ms)`, 'success');
          resolve(result);
        } else {
          this.log(`❌ ${description} failed with code ${code}`, 'error');
          if (options.silent && stderr) {
            this.log(`Error output: ${stderr}`, 'error');
          }
          if (options.critical) {
            this.exitCode = code;
          }
          resolve(result); // Don't reject to continue other tests
        }
      });

      childProcess.on('error', (error) => {
        this.log(`❌ Failed to start ${description}: ${error.message}`, 'error');
        reject(error);
      });
    });
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...', 'info');
    
    // Check if Node.js dependencies are installed
    if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
      this.log('❌ Node modules not found. Please run: npm install', 'error');
      process.exit(1);
    }

    // Check if .env file exists
    if (!fs.existsSync(path.join(__dirname, '..', '.env'))) {
      this.log('⚠️ .env file not found. Some tests may fail.', 'warning');
    }

    // Check TypeScript compilation
    try {
      await this.runCommand('npx tsc --noEmit', 'TypeScript type checking', { silent: true });
    } catch (error) {
      this.log('⚠️ TypeScript compilation issues detected', 'warning');
    }

    this.log('✅ Prerequisites check completed', 'success');
  }

  async runUnitTests() {
    this.log('🧪 Running Unit Tests...', 'info');
    
    const jestArgs = [
      'jest',
      '--testPathPattern=(__tests__|test)\\.(js|jsx|ts|tsx)$',
      '--testPathIgnorePatterns=integration',
      '--passWithNoTests'
    ];

    if (TEST_CONFIG.coverage) {
      jestArgs.push('--coverage');
    }

    if (TEST_CONFIG.watch) {
      jestArgs.push('--watch');
    }

    if (TEST_CONFIG.ci) {
      jestArgs.push('--ci', '--watchAll=false');
    }

    if (TEST_CONFIG.verbose) {
      jestArgs.push('--verbose');
    }

    return await this.runCommand(
      `npx ${jestArgs.join(' ')}`,
      'Unit Tests (Jest)',
      { critical: true }
    );
  }

  async runIntegrationTests() {
    this.log('🔗 Running Integration Tests...', 'info');
    
    const jestArgs = [
      'jest',
      '--testPathPattern=integration',
      '--passWithNoTests'
    ];

    if (TEST_CONFIG.verbose) {
      jestArgs.push('--verbose');
    }

    return await this.runCommand(
      `npx ${jestArgs.join(' ')}`,
      'Integration Tests (Jest)',
      { critical: false }
    );
  }

  async runE2ETests() {
    if (TEST_CONFIG.skipE2E) {
      this.log('⏭️ Skipping E2E tests (SKIP_E2E=true)', 'warning');
      return { description: 'E2E Tests', code: 0, skipped: true };
    }

    this.log('🌐 Running E2E Health Check...', 'info');
    
    return await this.runCommand(
      'node health-check.js',
      'E2E Health Check',
      { 
        critical: false,
        env: {
          TEST_BASE_URL: TEST_CONFIG.baseUrl,
          NODE_ENV: TEST_CONFIG.environment
        }
      }
    );
  }

  async runLinting() {
    this.log('🔍 Running Code Quality Checks...', 'info');
    
    // ESLint
    await this.runCommand(
      'npx next lint',
      'ESLint Check',
      { critical: false, silent: true }
    );

    // TypeScript Check
    await this.runCommand(
      'npx tsc --noEmit',
      'TypeScript Check',
      { critical: false, silent: true }
    );
  }

  async generateReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const passed = this.results.filter(r => r.code === 0 || r.skipped).length;
    const failed = this.results.filter(r => r.code !== 0 && !r.skipped).length;
    const skipped = this.results.filter(r => r.skipped).length;

    this.log('\n📊 TEST SUMMARY REPORT', 'info');
    this.log('='.repeat(50), 'info');
    this.log(`🏷️  Environment: ${TEST_CONFIG.environment}`, 'info');
    this.log(`🔗 Base URL: ${TEST_CONFIG.baseUrl}`, 'info');
    this.log(`⏱️  Total Duration: ${totalDuration}ms`, 'info');
    this.log(`✅ Passed: ${passed}`, 'success');
    this.log(`❌ Failed: ${failed}`, failed > 0 ? 'error' : 'info');
    this.log(`⏭️ Skipped: ${skipped}`, 'warning');

    if (failed > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.results
        .filter(r => r.code !== 0 && !r.skipped)
        .forEach(r => {
          this.log(`   • ${r.description} (code: ${r.code})`, 'error');
        });
    }

    this.log('\n📋 ALL RESULTS:', 'info');
    this.results.forEach(r => {
      const status = r.skipped ? '⏭️' : r.code === 0 ? '✅' : '❌';
      const extra = r.skipped ? ' (skipped)' : ` (${r.duration}ms)`;
      this.log(`   ${status} ${r.description}${extra}`, 'info');
    });

    // Generate JSON report for CI/CD
    if (TEST_CONFIG.ci) {
      const report = {
        timestamp: new Date().toISOString(),
        environment: TEST_CONFIG.environment,
        baseUrl: TEST_CONFIG.baseUrl,
        duration: totalDuration,
        summary: { passed, failed, skipped, total: this.results.length },
        results: this.results,
        success: failed === 0
      };

      const reportPath = path.join(__dirname, '..', 'test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`📄 Test report saved to: ${reportPath}`, 'info');
    }

    const overall = failed === 0 ? 'HEALTHY' : 'UNHEALTHY';
    const emoji = failed === 0 ? '🟢' : '🔴';
    this.log(`\n${emoji} Overall Status: ${overall}`, failed === 0 ? 'success' : 'error');

    return failed === 0;
  }

  async run() {
    try {
      this.log('🚀 Starting Comprehensive Test Suite...', 'info');
      this.log(`🏷️  Test Type: ${TEST_CONFIG.testType}`, 'info');
      this.log(`🌐 Target: ${TEST_CONFIG.baseUrl}`, 'info');
      this.log(`🏷️  Environment: ${TEST_CONFIG.environment}`, 'info');
      this.log('='.repeat(50), 'info');

      await this.checkPrerequisites();

      // Run different test types based on configuration
      if (TEST_CONFIG.testType === 'all' || TEST_CONFIG.testType === 'unit') {
        await this.runUnitTests();
      }

      if (TEST_CONFIG.testType === 'all' || TEST_CONFIG.testType === 'integration') {
        await this.runIntegrationTests();
      }

      if (TEST_CONFIG.testType === 'all' || TEST_CONFIG.testType === 'e2e') {
        await this.runE2ETests();
      }

      if (TEST_CONFIG.testType === 'all') {
        await this.runLinting();
      }

      const success = await this.generateReport();
      
      if (!success) {
        this.log('🚨 Some tests failed!', 'error');
        process.exit(this.exitCode || 1);
      } else {
        this.log('🎉 All tests passed!', 'success');
        process.exit(0);
      }

    } catch (error) {
      this.log(`💥 Test runner failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;
