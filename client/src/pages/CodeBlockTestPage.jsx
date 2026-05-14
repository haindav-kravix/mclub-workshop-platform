import React from 'react';
import { MarkdownPreview } from '../utils/markdownParser';

export const CodeBlockTestPage = () => {
  const testMarkdown = `# Welcome to Code Block Test

Here's a simple JavaScript example:

\`\`\`
function hello() {
  console.log('Hello, World!');
  return true;
}
\`\`\`

And here's a Python example:

\`\`\`
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
\`\`\`

You can also use inline \`code\` like this.

## Features

- **Bold text** for emphasis
- _Italic text_ for style
- > Blockquotes for important notes
- # Headers for structure
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-black text-white mb-8">🧪 Markdown & Code Block Test</h1>
        
        <div className="panel p-8 rounded-2xl text-slate-200">
          <h2 className="text-2xl font-bold text-white mb-6">Preview:</h2>
          <MarkdownPreview content={testMarkdown} />
        </div>

        <div className="mt-8 panel p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Raw Markdown:</h2>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{testMarkdown}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
