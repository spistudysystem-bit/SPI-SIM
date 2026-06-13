import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LectureScript } from '../constants/lectures';
import { DynamicInteractiveDiagram } from '../components/shared/NarratorPanel';

export interface ExporterOptions {
  theme: 'cosmic' | 'minimalist';
  combine: boolean;
  selectedLectureId?: string;
}

/**
 * Parses raw text script and breaks it into paragraphs, highlighting high-yield mnemonics and terms.
 */
function formatScriptToHTML(script: string, images?: {url: string; caption: string; triggerParagraph?: number}[]): string {
  // Split script by newlines and clean empty elements
  const paragraphs = script
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return paragraphs
    .map((para, index) => {
      // Clean duplicate whitespaces
      let cleaned = para.replace(/\s+/g, ' ');

      // Highlight common high-yield terms and mnemonics
      const keyTerms = [
        'LARRD', 'LATA', 'ALARA', 'Nyquist Limit', 'SDF', 'SPL', 'PRF', 'PRP',
        'Fresnel', 'Fraunhofer', "Snell's Law", "Huygens' Principle", 'Beam Former',
        'electronic steering', 'apodization', 'dynamic receive focusing', 'demodulation'
      ];

      keyTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'g');
        cleaned = cleaned.replace(regex, '<span class="highlight-term">$1</span>');
      });

      // Format bullet lists within the paragraph if it is acting like one
      if (cleaned.includes('Part 1:') || cleaned.includes('Part 2:') || cleaned.includes('Part 3:') || cleaned.includes('Part 4:')) {
        cleaned = cleaned.replace(/(Part \\d+: [^.]+)/g, '<strong class="sub-chapter-node">$1</strong>');
      }

      let htmlPara = `<p class="lecture-para">${cleaned}</p>`;

      if (images) {
        images.forEach(img => {
          if (img.triggerParagraph === index) {
            let svgMarkup = '';
            try {
              // Extract the SVG string using ReactDOMServer
              svgMarkup = renderToStaticMarkup(React.createElement(DynamicInteractiveDiagram, { url: img.url, caption: img.caption }));
            } catch (e) {
              console.error(e);
            }
            
            htmlPara += `
              <div class="binder-visual">
                <div class="visual-placeholder">
                  ${svgMarkup || `<span class="visual-text">[ DIAGRAM: ${img.url.toUpperCase()} ]</span>`}
                </div>
                <p class="visual-caption"><strong>Figure:</strong> ${img.caption}</p>
              </div>
            `;
          }
        });
      }

      return htmlPara;
    })
    .join('\n');
}

/**
 * Returns complete interactive HTML source code for the requested lectures.
 */
