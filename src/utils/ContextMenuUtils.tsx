// src/utils/ContextMenuUtils.tsx
import React, { useEffect, useRef } from 'react';
import './styles/ContextMenuUtils.css';

interface ContextMenuPosition {
    x: number;
    y: number;
}

interface ContextMenuProps {
    position: ContextMenuPosition;
    onClose: () => void;
    children: React.ReactNode;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, children }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Adjust position if menu would go off-screen
        if (menuRef.current) {
            const menuRect = menuRef.current.getBoundingClientRect();
            const { x, y } = position;

            // Check if menu would go off the right side of the screen
            if (x + menuRect.width > window.innerWidth) {
                menuRef.current.style.left = `${window.innerWidth - menuRect.width - 5}px`;
            } else {
                menuRef.current.style.left = `${x}px`;
            }

            // Check if menu would go off the bottom of the screen
            if (y + menuRect.height > window.innerHeight) {
                menuRef.current.style.top = `${window.innerHeight - menuRect.height - 5}px`;
            } else {
                menuRef.current.style.top = `${y}px`;
            }
        }
    }, [position]);

    return (
        <div className="context-menu" ref={menuRef} style={{ left: position.x, top: position.y }}>
            {children}
        </div>
    );
};

interface ContextMenuItemProps {
    onClick?: () => void;
    divider?: boolean;
    children?: React.ReactNode;
    disabled?: boolean;
}

export const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
                                                                    onClick,
                                                                    divider,
                                                                    children,
                                                                    disabled
                                                                }) => {
    if (divider) {
        return <div className="context-menu-divider" />;
    }

    return (
        <div
            className={`context-menu-item ${disabled ? 'disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
        >
            {children}
        </div>
    );
};