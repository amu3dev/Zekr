import { useLayoutEffect, useRef } from 'react';
import { Text } from 'react-native';

import type { ReadingTextProps } from './ReadingText';

/** RN Web does not implement native onTextLayout. Browser-only Range geometry
 * keeps visual QA honest; native uses RN line boxes in ReadingText.tsx. */
export function ReadingText({ onMeasure, ...props }: ReadingTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const callback = useRef(onMeasure);
  useLayoutEffect(() => { callback.current = onMeasure; });
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => {
      const text = node.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE) return;
      const base = node.getBoundingClientRect();
      const groups: { y: number; height: number; width: number; left: number; right: number }[] = [];
      const range = document.createRange();
      for (const part of new Intl.Segmenter('ar', { granularity: 'grapheme' }).segment(text.textContent ?? '')) {
        range.setStart(text, part.index); range.setEnd(text, part.index + part.segment.length);
        const rect = range.getBoundingClientRect();
        if (!rect.height) continue;
        const y = rect.top - base.top;
        const last = groups.at(-1);
        if (last && Math.abs(last.y - y) < 1) { last.left = Math.min(last.left, rect.left); last.right = Math.max(last.right, rect.right); last.width = last.right - last.left; }
        else groups.push({ y, height: rect.height, width: rect.width, left: rect.left, right: rect.right });
      }
      const pitch = Number.parseFloat(getComputedStyle(node).lineHeight);
      callback.current(groups.map((line, index) => ({ width: line.width,
        y: index * pitch, height: pitch })));
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [props.children]);
  return <Text {...props} ref={ref as never} />;
}
