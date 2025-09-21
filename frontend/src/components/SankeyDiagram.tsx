"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import styles from './sankeydiagram.module.css';

export interface SankeyDatum {
  ip: string;
  src_ip: string;
}

const API_URL = 'https://fmab5zbovg.execute-api.us-east-1.amazonaws.com/getaddresspairs';

const SankeyDiagram: React.FC<{ width?: number; height?: number }> = ({ width = 700, height = 400 }) => {
  const [data, setData] = useState<SankeyDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 700, height: 400 });
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    let lastSize = { width: container.offsetWidth, height: container.offsetHeight };
    setContainerSize(lastSize);

    function handleResize() {
      const container = ref.current?.parentElement;
      if (!container) return; // Ensure container is not null
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      if (width !== lastSize.width || height !== lastSize.height) {
        lastSize = { width, height };
        setContainerSize({ width, height });
      }
    }

    // Trigger initial resize to ensure correct dimensions
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!data || data.length === 0 || !ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove(); // Clear previous content

    // Set SVG dimensions to match container
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet')
       .attr('width', width)
       .attr('height', height);

    const nodeSet = new Set(data.flatMap(d => [d.ip, d.src_ip]));
    const nodes = Array.from(nodeSet).map(id => ({ id, name: id })); // Add 'name' property to match SankeyNodeMinimal
    const links = data
      .filter(d => d.src_ip && d.ip)
      .map(d => ({
        source: d.src_ip,
        target: d.ip,
        value: 1
      })); // Ensure links have 'source', 'target', and 'value' properties

    const sankeyGen = sankey<{ id: string; name: string }, { source: string; target: string; value: number }>()

      .nodeId(d => d.id)
      .nodeWidth(20)
      .nodePadding(16)
      .extent([[1, 1], [width - 1, height - 6]]);

    const sankeyData = sankeyGen({
      nodes,
      links,
    });

    // Ensure sankeyData is properly scoped and accessible
    if (!sankeyData) return;

    svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.25)
      .selectAll('path')
      .data(sankeyData.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', d => Math.max(1, (d as any).width || 1));

    svg.append('g')
      .selectAll('rect')
      .data(sankeyData.nodes)
      .join('rect')
      .attr('x', d => (d as any).x0)
      .attr('y', d => (d as any).y0)
      .attr('height', d => (d as any).y1 - (d as any).y0)
      .attr('width', d => (d as any).x1 - (d as any).x0)
      .attr('fill', '#fbbf24')
      .attr('stroke', '#f59e42');

    svg.append('g')
      .style('font', 'bold 18px Inter, Segoe UI, Arial, sans-serif')
      .selectAll('text')
      .data(sankeyData.nodes)
      .join('text')
      .attr('x', d => (d as any).x0 < width / 2 ? (d as any).x1 + 10 : (d as any).x0 - 10)
      .attr('y', d => ((d as any).y1 + (d as any).y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => (d as any).x0 < width / 2 ? 'start' : 'end')
      .attr('fill', '#22223b')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#fff')
      .attr('stroke-width', 4)
      .attr('stroke-linejoin', 'round')
      .text(d => (d as any).id)
      .raise();

    // Adjust labels to be outside the diagram area
    svg.append('text')
      .attr('x', -20) // Move label further left
      .attr('y', height / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .text('Attacker');

    svg.append('text')
      .attr('x', width + 20) // Move label further right
      .attr('y', height / 2)
      .attr('text-anchor', 'start')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '1.2rem')
      .style('font-weight', 'bold')
      .text('Host');
  }, [data, containerSize]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className={styles['sankey-svg-container']}>
      <svg ref={ref} width={containerSize.width} height={containerSize.height} />
    </div>
  );
};

export default SankeyDiagram;
