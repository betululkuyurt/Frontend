"use client"

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

// Custom InputNode component that serves as the entry point for our workflow
function InputNode({ data, isConnectable }: NodeProps) {
  return (
    <div className="relative bg-gradient-to-b from-purple-700/40 to-purple-900/80 rounded-lg border border-purple-500/50 p-4 shadow-lg min-w-[200px]">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center mr-2">
          {data.icon || <MessageSquare className="h-4 w-4 text-purple-300" />}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">Input</h3>
          <span className="text-xs text-purple-300">{data.inputType || "Text Input"}</span>
        </div>
      </div>
      
      {/* Only show output handle since this is an input node */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="w-3 h-3 bg-purple-500 border-2 border-white bottom-[-4px]"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(InputNode);
