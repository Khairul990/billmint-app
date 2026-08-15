// Initialize Lucide Icons
lucide.createIcons();

let graphData = null;
let activeNode = null;

const svg = d3.select("#atlasCanvas");
const width = window.innerWidth;
const height = window.innerHeight - 100;

const miniSvg = d3.select("#minimapCanvas");
const miniG = miniSvg.append("g");
const viewportRect = miniSvg.append("rect").attr("class", "minimap-viewport");

const colorMap = {
  'system': 'var(--node-system)',
  'domain': 'var(--node-domain)',
  'engine': 'var(--node-engine)',
  'page': 'var(--node-page)',
  'component': 'var(--node-component)',
  'storage': 'var(--node-storage)',
  'context': 'var(--node-context)',
  'hook': 'var(--node-hook)',
  'util': 'var(--node-util)',
  'config': 'var(--node-config)'
};

const iconUnicodes = {
  'map': '\uf4b6', 'settings': '\uf507', 'layout': '\uf441', 'box': '\uf198', 'database': '\uf28a'
};

const g = svg.append("g");
const zoom = d3.zoom()
  .scaleExtent([0.1, 4])
  .on("zoom", (event) => {
    g.attr("transform", event.transform);
    const scale = event.transform.k;
    d3.selectAll(".node-label").style("opacity", scale < 0.4 ? 0 : 1);
    updateMinimap(event.transform);
  });
svg.call(zoom);

fetch('./data/architecture.json')
  .then(res => res.json())
  .then(data => {
    graphData = data;
    renderGridGraph(data);
    updateHealthStats(data);
  })
  .catch(err => console.error("Error loading Atlas data:", err));

// Grid Layout Engine
function calculateGridLayout(data) {
  const districts = {
    'sys': { x: 0, y: 0, cols: 2 },
    'dom': { x: 0, y: 400, cols: 4 },
    'eng': { x: 800, y: 0, cols: 8 },
    'pag': { x: -800, y: 0, cols: 6 },
    'com': { x: -800, y: 800, cols: 10 },
    'ctx': { x: 0, y: 800, cols: 4 },
    'hok': { x: 400, y: 800, cols: 4 },
    'utl': { x: 800, y: 800, cols: 6 },
    'sto': { x: 1200, y: 800, cols: 4 }
  };

  const spacingX = 180;
  const spacingY = 100;
  const groupCounters = {};

  data.nodes.forEach(node => {
    const groupId = node.group || 'sys';
    const district = districts[groupId] || districts['sys'];
    
    if (!groupCounters[groupId]) groupCounters[groupId] = 0;
    const index = groupCounters[groupId]++;
    
    const row = Math.floor(index / district.cols);
    const col = index % district.cols;
    
    node.x = district.x + (col * spacingX);
    node.y = district.y + (row * spacingY);
  });

  const districtBoxes = [];
  Object.keys(districts).forEach(id => {
    if (groupCounters[id] > 0) {
      const nodesInGroup = data.nodes.filter(n => n.group === id);
      const minX = d3.min(nodesInGroup, d => d.x);
      const maxX = d3.max(nodesInGroup, d => d.x);
      const minY = d3.min(nodesInGroup, d => d.y);
      const maxY = d3.max(nodesInGroup, d => d.y);
      
      const grpMeta = data.groups?.find(g => g.id === id);
      districtBoxes.push({
        id,
        name: grpMeta ? grpMeta.name : id,
        x: minX - 100,
        y: minY - 100,
        width: (maxX - minX) + 200,
        height: (maxY - minY) + 200
      });
    }
  });

  return districtBoxes;
}

function drawOrthogonalPath(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  
  if (Math.abs(dx) < 20 || Math.abs(dy) < 20) {
    return `M${source.x},${source.y} L${target.x},${target.y}`;
  }
  
  const midX = source.x + dx / 2;
  return `M${source.x},${source.y} L${midX},${source.y} L${midX},${target.y} L${target.x},${target.y}`;
}

