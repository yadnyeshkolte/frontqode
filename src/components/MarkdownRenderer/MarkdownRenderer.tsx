// src/components/MarkdownRenderer/MarkdownRenderer.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
    content: string;
}

// Add types for the code component props
interface CodeProps {
    node: any; // You could use a more specific type from react-markdown if available
    inline: boolean;
    className: string | undefined;
    children: React.ReactNode;
    [key: string]: any; // For the rest of the props
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                // Show copy success feedback
                const copyButton = document.activeElement as HTMLElement;
                if (copyButton && copyButton.classList.contains('copy-button')) {
                    const originalText = copyButton.innerText;
                    copyButton.innerText = 'Copied!';

                    setTimeout(() => {
                        copyButton.innerText = originalText;
                    }, 2000);
                }
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    // Custom renderers for code blocks with proper types
    const renderers = {
        code: ({ inline, className, children, ...props }: CodeProps) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : 'plaintext';
            const codeContent = String(children).replace(/\n$/, '');

            if (!inline) {
                return (
                    <div className="code-block">
                        <div className="code-header">
                            <span className="code-language">{language}</span>
                            <button
                                className="copy-button"
                                onClick={() => copyToClipboard(codeContent)}
                            >
                                Copy
                            </button>
                        </div>
                        <pre>
                            <code className={className} {...props}>
                                {children}
                            </code>
                        </pre>
                    </div>
                );
            }

            return (
                <code className={`inline-code ${className || ''}`} {...props}>
                    {children}
                </code>
            );
        }
    };

    return (
        <div className="markdown-content">
            <ReactMarkdown components={renderers}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;