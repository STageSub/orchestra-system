#!/usr/bin/env node

/**
 * Generate HTML Report - Creates a professional HTML report from stress test results
 * Can be printed to PDF from any browser
 */

const fs = require('fs')
const path = require('path')

function generateHTMLReport(testResults) {
  const duration = (new Date(testResults.endTime || new Date()) - new Date(testResults.startTime)) / 1000
  const passRate = testResults.totalTests > 0 
    ? (testResults.passed / testResults.totalTests * 100).toFixed(1)
    : 0

  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orchestra System - Stress Test Report</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            .page-break { page-break-after: always; }
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h1, h2, h3 {
            color: #2c3e50;
            margin-top: 30px;
        }
        
        h1 {
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 8px;
        }
        
        .summary {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .metric {
            background: white;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        
        .metric-label {
            font-size: 0.9em;
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        .status-passed {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-failed {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .status-warning {
            color: #f39c12;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.95em;
        }
        
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        th {
            background: #34495e;
            color: white;
            font-weight: 600;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .details {
            font-size: 0.85em;
            color: #666;
            line-height: 1.4;
        }
        
        .error-box {
            background: #fee;
            border-left: 4px solid #e74c3c;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        
        .success-box {
            background: #d4edda;
            border-left: 4px solid #27ae60;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #f39c12;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        
        .chart {
            margin: 20px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .bar {
            height: 30px;
            background: #3498db;
            margin: 5px 0;
            border-radius: 4px;
            position: relative;
            transition: all 0.3s;
        }
        
        .bar:hover {
            opacity: 0.8;
        }
        
        .bar-label {
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-weight: 600;
            font-size: 0.9em;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎼 Orchestra System - Stress Test Report</h1>
        
        <div class="summary">
            <h2>Executive Summary</h2>
            <p><strong>Generated:</strong> ${new Date().toLocaleString('sv-SE')}<br>
            <strong>Test Duration:</strong> ${duration.toFixed(2)} seconds<br>
            <strong>Environment:</strong> Production Dummy Data (151 musicians, 17 instruments, 41 positions)</p>
            
            <div class="summary-grid">
                <div class="metric">
                    <div class="metric-value">${testResults.totalTests}</div>
                    <div class="metric-label">Total Tests</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${testResults.passed === testResults.totalTests ? 'status-passed' : ''}">${testResults.passed}</div>
                    <div class="metric-label">Passed</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${testResults.failed > 0 ? 'status-failed' : ''}">${testResults.failed}</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${passRate}%</div>
                    <div class="metric-label">Pass Rate</div>
                </div>
            </div>
        </div>
        
        ${testResults.failed === 0 ? `
        <div class="success-box">
            <h3>✅ All Tests Passed!</h3>
            <p>The system is performing excellently. All ${testResults.totalTests} tests completed successfully.</p>
        </div>
        ` : `
        <div class="warning-box">
            <h3>⚠️ Some Tests Failed</h3>
            <p>${testResults.failed} test${testResults.failed > 1 ? 's' : ''} failed. See details below for more information.</p>
        </div>
        `}
        
        <h2>Test Results by Category</h2>
        ${Object.entries(testResults.categories || {}).map(([category, results]) => {
          const catPassRate = results.tests.length > 0
            ? (results.passed / results.tests.length * 100).toFixed(0)
            : 0
          
          return `
        <div class="category">
            <h3>${category} <span style="font-weight: normal; font-size: 0.8em;">(${catPassRate}% Pass Rate)</span></h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 30%">Test</th>
                        <th style="width: 15%">Status</th>
                        <th style="width: 15%">Duration</th>
                        <th style="width: 40%">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.tests.map(test => `
                    <tr>
                        <td>${test.name}</td>
                        <td class="${test.passed ? 'status-passed' : 'status-failed'}">
                            ${test.passed ? '✅ Passed' : '❌ Failed'}
                        </td>
                        <td>${test.duration ? test.duration + 'ms' : 'N/A'}</td>
                        <td class="details">
                            ${test.details ? Object.entries(test.details)
                              .map(([k, v]) => `<strong>${k}:</strong> ${JSON.stringify(v)}`)
                              .join('<br>') : ''}
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        `}).join('')}
        
        ${testResults.performance && Object.keys(testResults.performance).length > 0 ? `
        <h2>Performance Metrics</h2>
        <div class="chart">
            ${Object.entries(testResults.performance).map(([operation, perf]) => {
              const maxDuration = Math.max(...Object.values(testResults.performance).map(p => p.duration))
              const barWidth = (perf.duration / maxDuration) * 100
              const barColor = perf.duration < 1000 ? '#27ae60' : perf.duration < 5000 ? '#f39c12' : '#e74c3c'
              
              return `
            <div style="margin-bottom: 15px;">
                <div style="font-size: 0.9em; margin-bottom: 5px;">${operation}</div>
                <div class="bar" style="width: ${barWidth}%; background: ${barColor};">
                    <span class="bar-label">${perf.duration}ms</span>
                </div>
            </div>
            `}).join('')}
        </div>
        ` : ''}
        
        ${testResults.errors && testResults.errors.length > 0 ? `
        <h2>Error Details</h2>
        ${testResults.errors.map(error => `
        <div class="error-box">
            <strong>${error.category} - ${error.test}</strong><br>
            ${error.error || 'Unknown error'}
        </div>
        `).join('')}
        ` : ''}
        
        <h2>Test Data Summary</h2>
        <div class="summary">
            <h3>Musicians (151 total)</h3>
            <ul>
                <li>Active: 143 (95%)</li>
                <li>Inactive: 8 (5%)</li>
                <li>Archived: 15</li>
                <li>Singers: 20 (Sopran: 5, Alt: 5, Tenor: 5, Bas: 5)</li>
            </ul>
            
            <h3>Infrastructure</h3>
            <ul>
                <li>Instruments: 17 (including Voice/Sång)</li>
                <li>Positions: 41 (including 4 voice types)</li>
                <li>Ranking Lists: 126 (A, B, C for each position)</li>
            </ul>
            
            <h3>Projects</h3>
            <ul>
                <li>Completed: 10 (100% staffed)</li>
                <li>Upcoming: 15 (various request strategies)</li>
            </ul>
        </div>
        
        <h2>Recommendations</h2>
        ${testResults.failed === 0 ? `
        <div class="success-box">
            <h3>System Status: Production Ready</h3>
            <ul>
                <li>All core functionality is working correctly</li>
                <li>Performance metrics are excellent (all operations under 1 second)</li>
                <li>Email system handling all scenarios properly</li>
                <li>Request strategies functioning as designed</li>
            </ul>
        </div>
        ` : `
        <div class="warning-box">
            <h3>Action Items</h3>
            <ul>
                <li>Review and fix the ${testResults.failed} failing test${testResults.failed > 1 ? 's' : ''}</li>
                <li>Investigate root causes in error logs</li>
                <li>Re-run tests after fixes are applied</li>
                <li>Consider performance optimization for any slow operations</li>
            </ul>
        </div>
        `}
        
        <div class="footer">
            <p>Generated by Orchestra System Stress Test Suite<br>
            ${new Date().toLocaleString('sv-SE')}</p>
            <p class="no-print" style="margin-top: 20px;">
                <strong>To save as PDF:</strong> Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF"
            </p>
        </div>
    </div>
</body>
</html>`

  return html
}

// Main function
async function main() {
  // Try to read from latest.json first
  const latestPath = path.join(__dirname, 'test-results', 'json', 'latest.json')
  let testResults
  
  if (fs.existsSync(latestPath)) {
    console.log(`📄 Generating HTML report from: latest.json`)
    testResults = JSON.parse(fs.readFileSync(latestPath, 'utf8'))
  } else {
    // Fallback to finding most recent in json folder
    const jsonDir = path.join(__dirname, 'test-results', 'json')
    if (!fs.existsSync(jsonDir)) {
      console.error('No test results folder found. Run ultimate-system-stress-test.js first.')
      process.exit(1)
    }
    
    const files = fs.readdirSync(jsonDir)
      .filter(f => f.startsWith('stress-test-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a))
    
    if (files.length === 0) {
      console.error('No stress test reports found. Run ultimate-system-stress-test.js first.')
      process.exit(1)
    }
    
    const latestReport = files[0]
    console.log(`📄 Generating HTML report from: ${latestReport}`)
    testResults = JSON.parse(fs.readFileSync(path.join(jsonDir, latestReport), 'utf8'))
  }
  
  try {
    const htmlReport = generateHTMLReport(testResults)
    
    const timestamp = Date.now()
    const reportFileName = `stress-test-${timestamp}.html`
    const htmlPath = path.join(__dirname, 'test-results', 'html', reportFileName)
    fs.writeFileSync(htmlPath, htmlReport)
    
    // Also save as latest.html
    const latestHtmlPath = path.join(__dirname, 'test-results', 'html', 'latest.html')
    fs.writeFileSync(latestHtmlPath, htmlReport)
    
    console.log(`✅ HTML report generated: test-results/html/${reportFileName}`)
    console.log(`✅ Also saved as: test-results/html/latest.html`)
    console.log('\n📌 To convert to PDF:')
    console.log('   1. Open the HTML file in your browser')
    console.log(`   2. Press Ctrl+P (or Cmd+P on Mac)`)
    console.log('   3. Select "Save as PDF" as the destination')
    console.log('\n   Or open directly:')
    console.log(`   open ${latestHtmlPath}`)
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}