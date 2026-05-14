// Simple markdown to HTML converter for blog preview
export const parseMarkdown = (text) => {
  if (!text) return [];

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push({
        type: 'code',
        content: codeLines.join('\n').trim()
      });
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push({ type: 'h1', content: line.slice(2) });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push({ type: 'h2', content: line.slice(3) });
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push({ type: 'h3', content: line.slice(4) });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push({ type: 'quote', content: line.slice(2) });
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith('- ')) {
      elements.push({ type: 'li', content: line.slice(2) });
      i++;
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push({ type: 'p', content: line });
      i++;
      continue;
    }

    // Empty line
    i++;
  }

  return elements;
};

// Format inline markdown (bold, italic, inline code)
export const formatInlineMarkdown = (text) => {
  let formatted = text;

  // Code (must be before bold/italic)
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

  return formatted;
};

export const MarkdownPreview = ({ content }) => {
  const elements = parseMarkdown(content);

  return (
    <div className="prose prose-sm max-w-none">
      {elements.map((element, idx) => {
        if (element.type === 'h1') {
          return (
            <h1 key={idx} className="text-4xl font-black mb-4 mt-6">
              {element.content}
            </h1>
          );
        }
        if (element.type === 'h2') {
          return (
            <h2 key={idx} className="text-3xl font-bold mb-3 mt-5">
              {element.content}
            </h2>
          );
        }
        if (element.type === 'h3') {
          return (
            <h3 key={idx} className="text-2xl font-bold mb-3 mt-4">
              {element.content}
            </h3>
          );
        }
        if (element.type === 'code') {
          return (
            <div key={idx} className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto border-2 border-slate-700">
              <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-words" style={{ color: '#FFFFFF' }}>
                <code style={{ color: '#FFFFFF' }}>{element.content}</code>
              </pre>
            </div>
          );
        }
        if (element.type === 'quote') {
          return (
            <blockquote
              key={idx}
              className="border-l-4 border-green-500 pl-4 py-2 my-3 italic text-slate-700 bg-slate-100 rounded-r-lg"
            >
              {element.content}
            </blockquote>
          );
        }
        if (element.type === 'li') {
          return (
            <li key={idx} className="ml-6 my-1 list-disc">
              {element.content}
            </li>
          );
        }
        return (
          <p
            key={idx}
            className="text-base leading-7 mb-3 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{
              __html: formatInlineMarkdown(element.content)
            }}
          />
        );
      })}
    </div>
  );
};
