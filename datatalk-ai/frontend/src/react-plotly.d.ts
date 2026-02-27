declare module 'react-plotly.js' {
    import * as React from 'react';

    interface PlotParams {
        data: any[];
        layout?: any;
        frames?: any[];
        config?: any;
        useResizeHandler?: boolean;
        style?: React.CSSProperties;
        className?: string;
        divId?: string;
        onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
        onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
        onPurge?: (figure: any, graphDiv: HTMLElement) => void;
        onError?: (err: Error) => void;
        onClick?: (event: any) => void;
        onHover?: (event: any) => void;
        onUnhover?: (event: any) => void;
        onSelected?: (event: any) => void;
        revision?: number;
    }

    const Plot: React.FC<PlotParams>;
    export default Plot;
}
