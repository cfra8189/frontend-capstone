import React from 'react';

interface FolderIconProps {
    variant?: 'outline' | 'solid';
    className?: string;
}

export const FolderIcon: React.FC<FolderIconProps> = ({ variant = 'outline', className = '' }) => {
    if (variant === 'solid') {
        return (
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={className}
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M2.5 4H9L11 6H21.5V20H2.5V4Z" />
            </svg>
        );
    }

    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M2.5 4H9L11 6H21.5V20H2.5V4Z" />
        </svg>
    );
};
