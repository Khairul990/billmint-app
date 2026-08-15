import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Base style for nodes mirroring the glass-panel CSS
const baseStyle = {
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  minWidth: '200px',
  color: '#fff',
  fontFamily: 'Inter, sans-serif',
};

const getTitleStyle = (color) => ({
  fontSize: '11px',
  fontWeight: '800',
  textTransform: 'uppercase',
  color: color,
  marginBottom: '6px',
  letterSpacing: '0.05em'
});

export const UINode = ({ data }) => (
  <div style={{ ...baseStyle, background: 'rgba(21, 29, 45, 0.85)', backdropFilter: 'blur(10px)' }}>
    <Handle type="target" position={Position.Top} />
    <div style={getTitleStyle('#94A3B8')}>{data.type}</div>
    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>{data.file}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const EngineNode = ({ data }) => (
  <div style={{ ...baseStyle, background: 'rgba(184, 134, 11, 0.15)', borderColor: 'rgba(212, 175, 55, 0.4)' }}>
    <Handle type="target" position={Position.Top} />
    <div style={getTitleStyle('#D4AF37')}>{data.type}</div>
    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{data.file}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const DataNode = ({ data }) => (
  <div style={{ ...baseStyle, background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
    <Handle type="target" position={Position.Top} />
    <div style={getTitleStyle('#10B981')}>{data.type}</div>
    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{data.file}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const CloudNode = ({ data }) => (
  <div style={{ ...baseStyle, background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
    <Handle type="target" position={Position.Top} />
    <div style={getTitleStyle('#F59E0B')}>{data.type}</div>
    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{data.file}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const ReferenceNode = ({ data }) => (
  <div style={{ ...baseStyle, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.4)', borderStyle: 'dashed' }}>
    <Handle type="target" position={Position.Top} />
    <div style={getTitleStyle('#EF4444')}>{data.type}</div>
    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>{data.label}</div>
    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{data.file}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);
