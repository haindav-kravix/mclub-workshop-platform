import React from 'react';

const BULLET_ONLY = /^[•●▪◦*-]$/;
const BULLET_LINE = /^[•●▪◦*-]\s+(.+)$/;
const NUMBERED_LINE = /^\d+[.)]\s+(.+)$/;
const SECTION_LABELS = /^(problem statement|challenge|objective|objectives|expected outcome|expected outcomes|requirements|constraints|during|background|solution|deliverables|features|scope)\s*:?$/i;

const parseContent = (value) => {
  const lines = String(value || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const normalized = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (BULLET_ONLY.test(lines[index]) && lines[index + 1]) {
      normalized.push(`• ${lines[index + 1]}`);
      index += 1;
    } else {
      normalized.push(lines[index]);
    }
  }

  const blocks = [];
  let list = null;
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  normalized.forEach(line => {
    const bullet = line.match(BULLET_LINE);
    const numbered = line.match(NUMBERED_LINE);
    if (bullet || numbered) {
      const type = bullet ? 'unordered' : 'ordered';
      const text = (bullet || numbered)[1].trim();
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(text);
      return;
    }

    flushList();
    const isHeading = SECTION_LABELS.test(line) || (line.endsWith(':') && line.length <= 80);
    blocks.push({ type: isHeading ? 'heading' : 'paragraph', text: line });
  });
  flushList();
  return blocks;
};

export const ProblemStatementContent = ({ children, className = '' }) => (
  <div className={`space-y-3 text-slate-600 ${className}`}>
    {parseContent(children).map((block, index) => {
      if (block.type === 'heading') {
        return <h3 key={`${block.text}-${index}`} className="pt-2 text-base font-black text-slate-900 first:pt-0">{block.text}</h3>;
      }
      if (block.type === 'unordered') {
        return (
          <ul key={`list-${index}`} className="ml-5 list-disc space-y-1.5 marker:text-emerald-600">
            {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} className="pl-1">{item}</li>)}
          </ul>
        );
      }
      if (block.type === 'ordered') {
        return (
          <ol key={`list-${index}`} className="ml-5 list-decimal space-y-1.5 marker:font-black marker:text-emerald-700">
            {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`} className="pl-1">{item}</li>)}
          </ol>
        );
      }
      return <p key={`${block.text}-${index}`} className="leading-relaxed">{block.text}</p>;
    })}
  </div>
);
