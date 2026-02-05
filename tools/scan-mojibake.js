import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET_EXTS = new Set(['.js', '.css', '.html', '.md', '.json', '.txt']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'coverage',
  'dist',
  'build',
  'out',
  '.next'
]);

const KEYWORDS = [
  '\u6f5c\u6c34', // 潜水
  '\u57fa\u5730', // 基地
  '\u6b66\u5668', // 武器
  '\u5347\u7ea7', // 升级
  '\u5408\u6210', // 合成
  '\u8fdb\u5316', // 进化
  '\u878d\u5408', // 融合
  '\u72b6\u6001', // 状态
  '\u4f24\u5bb3', // 伤害
  '\u901f\u5ea6', // 速度
  '\u8303\u56f4', // 范围
  '\u65e5\u5fd7', // 日志
  '\u91d1\u5e01', // 金币
  '\u80cc\u5305', // 背包
  '\u4ed3\u5e93', // 仓库
  '\u64a4\u79bb', // 撤离
  '\u6210\u529f', // 成功
  '\u5931\u8d25', // 失败
  '\u56fe\u9274', // 图鉴
  '\u6548\u679c', // 效果
  '\u63cf\u8ff0', // 描述
  '\u6750\u6599', // 材料
  '\u5956\u52b1', // 奖励
  '\u5b9d\u7bb1', // 宝箱
  '\u7ecf\u9a8c', // 经验
  '\u6c27\u6c14', // 氧气
  '\u529b\u91cf', // 力量
  '\u667a\u529b', // 智力
  '\u9632\u5fa1'  // 防御
];

const CJK_RE = /[\u4e00-\u9fff]/;
const REPLACEMENT_RE = /\uFFFD/;

let gbDecoder = null;
try {
  gbDecoder = new TextDecoder('gb18030', { fatal: false });
} catch (e) {
  gbDecoder = null;
}

function walk(dir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TARGET_EXTS.has(ext)) {
        results.push(fullPath);
      }
    }
  }
}

function countKeywords(text) {
  let score = 0;
  for (const kw of KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  return score;
}

function containsCJK(text) {
  return CJK_RE.test(text);
}

function findReplacementLines(lines) {
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    if (REPLACEMENT_RE.test(lines[i])) hits.push(i + 1);
  }
  return hits;
}

function findMojibakeLines(utf8Lines, gbLines) {
  const max = Math.min(utf8Lines.length, gbLines.length);
  const hits = [];
  for (let i = 0; i < max; i++) {
    const u = utf8Lines[i];
    const g = gbLines[i];
    if (!containsCJK(u) || !containsCJK(g)) continue;
    const uScore = countKeywords(u);
    const gScore = countKeywords(g);
    if (gScore > uScore) hits.push(i + 1);
  }
  return hits;
}

function analyzeFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const utf8Text = buffer.toString('utf8');
  const utf8Lines = utf8Text.split(/\r?\n/);
  const issues = [];

  const replacementLines = findReplacementLines(utf8Lines);
  if (replacementLines.length > 0) {
    issues.push({ type: 'replacement-char', lines: replacementLines });
  }

  if (gbDecoder) {
    const gbText = gbDecoder.decode(buffer);
    const gbLines = gbText.split(/\r?\n/);
    const mojibakeLines = findMojibakeLines(utf8Lines, gbLines);
    if (mojibakeLines.length > 0) {
      issues.push({ type: 'mojibake-suspect', lines: mojibakeLines });
    } else {
      const uScore = countKeywords(utf8Text);
      const gScore = countKeywords(gbText);
      if (gScore >= 2 && gScore > uScore + 1) {
        issues.push({ type: 'mojibake-suspect', lines: [] });
      }
    }
  }

  return issues;
}

const files = [];
walk(ROOT, files);

const results = [];
for (const file of files) {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    results.push({ file, issues });
  }
}

if (results.length === 0) {
  console.log('No encoding issues found.');
  process.exit(0);
}

console.log('Potential encoding issues found:');
for (const result of results) {
  console.log(`- ${path.relative(ROOT, result.file)}`);
  for (const issue of result.issues) {
    const lineInfo = issue.lines.length > 0 ? ` lines: ${issue.lines.join(',')}` : '';
    console.log(`  - ${issue.type}${lineInfo}`);
  }
}

if (!gbDecoder) {
  console.log('Note: gb18030 decoder unavailable; mojibake heuristic is limited.');
}

process.exit(1);
