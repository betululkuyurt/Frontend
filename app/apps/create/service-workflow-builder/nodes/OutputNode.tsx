"use client"

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Workflow } from 'lucide-react';

// Remove default white background from React Flow nodes
// This will override the default .react-flow__node-* background
import './output-node-override.css';

// Custom OutputNode component that serves as the final output for our workflow
function OutputNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="relative bg-gradient-to-b from-blue-700/40 to-blue-900/80 rounded-lg border border-blue-500/50 p-4 shadow-lg min-w-[200px]">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center mr-2">
          {data.icon || <Workflow className="h-4 w-4 text-blue-300" />}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">Output</h3>
          <span className="text-xs text-blue-300">{data.outputType || "Text Output"}</span>
        </div>
      </div>
      
      {/* Only show input handle since this is an output node */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-blue-500 border-2 top-[-4px]"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(OutputNode);
