/**
 * Type Explorer — D3 force-directed graph of the 40-type catalog.
 * Loaded on /types/index.html via CDN D3 + this module.
 */

const CATEGORY_COLORS = {
  primitive: '#60a5fa',
  code: '#a78bfa',
  reference: '#f472b6',
  document: '#34d399',
  data: '#fbbf24',
  media: '#fb923c',
  analysis: '#4ade80',
  communication: '#38bdf8',
  status: '#a3e635',
  credentials: '#f87171',
  tools: '#e879f9',
  config: '#94a3b8',
  agent: '#c084fc',
};

const GROUP_COLORS = {
  input: '#60a5fa',
  output: '#4ade80',
  context: '#F27A3A',
};

(async function initTypeExplorer() {
  const mount = document.getElementById('type-explorer-mount');
  if (!mount || typeof d3 === 'undefined') return;

  // Build container
  mount.innerHTML = `
    <div class="type-explorer">
      <div class="type-explorer-toolbar">
        <button class="type-filter active" data-group="all">All (40)</button>
        <button class="type-filter" data-group="input">Input (15)</button>
        <button class="type-filter" data-group="output">Output (14)</button>
        <button class="type-filter" data-group="context">Context (13)</button>
      </div>
      <div style="position:relative">
        <svg id="typeGraph"></svg>
        <div class="type-detail-panel" id="typeDetailPanel">
          <button onclick="this.parentElement.querySelector('.type-detail-panel').classList.remove('open')" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px">&times;</button>
          <div id="typeDetailContent"></div>
        </div>
      </div>
    </div>`;

  // Fetch types.json (relative path — served from dist/)
  let catalog;
  try {
    const resp = await fetch('/types-catalog.json');
    catalog = await resp.json();
  } catch {
    mount.innerHTML = '<p style="color:var(--text3);padding:20px">Type catalog not available.</p>';
    return;
  }

  // Build nodes and links
  const nodes = [];
  const links = [];
  const typeMap = {};

  for (const [group, types] of Object.entries(catalog.types)) {
    for (const [name, def] of Object.entries(types)) {
      const node = { id: name, group, category: def.category, ...def };
      nodes.push(node);
      typeMap[name] = node;
    }
  }

  // Subtype links
  if (catalog.subtypeRelations) {
    for (const rel of catalog.subtypeRelations) {
      if (typeMap[rel.subtype] && typeMap[rel.supertype]) {
        links.push({ source: rel.subtype, target: rel.supertype, type: 'subtype' });
      }
    }
  }

  // Same-category proximity links (lighter, for clustering)
  const byCategory = {};
  for (const n of nodes) {
    if (!byCategory[n.category]) byCategory[n.category] = [];
    byCategory[n.category].push(n);
  }
  for (const [, members] of Object.entries(byCategory)) {
    for (let i = 0; i < members.length - 1; i++) {
      links.push({ source: members[i].id, target: members[i + 1].id, type: 'category' });
    }
  }

  // SVG setup
  const svg = d3.select('#typeGraph');
  const width = mount.querySelector('.type-explorer').offsetWidth;
  const height = 500;
  svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => d.type === 'subtype' ? 60 : 100).strength(d => d.type === 'subtype' ? 0.8 : 0.1))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(30));

  // Links
  const link = svg.append('g')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', d => d.type === 'subtype' ? '#E03E3E' : '#2A2A2A')
    .attr('stroke-width', d => d.type === 'subtype' ? 2 : 0.5)
    .attr('stroke-dasharray', d => d.type === 'subtype' ? '' : '2,4')
    .attr('opacity', d => d.type === 'subtype' ? 0.8 : 0.3);

  // Nodes
  const node = svg.append('g')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  node.append('circle')
    .attr('r', d => d.frequency ? 8 + d.frequency * 12 : 8)
    .attr('fill', d => GROUP_COLORS[d.group] || '#666')
    .attr('stroke', '#0F0F0F')
    .attr('stroke-width', 2)
    .attr('opacity', 0.9);

  node.append('text')
    .text(d => d.id)
    .attr('dx', 14).attr('dy', 4)
    .attr('font-size', '11px')
    .attr('fill', '#9CA3AF')
    .attr('font-family', 'Inter, sans-serif');

  // Hover effects: highlight connected nodes
  node.on('mouseenter', (event, d) => {
    const connected = new Set();
    links.forEach(l => {
      const sid = typeof l.source === 'string' ? l.source : l.source.id;
      const tid = typeof l.target === 'string' ? l.target : l.target.id;
      if (sid === d.id) connected.add(tid);
      if (tid === d.id) connected.add(sid);
    });
    connected.add(d.id);
    node.select('circle').attr('opacity', n => connected.has(n.id) ? 1 : 0.15);
    node.select('text').attr('opacity', n => connected.has(n.id) ? 1 : 0.15);
    link.attr('opacity', l => {
      const sid = typeof l.source === 'string' ? l.source : l.source.id;
      const tid = typeof l.target === 'string' ? l.target : l.target.id;
      return (sid === d.id || tid === d.id) ? 1 : 0.03;
    });
    // Scale up hovered node
    d3.select(event.currentTarget).select('circle').transition().duration(150).attr('r', d.frequency ? 10 + d.frequency * 14 : 10);
  }).on('mouseleave', () => {
    node.select('circle').attr('opacity', 0.9);
    node.select('text').attr('opacity', 1);
    link.attr('opacity', d => d.type === 'subtype' ? 0.8 : 0.3);
    node.select('circle').transition().duration(150).attr('r', d => d.frequency ? 8 + d.frequency * 12 : 8);
  });

  // Click to show detail
  node.on('click', (event, d) => {
    const panel = document.getElementById('typeDetailPanel');
    const content = document.getElementById('typeDetailContent');
    const reqFields = d.fields?.required?.map(f => `<li><code>${f}</code></li>`).join('') || '<li>None</li>';
    const optFields = d.fields?.optional?.map(f => `<li><code>${f}</code></li>`).join('') || '<li>None</li>';
    content.innerHTML = `
      <h3 style="margin:0 0 4px;color:var(--text)">${d.id}</h3>
      <span class="badge badge-${d.group}" style="margin-bottom:12px;display:inline-block">${d.group}</span>
      <p style="color:var(--text2);font-size:13px;margin:8px 0">${d.description}</p>
      <h4 style="font-size:12px;color:var(--text3);margin:12px 0 4px">Required Fields</h4>
      <ul style="font-size:13px;padding-left:16px">${reqFields}</ul>
      <h4 style="font-size:12px;color:var(--text3);margin:12px 0 4px">Optional Fields</h4>
      <ul style="font-size:13px;padding-left:16px">${optFields}</ul>
      <a href="/types/${d.id}.html" style="display:inline-block;margin-top:16px;font-size:13px">View full details &rarr;</a>
    `;
    panel.classList.add('open');
  });

  // Tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Filter buttons
  let activeGroup = 'all';
  mount.querySelectorAll('.type-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      mount.querySelectorAll('.type-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGroup = btn.dataset.group;
      node.attr('opacity', d => activeGroup === 'all' || d.group === activeGroup ? 1 : 0.1);
      link.attr('opacity', d => {
        if (activeGroup === 'all') return d.type === 'subtype' ? 0.8 : 0.3;
        const s = typeMap[typeof d.source === 'string' ? d.source : d.source.id];
        const t = typeMap[typeof d.target === 'string' ? d.target : d.target.id];
        return (s?.group === activeGroup || t?.group === activeGroup) ? 0.8 : 0.05;
      });
    });
  });
})();
