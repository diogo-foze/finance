import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  isPreview?: boolean;
}

export function FormattedText({ text, className = "", isPreview = false }: FormattedTextProps) {
  if (!text) return null;

  // Simple version for previews (removes markdown instead of formatting)
  if (isPreview) {
    const cleanText = text
      .replace(/(\*|_|~|`){1,3}/g, '') // Remove formatting chars
      .replace(/^[ \t]*([*->]|\d+\.) /gm, ''); // Remove list markers
    return <span className={className}>{cleanText}</span>;
  }

  const lines = text.split('\n');
  const result: React.ReactNode[] = [];

  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushList = () => {
    if (inList && listType) {
      const ListTag = listType;
      result.push(
        <ListTag key={`list-${result.length}`} className={listType === 'ul' ? "list-disc ml-6 my-2" : "list-decimal ml-6 my-2"}>
          {listItems}
        </ListTag>
      );
      inList = false;
      listType = null;
      listItems = [];
    }
  };

  const flushCodeBlock = (index: number) => {
    if (inCodeBlock) {
      result.push(
        <pre key={`code-${index}`} className="bg-black/10 dark:bg-white/5 p-3 rounded-md my-2 overflow-x-auto font-mono text-xs border border-black/5 shadow-inner whitespace-pre leading-relaxed">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
      inCodeBlock = false;
      codeBlockContent = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // If there's content after ``` on the same line, it might be the end of a single-line block or start of a new one
        // but let's stick to standard behavior: ``` toggles block.
        const contentAfter = line.trim().slice(3).replace(/```$/, '');
        if (contentAfter) codeBlockContent.push(contentAfter);
        flushCodeBlock(i);
      } else {
        flushList();
        inCodeBlock = true;
        const contentAfter = line.trim().slice(3).replace(/```$/, '');
        if (contentAfter) {
          codeBlockContent.push(contentAfter);
          // If it also ends with ```, it's a single line block
          if (line.trim().slice(3).endsWith('```')) {
            flushCodeBlock(i);
          }
        }
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Check for quotes
    const quoteMatch = line.match(/^>[ \t]*(.*)$/);
    if (quoteMatch) {
      flushList();
      result.push(
        <blockquote key={`quote-${i}`} className="border-l-4 border-primary/30 pl-4 py-1 my-2 italic text-muted-foreground bg-muted/20 rounded-r-md">
          {formatInline(quoteMatch[1])}
        </blockquote>
      );
      continue;
    }

    // Check for bulleted lists
    const bulletMatch = line.match(/^[ \t]*[*+-][ \t]+(.*)$/);
    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(<li key={`li-${i}`}>{formatInline(bulletMatch[1])}</li>);
      continue;
    }

    // Check for numbered lists
    const numberMatch = line.match(/^[ \t]*(\d+)\.[ \t]+(.*)$/);
    if (numberMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(<li key={`li-${i}`}>{formatInline(numberMatch[2])}</li>);
      continue;
    }

    // Default line
    flushList();
    if (line.trim() === '') {
      result.push(<br key={`br-${i}`} />);
    } else {
      result.push(<p key={`p-${i}`} className="mb-1 last:mb-0">{formatInline(line)}</p>);
    }
  }

  flushList();
  flushCodeBlock(lines.length);


  return <div className={className}>{result}</div>;
}

function formatInline(text: string): React.ReactNode {
  // Use a temporary array to store segments
  let segments: (string | React.ReactNode)[] = [text];

  // Bold *text*
  segments = segments.flatMap(seg => {
    if (typeof seg !== 'string') return seg;
    const parts = seg.split(/(\*.*?\*)/g);
    return parts.map(part => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={Math.random()}>{part.slice(1, -1)}</strong>;
      }
      return part;
    });
  });

  // Italic _text_
  segments = segments.flatMap(seg => {
    if (typeof seg !== 'string') return seg;
    const parts = seg.split(/(_.*?_)/g);
    return parts.map(part => {
      if (part.startsWith('_') && part.endsWith('_')) {
        return <em key={Math.random()}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  });

  // Strikethrough ~text~
  segments = segments.flatMap(seg => {
    if (typeof seg !== 'string') return seg;
    const parts = seg.split(/(~.*?~)/g);
    return parts.map(part => {
      if (part.startsWith('~') && part.endsWith('~')) {
        return <del key={Math.random()}>{part.slice(1, -1)}</del>;
      }
      return part;
    });
  });

  // Inline Code `text`
  segments = segments.flatMap(seg => {
    if (typeof seg !== 'string') return seg;
    const parts = seg.split(/(`.*?`)/g);
    return parts.map(part => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={Math.random()} className="bg-black/10 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono text-xs border border-black/5">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  });

  return <>{segments}</>;
}
