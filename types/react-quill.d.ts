declare module 'react-quill' {
  import React from 'react';
  
  interface ReactQuillProps {
    value?: string;
    onChange?: (content: string, delta: any, source: any, editor: any) => void;
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
    modules?: any;
    formats?: string[];
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }
  
  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}


