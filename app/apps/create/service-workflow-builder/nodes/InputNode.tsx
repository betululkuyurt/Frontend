"use client"

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare } from 'lucide-react';

// Custom InputNode component that serves as the entry point for our workflow
function InputNode({ data, isConnectable }: NodeProps) {
  return (
    <div className={`relative flex items-center min-h-[96px] min-w-[260px] max-w-[260px] group`}>
      {/* Main node styling */}
      <div
        className={`
          relative w-full h-[96px]
          bg-[#2D3748] dark:bg-gray-800
          border-2 border-emerald-600 dark:border-emerald-700
          rounded-xl shadow-lg
          transition-all duration-200
          p-3
        `}
      >        {/* Input Type (Inside, Left) */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-300 dark:text-emerald-400 font-medium select-none z-20 bg-[#2D3748]/70 dark:bg-gray-800/70 px-1.5 py-0.5 rounded">
          {data.inputType || "Input"}
        </div>

        {/* Output Type (Inside, Right) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-300 dark:text-emerald-400 font-medium select-none z-20 bg-[#2D3748]/70 dark:bg-gray-800/70 px-1.5 py-0.5 rounded">
          {data.inputType || "Input"}
        </div>        {/* Icon (positioned above the line) */}
        <div
          className={`
            absolute top-2 left-1/2 -translate-x-1/2
            w-8 h-8 flex items-center justify-center
            ${data.color || 'bg-emerald-600/20 dark:bg-emerald-700/30'}
            border-2 border-emerald-700/50 dark:border-emerald-800
            rounded-lg shadow-inner z-10
          `}
        >
          {data.icon || <MessageSquare className="h-4 w-4 text-emerald-300 dark:text-emerald-400" />}
        </div>

        {/* Full-width Horizontal Emerald Line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-500/70 dark:bg-emerald-600/70 z-5"></div>

        {/* Label (positioned below the line) */}
        <h3 className="absolute top-[58px] left-1/2 -translate-x-1/2 text-xs font-semibold text-white dark:text-gray-100 truncate w-[calc(100%-5rem)] text-center z-10">
          {data.label || 'Input'}
        </h3>
      </div>

      {/* Handles (Only Output for InputNode) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className={`w-3.5 h-3.5 bg-emerald-500 dark:bg-emerald-600 border-2 border-white dark:border-gray-800 rounded-full shadow-md hover:bg-emerald-400 dark:hover:bg-emerald-500 transition-colors`}
        style={{ right: '-7px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(InputNode);
