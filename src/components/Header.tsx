import React from 'react';
import { Command } from 'lucide-react';

export default function Header() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark" aria-hidden="true">
        <Command className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="brand-copy">
        <h1 className="brand-title">ChatGPT Shortcut</h1>
        <p className="brand-subtitle">让生产力加倍的 ChatGPT 快捷指令 · Prompt workspace</p>
      </div>
    </div>
  );
}
