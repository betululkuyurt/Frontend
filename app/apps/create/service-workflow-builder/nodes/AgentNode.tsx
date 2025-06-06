"use client"

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Cpu, Trash2 } from 'lucide-react';

// Custom AgentNode component for each processing step
function AgentNode({ data, isConnectable, selected }: NodeProps) {
  return (
    <div className={`relative flex items-center min-h-[96px] min-w-[260px] max-w-[260px] group`}>
      {/* Main node styling */}
      <div
        className={`
          relative w-full h-[96px]
          bg-[#2D3748] dark:bg-gray-800
          border-2
          ${selected ? 'border-purple-500 shadow-purple-500/30' : 'border-gray-600 dark:border-gray-700'}
          rounded-xl shadow-lg
          transition-all duration-200
          p-3
        `}
      >        {/* Input Type (Inside, Left) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-purple-300 dark:text-purple-400 font-medium select-none z-20 bg-[#2D3748]/70 dark:bg-gray-800/70 px-1.5 py-0.5 rounded">
          {data.inputType || "input"}
        </div>

        {/* Output Type (Inside, Right) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-purple-300 dark:text-purple-400 font-medium select-none z-20 bg-[#2D3748]/70 dark:bg-gray-800/70 px-1.5 py-0.5 rounded">
          {data.outputType || "output"}
        </div>{/* Icon (positioned above the line) */}
        <div
          className={`
            absolute top-2 left-1/2 -translate-x-1/2
            w-8 h-8 flex items-center justify-center
            bg-purple-600/20 dark:bg-purple-700/30
            border-2 ${selected ? 'border-purple-500' : 'border-purple-700/50 dark:border-purple-800'}
            rounded-lg shadow-inner z-10
          `}
        >
          {data.icon ?? <Cpu className="h-4 w-4 text-purple-300 dark:text-purple-400" />}
        </div>

        {/* Full-width Horizontal Purplish Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-purple-500/70 dark:bg-purple-600/70 z-5"></div>

        {/* Label (positioned below the line) */}
        <h3 className="absolute top-[58px] left-1/2 -translate-x-1/2 text-xs font-semibold text-white dark:text-gray-100 truncate w-[calc(100%-5rem)] text-center z-10">
          {data.label || 'Agent'}
        </h3>

        {/* Description (positioned below label, AgentNode only) */}
        {data.description && (
          <p className="absolute top-[76px] left-1/2 -translate-x-1/2 text-[10px] text-purple-200 dark:text-purple-300 truncate w-[calc(100%-5rem)] text-center z-10">
            {data.description}
          </p>
        )}

        {/* Delete button */}
        <button
          className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-red-500 hover:bg-red-600 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center text-white transition-colors shadow-md z-30"
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete?.();
          }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className={`w-3.5 h-3.5 bg-purple-500 dark:bg-purple-600 border-2 border-white dark:border-gray-800 rounded-full shadow-md hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors`}
        style={{ left: '-7px' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className={`w-3.5 h-3.5 bg-purple-500 dark:bg-purple-600 border-2 border-white dark:border-gray-800 rounded-full shadow-md hover:bg-purple-400 dark:hover:bg-purple-500 transition-colors`}
        style={{ right: '-7px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(AgentNode);
