import { FirebaseApp } from "firebase/app";
import { Firestore } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";

interface SCChartProps {
  firebaseApp: FirebaseApp;
  firestore?: Firestore;
  initialState?: any;
  className?: string;
  style?: React.CSSProperties;
}

export const SCChart: React.FC<SCChartProps> = ({
  firebaseApp,
  firestore,
  initialState,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const appRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;

    // Dynamically import the sc-charts library only on client side
    const loadChart = async () => {
      try {
        const { initChart, createChartContainer } = await import(
          "@anssipiirainen/sc-charts"
        );

        // Create and append chart container
        const chartContainer = createChartContainer();
        chartRef.current = chartContainer;
        containerRef.current!.appendChild(chartContainer);

        // Initialize the chart
        const chartApp = initChart(chartContainer, firebaseApp, initialState);
        appRef.current = chartApp;
      } catch (error) {
        console.error("Failed to load chart:", error);
      }
    };

    loadChart();

    return () => {
      // Cleanup on unmount
      if (appRef.current && appRef.current.cleanup) {
        appRef.current.cleanup();
      }
      if (chartRef.current && containerRef.current) {
        containerRef.current.removeChild(chartRef.current);
      }
    };
  }, [isClient, firebaseApp, firestore, initialState]);

  if (!isClient) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading chart...</p>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} style={style} />;
};