function renderGridGraph(data) {
  g.selectAll("*").remove();
  miniG.selectAll("*").remove();

  const districtBoxes = calculateGridLayout(data);

  // Draw districts
  const districtsG = g.append("g").attr("class", "districts");
  districtBoxes.forEach(box => {
    const gNode = districtsG.append("g");
    gNode.append("rect")
      .attr("class", "district-rect")
      .attr("x", box.x)
      .attr("y", box.y)
      .attr("width", box.width)
      .attr("height", box.height)
      .attr("stroke", colorMap[box.id === 'eng' ? 'engine' : box.id === 'pag' ? 'page' : 'system']);
    gNode.append("text")
      .attr("class", "district-label")
      .attr("x", box.x + box.width / 2)
      .attr("y", box.y + 60)
      .attr("text-anchor", "middle")
      .text(box.name);
  });

  // Links
  g.append("g").attr("class", "links").selectAll("path")
    .data(data.edges).enter().append("path")
    .attr("class", "link")
    .attr("d", d => {
      const source = data.nodes.find(n => n.id === d.source);
      const target = data.nodes.find(n => n.id === d.target);
      if (source && target) return drawOrthogonalPath(source, target);
      return "";
    });

  // Nodes
  const node = g.append("g").attr("class", "nodes").selectAll("g")
    .data(data.nodes).enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .on("click", (event, d) => showNodeDetails(d));

  // Map Pin Background
  node.append("path")
    .attr("class", "map-pin")
    .attr("d", "M0,0 C-12,0 -20,-8 -20,-20 C-20,-32 -10,-40 0,-40 C10,-40 20,-32 20,-20 C20,-8 12,0 0,0 Z")
    .attr("fill", d => colorMap[d.type] || '#fff');
    
  // Map Pin Pointer
  node.append("path")
    .attr("d", "M-6,-2 L0,8 L6,-2 Z")
    .attr("fill", d => colorMap[d.type] || '#fff');

  // Icon inside pin
  node.append("text").attr("class", "icon")
    .attr("x", 0).attr("y", -15)
    .attr("text-anchor", "middle").text(d => iconUnicodes[d.icon || 'box'] || iconUnicodes['box']);

  // Label below pin
  node.append("text").attr("class", "label node-label")
    .attr("x", 0).attr("y", 22)
    .attr("text-anchor", "middle")
    .text(d => d.label);

  // Minimap Nodes
  miniG.selectAll("rect").data(data.nodes).enter().append("rect")
    .attr("x", d => d.x - 20).attr("y", d => d.y - 40)
    .attr("width", 40).attr("height", 40)
    .attr("fill", d => colorMap[d.type] || '#fff');

  // Initial fit
  svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.15));
}

// Map Modes
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    const mode = e.target.dataset.mode;
    if (mode === 'all') {
      d3.selectAll('.node').style('opacity', 1).style('pointer-events', 'all');
      d3.selectAll('.link').style('opacity', 1);
    } else {
      d3.selectAll('.node')
        .style('opacity', d => d.type === mode || d.type === 'system' ? 1 : 0.05)
        .style('pointer-events', d => d.type === mode || d.type === 'system' ? 'all' : 'none');
      d3.selectAll('.link').style('opacity', 0.05);
    }
  });
});

// UI & Details
function showNodeDetails(d) {
  activeNode = d;
  document.getElementById('breadcrumbs').innerHTML = `<span>BillQyro</span> / <span>${d.type.toUpperCase()}</span> / <span>${d.label}</span>`;
  
  const panel = document.getElementById('detailsPanel');
  const content = document.getElementById('panelContent');
  document.getElementById('panelActions').style.display = 'flex';
  
  let html = `
    <div class="node-title">${d.label}</div>
    <div class="node-type-badge" style="background-color: rgba(255,255,255,0.1); border-left: 4px solid ${colorMap[d.type]}">${d.type}</div>
    <div class="node-description">${d.description}</div>
  `;

  if (d.file) {
    html += `
      <div class="info-group">
        <div class="info-label">File Path</div>
        <div class="info-value">${d.file}</div>
      </div>
    `;
  }
  content.innerHTML = html;
  panel.classList.add('open');
}

