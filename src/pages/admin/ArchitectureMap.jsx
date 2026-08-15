import React, { useState, useCallback, useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges } from './ArchitectureData';
import { UINode, EngineNode, DataNode, CloudNode, ReferenceNode } from '../../components/architecture/CustomNodes';

// Custom node types registry
const nodeTypes = {
  uiNode: UINode,
  engineNode: EngineNode,
  dataNode: DataNode,
  cloudNode: CloudNode,
  referenceNode: ReferenceNode,
};

const ArchitectureMap = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Handle clicking on a node
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes.map(n => ({ ...n, style: { opacity: 1 } }));
    const term = searchTerm.toLowerCase();
    return nodes.map(n => {
      const match = n.data.label.toLowerCase().includes(term) || n.data.file.toLowerCase().includes(term);
      return { ...n, style: { opacity: match ? 1 : 0.2, transition: 'opacity 0.2s' } };
    });
  }, [nodes, searchTerm]);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#fff' }}>
      {/* TOP BAR */}
      <div style={{ height: '60px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>BillQyro Architecture Map</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search nodes (e.g. invoiceEngine)" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* CANVAS */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Controls style={{ fill: '#fff' }} />
            <MiniMap 
              nodeColor={(n) => {
                if (n.type === 'uiNode') return '#94A3B8';
                if (n.type === 'engineNode') return '#D4AF37';
                if (n.type === 'dataNode') return '#10B981';
                if (n.type === 'cloudNode') return '#F59E0B';
                return '#EF4444';
              }} 
              style={{ background: '#1E293B' }} 
              maskColor="rgba(0,0,0,0.5)"
            />
            <Background color="#334155" gap={20} />
          </ReactFlow>
        </div>

        {/* SIDEBAR (Node Details) */}
        {selectedNode && (
          <div style={{ width: '320px', background: 'rgba(15, 23, 42, 0.95)', borderLeft: '1px solid rgba(255,255,255,0.1)', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Node Details</h2>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Name</div>
              <div style={{ fontSize: '16px' }}>{selectedNode.data.label}</div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>File</div>
              <div style={{ fontSize: '14px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                {selectedNode.data.file}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Type</div>
              <div style={{ fontSize: '14px' }}>{selectedNode.data.type}</div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '12px', color: '#64748B' }}>Verified from Architecture Documents.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureMap;
