"use client";
import React, { useEffect, useRef } from 'react';
import styles from './wordcloud.module.css';
// @ts-ignore
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordData {
  text: string;
  value: number;
}

// Fetch real data from API

export default function WordCloudComponent() {
  const ref = useRef<SVGSVGElement>(null);
  const [data, setData] = React.useState<WordData[]>([]);
  const [containerSize, setContainerSize] = React.useState<{width: number, height: number}>({width: 800, height: 500});
  const maxTextLength = 30;

  useEffect(() => {
    fetch('https://fmab5zbovg.execute-api.us-east-1.amazonaws.com/getinputrank')
      .then(res => res.json())
      .then((json) => {
        // The API returns [{input, count}], convert to [{text, value}]
        setData(json.map((item: any) => ({ text: item.input, value: item.count })));
      })
      .catch(() => setData([]));
  }, []);

  // Only update container size and re-render on mouseup (resize end)
  useEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    let lastSize = { width: container.offsetWidth, height: container.offsetHeight };
    setContainerSize(lastSize);

    function handleMouseUp() {
      const width = container?.offsetWidth || 0;
      const height = container?.offsetHeight || 0;
      if (width !== lastSize.width || height !== lastSize.height) {
        lastSize = { width, height };
        setContainerSize({ width, height });
      }
    }
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;
    const width = containerSize.width;
    const height = containerSize.height;
    d3.select(ref.current).selectAll('*').remove();
    const svg = d3.select(ref.current)
      .attr('width', '100%')
      .attr('height', '100%');

    // Add rounded rectangle background
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('rx', 32)
      .attr('ry', 32)
      .attr('fill', '#f9f9f9')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#shadow)');

    // Add drop shadow filter
    svg.append('defs').html(`
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#bbb"/>
      </filter>
    `);

    // Use d3-cloud for word layout
    // Make font size scale with SVG size
    const minFont = Math.max(20, Math.min(width, height) * 0.04);
    const maxFont = Math.max(60, Math.min(width, height) * 0.18);
    const fontSize = d3.scaleLinear()
      .domain([d3.min(data, (d: WordData) => d.value) || 1, d3.max(data, (d: WordData) => d.value) || 30])
      .range([minFont, maxFont]);

    // Extend the Word type to include the value property
    interface ExtendedWord extends cloud.Word {
      value: number;
      color: string;
      text: string;
    }
    
    cloud<ExtendedWord>()
      .size([width, height])
      .words(data.map((d, i) => ({
        text: d.text.length > maxTextLength ? d.text.slice(0, maxTextLength) : d.text,
        value: d.value,
        color: d3.schemeCategory10[i % 10]
      })))
      .padding(5)
      .rotate(() => 0)
      .font('Segoe UI')
      .fontSize(d => fontSize(d.value))
      .on('end', (words) => {
        svg.append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`)
          .selectAll('text')
          .data(words)
          .enter().append('text')
          .style('font-size', d => `${d.size}px`)
          .style('font-family', 'Segoe UI, Arial, sans-serif')
          .style('fill', d => d.color)
          .attr('text-anchor', 'middle')
          .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
          .text(d => d.text);
      })
      .start();
  }, [data, containerSize]);

  // Use CSS module for container and SVG styling
  return (
    <div className={styles['wordcloud-svg-container']}>
      <svg ref={ref} />
    </div>
  );
}
