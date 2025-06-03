"use client"

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Cpu, Trash2 } from 'lucide-react';

// Custom AgentNode component for each processing step
function AgentNode({ data, isConnectable, selected }: NodeProps) {  return (
    <div className={`relative bg-gradient-to-b ${data.color ?? 'from-gray-700/40 to-gray-900/80'} rounded-lg border ${selected ? 'border-purple-400' : 'border-gray-500/50'} p-4 shadow-lg min-w-[240px]`}>
      {/* Delete button - shows for all agent nodes */}
      <button 
        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md z-10"
        onClick={(e) => {
          e.stopPropagation();
          data.onDelete?.();
        }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
        <div className="flex items-center mb-2">
        <div className={`w-8 h-8 rounded-full ${data.iconBg ?? 'bg-gray-800'} flex items-center justify-center mr-2`}>
          {data.icon ?? <Cpu className="h-4 w-4 text-gray-300" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white truncate">{data.label}</h3>
          <span className="text-xs text-gray-300 truncate block">{data.description}</span>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-3">
        <div className="px-2 py-1 bg-black/30 rounded-md text-xs text-gray-300 border border-gray-700/50">
          {data.inputType} → {data.outputType}
        </div>
      </div>
      
      {/* Input and output handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-3 h-3 bg-gray-500 border-2 border-white top-[-4px]"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-gray-500 border-2 border-white bottom-[-4px]"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(AgentNode);
