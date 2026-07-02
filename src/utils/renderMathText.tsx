import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

export function renderMathText(text: string): React.ReactNode[] {
  if (!text) return [text];
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      return <BlockMath key={idx} math={part.slice(2, -2)} />;
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={idx} math={part.slice(1, -1)} />;
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}