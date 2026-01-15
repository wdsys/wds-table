import React, { useState, useRef, useEffect } from 'react';
import './index.css';

interface Option {
  label: string;
  value: string;
  divider?: boolean;
  action?: ()=>void;
}

const UniversalDropdown: React.FC<{ children: React.ReactNode, options: Option[] }> = ({ children, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, []);

  return (
    <>
        <div className="dropdown-container" ref={containerRef}>
        <div className={`dropdown-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
            {children}
        </div>

        {isOpen && (
            <ul className="menu-list">
            {options.map((opt, i) => (
                <React.Fragment key={opt.value + i}>
                <li className="menu-item" onClick={() => {setIsOpen(false);opt?.action?.();}}>
                    {opt.label}
                </li>
                {opt.divider && <div className="menu-divider" />}
                </React.Fragment>
            ))}
            </ul>
        )}
        </div>
    </>
  );
};


export default UniversalDropdown