export function generateStyledHTML(lectures: LectureScript[], options: ExporterOptions): string {
  const { theme, combine, selectedLectureId } = options;
  
  // Filter lectures according to selected scope
  const targetLectures = combine 
    ? lectures 
    : lectures.filter(l => l.id === selectedLectureId);

  const documentTitle = combine 
    ? 'ARDMS SPI Complete Clinical Lecture Binder' 
    : `${targetLectures[0]?.title || 'Clinical Lecture'} — SPI Study Deck`;

  // Color profiles
  const isCosmic = theme === 'cosmic';
  
  // Custom Stylesheet
  const styles = `
    :root {
      --bg-color: ${isCosmic ? '#090a0f' : '#f8fafc'};
      --card-bg: ${isCosmic ? '#11131a' : '#ffffff'};
      --text-main: ${isCosmic ? '#e2e8f0' : '#1e293b'};
      --text-muted: ${isCosmic ? '#8e9299' : '#64748b'};
      --accent-color: ${isCosmic ? '#00d1ff' : '#0284c7'};
      --accent-glow: ${isCosmic ? 'rgba(0, 209, 255, 0.15)' : 'rgba(2, 132, 199, 0.08)'};
      --gold-color: ${isCosmic ? '#ffd700' : '#d97706'};
      --border-color: ${isCosmic ? '#2d3139' : '#cbd5e1'};
      --tag-bg: ${isCosmic ? 'rgba(0, 209, 255, 0.08)' : 'rgba(2, 132, 199, 0.05)'};
      --success-color: ${isCosmic ? '#10b981' : '#15803d'};
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.625;
      padding: 40px 24px;
      font-size: 15px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    /* Cover Page */
    .cover-page {
      text-align: center;
      padding: 80px 40px;
      border: 2px solid var(--border-color);
      background-color: var(--card-bg);
      border-radius: 16px;
      margin-bottom: 60px;
      position: relative;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
    }

    .cover-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 3px;
      color: var(--accent-color);
      text-transform: uppercase;
      padding: 4px 12px;
      border: 1px solid var(--accent-color);
      border-radius: 4px;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      line-height: 1.25;
      margin-bottom: 16px;
      color: ${isCosmic ? '#ffffff' : '#0f172a'};
    }

    .cover-subtitle {
      font-size: 14px;
      color: var(--text-muted);
      max-width: 500px;
      margin: 0 auto 40px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-metadata {
      display: flex;
      justify-content: center;
      gap: 32px;
      border-top: 1px solid var(--border-color);
      padding-top: 30px;
      font-family: monospace;
      font-size: 12px;
      color: var(--text-muted);
    }

    .metadata-val {
      color: var(--text-main);
      font-weight: bold;
    }

    /* Index Of Scope (Multi-lecture) */
    .index-box {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 40px;
    }
    .index-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 16px;
      border-b: 1px solid var(--border-color);
      padding-bottom: 8px;
    }
    .index-list {
      list-style-type: none;
      display: grid;
      grid-template-cols: 1fr;
      gap: 8px;
    }
    @media (min-width: 600px) {
      .index-list {
        grid-template-cols: 1fr 1fr;
      }
    }
    .index-item a {
      color: var(--accent-color);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    .index-item a:hover {
      text-decoration: underline;
    }

    /* Card Components */
    .lecture-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 48px;
      position: relative;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
      page-break-after: always;
    }

    .entry-badge {
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      background-color: var(--tag-bg);
      color: var(--accent-color);
      border: 1px solid rgba(0, 209, 255, 0.2);
      display: inline-block;
      margin-bottom: 16px;
    }

    .lecture-title {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: -0.5px;
      margin-bottom: 24px;
      color: ${isCosmic ? '#ffffff' : '#0f172a'};
    }

    /* Binder Visuals */
    .binder-visual {
      margin: 32px 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }
    
    .visual-placeholder {
      background: linear-gradient(135deg, var(--bg-color) 0%, var(--tag-bg) 100%);
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
    }
    
    .visual-placeholder svg {
      width: 100%;
      height: auto;
      max-height: 380px;
      display: block;
    }

    .visual-text {
      font-family: monospace;
      font-size: 11px;
      letter-spacing: 2px;
      color: var(--accent-color);
      font-weight: bold;
      padding: 60px 20px;
    }

    .visual-caption {
      padding: 16px 20px;
      font-size: 13.5px;
      background-color: var(--card-bg);
      color: var(--text-muted);
      margin: 0;
    }

    .visual-caption strong {
      color: var(--text-main);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
      margin-right: 6px;
    }

    /* Textbook Script Layout */
    .lecture-para {
      margin-bottom: 20px;
      font-size: 14.5px;
      line-height: 1.7;
      color: var(--text-main);
      text-align: justify;
    }

    .highlight-term {
      color: var(--accent-color);
      background-color: var(--tag-bg);
      font-weight: bold;
      padding: 1px 6px;
      border-radius: 3px;
      border: 1px solid rgba(0, 209, 255, 0.1);
    }

    .sub-chapter-node {
      display: block;
      margin-top: 16px;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--gold-color);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Assessment Box styles */
    .assessment-container {
      margin-top: 40px;
      border-top: 2px dashed var(--border-color);
      padding-top: 30px;
    }

    .section-headline {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 800;
      margin-bottom: 20px;
    }

    .q-card {
      background-color: ${isCosmic ? '#0d0d12' : '#f1f5f9'};
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .q-text {
      font-size: 13.5px;
      font-weight: bold;
      margin-bottom: 12px;
      color: ${isCosmic ? '#ffffff' : '#334155'};
    }

    .reveal-btn {
      background-color: transparent;
      border: 1px solid var(--accent-color);
      color: var(--accent-color);
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-family: monospace;
      transition: all 0.2s;
    }

    .reveal-btn:hover {
      background-color: var(--accent-color);
      color: ${isCosmic ? '#000000' : '#ffffff'};
    }

    .answer-box {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid var(--border-color);
      font-size: 13px;
      color: var(--text-main);
      transition: all 0.3s ease;
    }

    .hidden-answer {
      display: none;
    }

    /* Utility controllers top bar for standalone browser use */
    .utility-bar {
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 14px 24px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .util-text {
      font-size: 11.5px;
      color: var(--text-muted);
      font-family: monospace;
    }

    .print-button {
      background-color: var(--accent-color);
      color: ${isCosmic ? '#000000' : '#ffffff'};
      border: none;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
    }

    .print-button:hover {
      opacity: 0.95;
    }

    /* Print styling rules */
    @media print {
      body {
        background-color: white !important;
        color: black !important;
        padding: 0;
        font-size: 13px;
      }
      .utility-bar, .reveal-btn, .print-button {
        display: none !important;
      }
      .lecture-card {
        border: none !important;
        box-shadow: none !important;
        background-color: white !important;
        padding: 10px 0 !important;
        page-break-after: always;
      }
      .cover-page {
        border: none !important;
        padding: 100px 0 !important;
        page-break-after: always;
      }
      .q-card {
        background-color: #fafafa !important;
        border: 1px solid #cbd5e1 !important;
        page-break-inside: avoid;
      }
      .answer-box {
        display: block !important;
      }
      .highlight-term {
        border-bottom: 1px solid #bbb !important;
        background: transparent !important;
        color: #000 !important;
      }
    }
  `;

  // Content synthesis
  let content = '';

  // 1. Cover page if combined
  if (combine) {
    content += `
      <div class="cover-page">
        <span class="cover-badge">Registry Master Guide</span>
        <h1 class="cover-title">ARDMS SPI Physics Study Binder</h1>
        <p class="cover-subtitle">Complete Clinical Lecture Narratives &amp; Self-Assessments</p>
        
        <div class="index-box">
          <div class="index-title">LECTURE DIRECTORY INDEX</div>
          <ul class="index-list">
            ${targetLectures.map(l => `
              <li class="index-item">
                <a href="#section-${l.id}">👉 ${l.title} (${l.category})</a>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="cover-metadata">
          <div>TOPICS REGISTERED: <span class="metadata-val">${targetLectures.length}</span></div>
          <div>EST. REVIEW TIME: <span class="metadata-val">${targetLectures.length * 5} mins</span></div>
          <div>ENCRYPTION: <span class="metadata-val">AES_256_ACTIVE</span></div>
        </div>
      </div>
    `;
  }

  // 2. Loop lectures
  targetLectures.forEach((lecture) => {
    const formattedBody = formatScriptToHTML(lecture.script, lecture.images);

    content += `
      <div class="lecture-card" id="section-${lecture.id}">
        <span class="entry-badge">${lecture.category.toUpperCase()} // REGISTRY DIRECTIVE</span>
        <h2 class="lecture-title">${lecture.title}</h2>
        
        <div class="lecture-body">
          ${formattedBody}
        </div>

        ${lecture.assessment && lecture.assessment.length > 0 ? `
          <div class="assessment-container">
            <h3 class="section-headline">💡 High Yield Self-Assessment Quiz Questions</h3>
            <div class="assessment-flow">
              ${lecture.assessment.map((q, idx) => `
                <div class="q-card">
                  <div class="q-text">Q${idx + 1}: ${q.question}</div>
                  <button class="reveal-btn" onclick="toggleAnswer(this)">REVEAL COGNITIVE ANSWER</button>
                  <div class="answer-box hidden-answer">
                    <strong>Official Registry Answer:</strong> ${q.answer}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });

  // Assemble full standalone document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Stanadlone Control Utility Bar -->
    <div class="utility-bar">
      <div class="util-text">
        <strong>SPI COGNITIVE COMPANION ARCHIVE</strong> // STATUS: OFFLINE READ REUSABLE
      </div>
      <button class="print-button" onclick="window.print()">Print / Export PDF</button>
    </div>

    ${content}

  </div>

  <script>
    function toggleAnswer(btn) {
      const parent = btn.parentElement;
      const box = parent.querySelector('.answer-box');
      if (box.classList.contains('hidden-answer')) {
        box.classList.remove('hidden-answer');
        btn.textContent = 'HIDE ANSWER';
        btn.style.borderColor = 'var(--text-muted)';
        btn.style.color = 'var(--text-muted)';
      } else {
        box.classList.add('hidden-answer');
        btn.textContent = 'REVEAL COGNITIVE ANSWER';
        btn.style.borderColor = 'var(--accent-color)';
        btn.style.color = 'var(--accent-color)';
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Returns structured, pristine Markdown output format for lectures.
 */
export function generateStructuredMarkdown(lectures: LectureScript[], options: ExporterOptions): string {
  const { combine, selectedLectureId } = options;
  const targetLectures = combine 
    ? lectures 
    : lectures.filter(l => l.id === selectedLectureId);

  let output = '';

  output += `# 📘 ARDMS SPI Registry Physics Prep Notebook\n`;
  output += `> **Generated Study Deck & Clinical Lecture Compilations**\n`;
  output += `> *Scope:* ${combine ? 'All Master Lectures' : 'Focused Syllabus Element'} • *Status:* Verified Active Study Deck\n\n`;

  if (combine) {
    output += `## 📚 TABLE OF CLINICAL TOPICS\n`;
    targetLectures.forEach((l, idx) => {
      output += `${idx + 1}. [${l.title}](#-${l.id.toLowerCase()}) — Category: ${l.category}\n`;
    });
    output += `\n---\n\n`;
  }

  targetLectures.forEach((lecture) => {
    output += `<a id="${lecture.id.toLowerCase()}"></a>\n`;
    output += `## 🎓 ${lecture.title.toUpperCase()}\n`;
    output += `**Domain:** \`${lecture.category.toUpperCase()}\` • **Level:** Ultra-high-yield Prep\n\n`;

    // Process narrative paragraphs
    const paragraphs = lecture.script
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    paragraphs.forEach((p, index) => {
      // Bold mnemonic keywords
      let cleaned = p.replace(/\s+/g, ' ');
      // Identify titles and sections
      if (cleaned.includes('Part 1:') || cleaned.includes('Part 2:') || cleaned.includes('Part 3:') || cleaned.includes('Part 4:')) {
        cleaned = cleaned.replace(/(Part \d+:[^.]+)/g, '\n### 💠 $1');
      }
      output += `${cleaned}\n\n`;

      if (lecture.images) {
        lecture.images.forEach(img => {
          if (img.triggerParagraph === index) {
            output += `> 📊 **FIGURE:** *${img.caption}* [Diagram View: ${img.url.toUpperCase()}]\n\n`;
          }
        });
      }
    });

    // Process assessments
    if (lecture.assessment && lecture.assessment.length > 0) {
      output += `### 💡 CLINICAL SELF-ASSESSMENT DRILL\n`;
      lecture.assessment.forEach((q, idx) => {
        output += `#### **Q${idx + 1}:** ${q.question}\n`;
        output += `> **Registry Target Response:**\n`;
        output += `> *${q.answer}*\n\n`;
      });
    }

    output += `---\n\n`;
  });

  output += `*End of compiled study deck documents. Open with any standard markdown reader, Obsidian, or Notion.*`;

  return output;
}