// Minimap Sync
function updateMinimap(transform) {
  const miniScale = 0.01; 
  miniG.attr("transform", `translate(100, 75) scale(${miniScale})`); 
  const viewWidth = width / transform.k;
  const viewHeight = height / transform.k;
  const viewX = -transform.x / transform.k;
  const viewY = -transform.y / transform.k;

  viewportRect
    .attr("x", viewX * miniScale + 100)
    .attr("y", viewY * miniScale + 75)
    .attr("width", viewWidth * miniScale)
    .attr("height", viewHeight * miniScale);
}

// Health Stats
function updateHealthStats(data) {
  const stats = document.getElementById('healthStats');
  const counts = { engine: 0, page: 0, component: 0, context: 0, hook: 0, util: 0, config: 0 };
  
  data.nodes.forEach(n => { 
    if (counts[n.type] !== undefined) counts[n.type]++; 
  });
  
  stats.innerHTML = `
    <div class="stat-box"><div class="stat-value">${data.nodes.length}</div><div class="stat-label">Total Nodes</div></div>
    <div class="stat-box"><div class="stat-value">${data.edges.length}</div><div class="stat-label">Dependencies</div></div>
    <div class="stat-box"><div class="stat-value">${counts.engine}</div><div class="stat-label">Engines</div></div>
    <div class="stat-box"><div class="stat-value">${counts.page}</div><div class="stat-label">Pages</div></div>
    <div class="stat-box"><div class="stat-value">${counts.component}</div><div class="stat-label">Components</div></div>
    <div class="stat-box"><div class="stat-value">${counts.context}</div><div class="stat-label">Contexts</div></div>
    <div class="stat-box"><div class="stat-value">${counts.hook}</div><div class="stat-label">Hooks</div></div>
    <div class="stat-box"><div class="stat-value">${counts.util}</div><div class="stat-label">Utils</div></div>
  `;
}

// Event Listeners
document.getElementById('btnClosePanel').addEventListener('click', () => {
  document.getElementById('detailsPanel').classList.remove('open');
  document.getElementById('breadcrumbs').innerHTML = `<span>BillQyro</span>`;
});
document.getElementById('btnZoomIn').addEventListener('click', () => svg.transition().call(zoom.scaleBy, 1.3));
document.getElementById('btnZoomOut').addEventListener('click', () => svg.transition().call(zoom.scaleBy, 0.7));
document.getElementById('btnFit').addEventListener('click', () => {
  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.15));
});

document.getElementById('btnLocate').addEventListener('click', () => {
  if (activeNode) {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(1).translate(-activeNode.x, -activeNode.y));
  }
});
document.getElementById('btnCopyPath').addEventListener('click', () => {
  if (activeNode && activeNode.file) {
    navigator.clipboard.writeText(activeNode.file);
    alert('Path copied to clipboard!');
  }
});

document.getElementById('btnHealth').addEventListener('click', () => {
  document.getElementById('healthModal').classList.toggle('open');
});
document.getElementById('btnCloseHealth').addEventListener('click', () => {
  document.getElementById('healthModal').classList.remove('open');
});

document.getElementById('searchInput').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  if (!term) {
    d3.selectAll('.node').style('opacity', 1).style('pointer-events', 'all');
    d3.selectAll('.link').style('opacity', 1);
    return;
  }
  d3.selectAll('.node')
    .style('opacity', d => d.label.toLowerCase().includes(term) ? 1 : 0.05)
    .style('pointer-events', d => d.label.toLowerCase().includes(term) ? 'all' : 'none');
  d3.selectAll('.link').style('opacity', 0.05);
});
