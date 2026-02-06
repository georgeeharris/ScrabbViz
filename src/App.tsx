import { useState, useMemo, useEffect } from 'react'
import './App.css'

// Performance timing utility
interface TimingResult {
  name: string;
  duration: number;
}

class PerformanceProfiler {
  private timings: TimingResult[] = [];
  private startTimes: Map<string, number> = new Map();

  start(name: string): void {
    this.startTimes.set(name, performance.now());
  }

  end(name: string): number {
    const startTime = this.startTimes.get(name);
    if (startTime === undefined) {
      console.warn(`No start time found for: ${name}`);
      return 0;
    }
    const duration = performance.now() - startTime;
    this.timings.push({ name, duration });
    this.startTimes.delete(name);
    return duration;
  }

  getTimings(): TimingResult[] {
    return [...this.timings];
  }

  clear(): void {
    this.timings = [];
    this.startTimes.clear();
  }

  getTotalTime(): number {
    return this.timings.reduce((sum, t) => sum + t.duration, 0);
  }

  printSummary(): void {
    console.log('=== Performance Profile ===');
    this.timings.forEach(t => {
      console.log(`${t.name}: ${t.duration.toFixed(2)}ms`);
    });
    console.log(`Total: ${this.getTotalTime().toFixed(2)}ms`);
    console.log('========================');
  }
}

type TGrocery = { id: string; product: string; price: number; packSize: string; brand: string };
type TProductPair = [string, string];

// Union-Find data structure for clustering
class UnionFind {
  parent: Map<string, string>;
  
  constructor() {
    this.parent = new Map();
  }
  
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
    }
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }
  
  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      this.parent.set(rootX, rootY);
    }
  }
}

// Prime number generator for unique color hashing
const primeSequence = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

function App() {
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState<boolean>(true);
  const [useTestData, setUseTestData] = useState<boolean>(false);
  const [lastRenderTime, setLastRenderTime] = useState<TimingResult[]>([]);

  // Test data: 7x7 grid (49 products) - 7 products wide, 7 clusters deep
  const testData: TGrocery[] = Array.from({ length: 49 }, (_, i) => ({
    id: `T${i + 1}`,
    product: `Test Product ${i + 1}`,
    price: 10 - (i * 0.15), // Descending prices
    packSize: `${100 + i * 10}g`,
    brand: `Brand ${Math.floor(i / 7) + 1}`
  }));

  // Create 7 horizontal clusters (rows) with 7 products each
  const testHorizontalPairs: TProductPair[] = Array.from({ length: 42 }, (_, i) => {
    const row = Math.floor(i / 6);
    const col = i % 6;
    const productIndex = row * 7 + col + 1;
    return [`T${productIndex}`, `T${productIndex + 1}`] as TProductPair;
  });

  // Create vertical connections between clusters (connect first product of each row)
  const testVerticalPairs: TProductPair[] = Array.from({ length: 6 }, (_, i) => 
    [`T${i * 7 + 1}`, `T${(i + 1) * 7 + 1}`] as TProductPair
  );

  // Sample data with 3 separate super clusters
  const groceryData: TGrocery[] = useTestData ? testData : [
    // Super Cluster 1: White Sliced Bread
    { id: "A", product: "Hovis White 800g", price: 1.35, packSize: "800g", brand: "Hovis" },
    { id: "B", product: "Hovis White 400g", price: 0.85, packSize: "400g", brand: "Hovis" },
    { id: "C", product: "Tesco White 800g", price: 1.10, packSize: "800g", brand: "Tesco" },
    { id: "D", product: "Tesco White 400g", price: 0.65, packSize: "400g", brand: "Tesco" },
    { id: "E", product: "Allinson White 800g", price: 1.45, packSize: "800g", brand: "Allinson" },
    { id: "F", product: "Allinson White 400g", price: 0.95, packSize: "400g", brand: "Allinson" },
    
    // Super Cluster 2: Wholemeal Bread
    { id: "G", product: "Hovis Wholemeal 800g", price: 1.55, packSize: "800g", brand: "Hovis" },
    { id: "H", product: "Hovis Wholemeal 400g", price: 0.95, packSize: "400g", brand: "Hovis" },
    { id: "I", product: "Tesco Wholemeal 800g", price: 1.25, packSize: "800g", brand: "Tesco" },
    { id: "J", product: "Tesco Wholemeal 400g", price: 0.75, packSize: "400g", brand: "Tesco" },
    { id: "K", product: "Allinson Wholemeal 800g", price: 1.65, packSize: "800g", brand: "Allinson" },
    { id: "L", product: "Allinson Wholemeal 400g", price: 1.05, packSize: "400g", brand: "Allinson" },
    
    // Super Cluster 3: Dairy Products
    { id: "M", product: "Organic Milk 2L", price: 2.50, packSize: "2 liters", brand: "Organic Valley" },
    { id: "N", product: "Organic Milk 1L", price: 1.45, packSize: "1 liter", brand: "Organic Valley" },
    { id: "O", product: "Cheddar Cheese 400g", price: 3.99, packSize: "400g", brand: "Cathedral City" },
    { id: "P", product: "Cheddar Cheese 200g", price: 2.20, packSize: "200g", brand: "Cathedral City" },
    { id: "Q", product: "Greek Yogurt 500g", price: 2.75, packSize: "500g", brand: "Fage" },
    { id: "R", product: "Greek Yogurt 170g", price: 1.20, packSize: "170g", brand: "Fage" }
  ];

  // Relationship pairs - these define which products are related
  const horizontalPairs: TProductPair[] = useTestData ? testHorizontalPairs : [
    // Super Cluster 1: White Bread - horizontal clusters by brand
    ["B", "A"], // Hovis white bread by size
    ["D", "C"], // Tesco white bread by size
    ["F", "E"], // Allinson white bread by size
    
    // Super Cluster 2: Wholemeal Bread - horizontal clusters by brand
    ["H", "G"], // Hovis wholemeal bread by size
    ["J", "I"], // Tesco wholemeal bread by size
    ["L", "K"], // Allinson wholemeal bread by size
    
    // Super Cluster 3: Dairy Products - horizontal clusters by product type
    ["N", "M"], // Organic milk by size
    ["P", "O"], // Cheddar cheese by size
    ["R", "Q"]  // Greek yogurt by size
  ];

  // Vertical pairs define cross-cluster relationships
  // Vertical pairs within each super cluster connect related products between brands/types
  const verticalPairs: TProductPair[] = useTestData ? testVerticalPairs : [
    // Super Cluster 1: White Bread - vertical connections between brands (800g products)
    ["A", "C"], // Hovis 800g to Tesco 800g
    ["C", "E"], // Tesco 800g to Allinson 800g
    
    // Super Cluster 2: Wholemeal Bread - vertical connections between brands (800g products)
    ["G", "I"], // Hovis 800g to Tesco 800g
    ["I", "K"], // Tesco 800g to Allinson 800g
    
    // Super Cluster 3: Dairy Products - vertical connections between product types
    ["M", "O"], // Milk to Cheese
    ["O", "Q"]  // Cheese to Yogurt
  ];

  // Build clusters from pairs
  const buildClusters = (pairs: TProductPair[]): string[][] => {
    const uf = new UnionFind();
    
    // Union all pairs
    pairs.forEach(([a, b]) => {
      uf.union(a, b);
    });
    
    // Group by root
    const clusterMap = new Map<string, string[]>();
    const processedIds = new Set<string>();
    
    pairs.forEach(([a, b]) => {
      [a, b].forEach(id => {
        if (!processedIds.has(id)) {
          processedIds.add(id);
          const root = uf.find(id);
          if (!clusterMap.has(root)) {
            clusterMap.set(root, []);
          }
          clusterMap.get(root)!.push(id);
        }
      });
    });
    
    return Array.from(clusterMap.values());
  };

  // Build graph and sort within cluster
  const sortCluster = (cluster: string[], pairs: TProductPair[], products: Map<string, TGrocery>): TGrocery[] => {
    // Build adjacency list
    const graph = new Map<string, Set<string>>();
    cluster.forEach(id => graph.set(id, new Set()));
    
    pairs.forEach(([a, b]) => {
      if (cluster.includes(a) && cluster.includes(b)) {
        graph.get(a)!.add(b);
        graph.get(b)!.add(a);
      }
    });
    
    // Start from node with highest price
    const sorted: string[] = [];
    const visited = new Set<string>();
    
    // Find starting node (most expensive)
    let start = cluster[0];
    let maxPrice = products.get(start)!.price;
    cluster.forEach(id => {
      const price = products.get(id)!.price;
      if (price > maxPrice) {
        maxPrice = price;
        start = id;
      }
    });
    
    // BFS traversal to build order (using index for O(1) dequeue)
    const queue = [start];
    let queueIndex = 0;
    visited.add(start);
    
    while (queueIndex < queue.length) {
      const current = queue[queueIndex++];
      sorted.push(current);
      
      // Add neighbors sorted by price (descending)
      const neighbors = Array.from(graph.get(current)!).filter(n => !visited.has(n));
      neighbors.sort((a, b) => products.get(b)!.price - products.get(a)!.price);
      
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    
    return sorted.map(id => products.get(id)!);
  };

  // Create product map - memoized to avoid recreation
  const productMap = useMemo(() => {
    const map = new Map<string, TGrocery>();
    groceryData.forEach(p => map.set(p.id, p));
    return map;
  }, [groceryData]);

  // Build and sort horizontal clusters - memoized with profiling
  const { sortedHorizontalClusters, clusteringTime } = useMemo(() => {
    const profiler = new PerformanceProfiler();
    
    profiler.start('buildClusters');
    const horizontalClusters = buildClusters(horizontalPairs);
    profiler.end('buildClusters');
    
    profiler.start('sortClusters');
    const sorted = horizontalClusters.map(cluster => 
      sortCluster(cluster, horizontalPairs, productMap)
    );
    profiler.end('sortClusters');
    
    // Sort horizontal clusters by max price (most expensive cluster first/top)
    sorted.sort((a, b) => {
      const maxPriceA = Math.max(...a.map(p => p.price));
      const maxPriceB = Math.max(...b.map(p => p.price));
      return maxPriceB - maxPriceA;
    });
    
    return { 
      sortedHorizontalClusters: sorted, 
      clusteringTime: profiler.getTotalTime() 
    };
  }, [horizontalPairs, productMap]);

  // Build vertical cluster groupings based on verticalPairs
  // This groups horizontal clusters that should be displayed vertically together
  const buildVerticalClusters = (): number[][] => {
    if (verticalPairs.length === 0) {
      // No vertical pairs - each horizontal cluster is its own vertical group
      return sortedHorizontalClusters.map((_, idx) => [idx]);
    }

    // Map product IDs to their horizontal cluster index
    const productToClusterIdx = new Map<string, number>();
    sortedHorizontalClusters.forEach((cluster, idx) => {
      cluster.forEach(product => {
        productToClusterIdx.set(product.id, idx);
      });
    });

    // Build vertical cluster groups using Union-Find on horizontal cluster indices
    const uf = new UnionFind();
    verticalPairs.forEach(([productA, productB]) => {
      const clusterIdxA = productToClusterIdx.get(productA);
      const clusterIdxB = productToClusterIdx.get(productB);
      
      if (clusterIdxA !== undefined && clusterIdxB !== undefined) {
        uf.union(String(clusterIdxA), String(clusterIdxB));
      }
    });

    // Group horizontal cluster indices by their vertical cluster root
    const verticalClusterMap = new Map<string, number[]>();
    sortedHorizontalClusters.forEach((_, idx) => {
      const idxStr = String(idx);
      const root = uf.find(idxStr);
      if (!verticalClusterMap.has(root)) {
        verticalClusterMap.set(root, []);
      }
      verticalClusterMap.get(root)!.push(idx);
    });

    // Convert to array and sort each vertical cluster by the position of first horizontal cluster
    const verticalClusters = Array.from(verticalClusterMap.values());
    verticalClusters.forEach(group => group.sort((a, b) => a - b));
    
    // Sort vertical clusters by the index of their first horizontal cluster
    verticalClusters.sort((a, b) => a[0] - b[0]);

    return verticalClusters;
  };

  const verticalClusters = useMemo(() => buildVerticalClusters(), [sortedHorizontalClusters, verticalPairs]);

  // Build vertical connection map: maps product IDs to their connected product IDs
  // Stores connections in both directions to support bidirectional lookup
  const buildVerticalConnectionMap = (): Map<string, string[]> => {
    const connectionMap = new Map<string, string[]>();
    
    // Map product IDs to their horizontal cluster index
    const productToClusterIdx = new Map<string, number>();
    sortedHorizontalClusters.forEach((cluster, idx) => {
      cluster.forEach(product => {
        productToClusterIdx.set(product.id, idx);
      });
    });
    
    // For each vertical pair, store bidirectional connections
    verticalPairs.forEach(([productA, productB]) => {
      const clusterIdxA = productToClusterIdx.get(productA);
      const clusterIdxB = productToClusterIdx.get(productB);
      
      if (clusterIdxA !== undefined && clusterIdxB !== undefined && clusterIdxA !== clusterIdxB) {
        // Store connection from A to B
        if (!connectionMap.has(productA)) {
          connectionMap.set(productA, []);
        }
        connectionMap.get(productA)!.push(productB);
        
        // Store connection from B to A (bidirectional)
        if (!connectionMap.has(productB)) {
          connectionMap.set(productB, []);
        }
        connectionMap.get(productB)!.push(productA);
      }
    });
    
    return connectionMap;
  };
  
  const verticalConnectionMap = useMemo(() => buildVerticalConnectionMap(), [sortedHorizontalClusters, verticalPairs]);

  // Card sizing constants used for layout calculations
  const CARD_WIDTH = 200; // Approximate card width including padding
  const CARD_GAP = 20; // Gap between cards in horizontal cluster
  const CONNECTOR_WIDTH = 40; // Width of horizontal connector line
  const HORIZONTAL_CONNECTOR_OFFSET = 5; // Horizontal offset per connector to prevent overlap

  // Create render data with prime-based coloring using clusters - memoized
  const renderStructure = useMemo(() => {
    return sortedHorizontalClusters.map((clusterItems, clusterIdx) => {
      // Use cluster index for label
      const clusterLabel = `Cluster ${clusterIdx + 1}`;
      
      // Color from prime multiplication
      const primeVal = primeSequence[clusterIdx % primeSequence.length];
      const colorSeed = (primeVal * 13) % 360;
      
      return { mfg: clusterLabel, itemsForMfg: clusterItems, colorSeed };
    });
  }, [sortedHorizontalClusters]);

  // Calculate horizontal offsets for each cluster based on vertical connections - memoized and optimized
  const clusterOffsets = useMemo(() => {
    const profiler = new PerformanceProfiler();
    profiler.start('calculateClusterOffsets');
    
    const offsets = new Map<number, number>();
    
    // Pre-build index maps for O(1) lookup instead of O(n) findIndex
    const productIdToClusterIndex = new Map<string, { clusterIdx: number; positionInCluster: number }>();
    sortedHorizontalClusters.forEach((cluster, clusterIdx) => {
      cluster.forEach((product, positionInCluster) => {
        productIdToClusterIndex.set(product.id, { clusterIdx, positionInCluster });
      });
    });
    
    verticalClusters.forEach(verticalCluster => {
      if (verticalCluster.length === 0) return;
      
      // First cluster in vertical group has offset 0
      offsets.set(verticalCluster[0], 0);
      
      // For each subsequent cluster, calculate offset based on first vertical connection
      for (let i = 1; i < verticalCluster.length; i++) {
        const currentClusterIdx = verticalCluster[i];
        const prevClusterIdx = verticalCluster[i - 1];
        
        const prevCluster = sortedHorizontalClusters[prevClusterIdx];
        
        // Find the first vertical connection from prev cluster to current cluster
        let sourceProductIdx = -1;
        let targetProductIdx = -1;
        
        for (let j = 0; j < prevCluster.length; j++) {
          const sourceProduct = prevCluster[j];
          const connectedProductIds = verticalConnectionMap.get(sourceProduct.id) || [];
          
          for (const connectedProductId of connectedProductIds) {
            const targetInfo = productIdToClusterIndex.get(connectedProductId);
            if (targetInfo && targetInfo.clusterIdx === currentClusterIdx) {
              sourceProductIdx = j;
              targetProductIdx = targetInfo.positionInCluster;
              break;
            }
          }
          
          if (sourceProductIdx !== -1) break;
        }
        
        // Calculate offset to align the connected cards
        if (sourceProductIdx !== -1 && targetProductIdx !== -1) {
          const prevOffset = offsets.get(prevClusterIdx) || 0;
          const sourceCardOffset = prevOffset + sourceProductIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH);
          const targetCardOffset = targetProductIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH);
          offsets.set(currentClusterIdx, sourceCardOffset - targetCardOffset);
        } else {
          // No connection found, use same offset as previous cluster
          offsets.set(currentClusterIdx, offsets.get(prevClusterIdx) || 0);
        }
      }
    });
    
    const duration = profiler.end('calculateClusterOffsets');
    if (import.meta.env.DEV) {
      console.log(`Offset calculation took: ${duration.toFixed(2)}ms`);
    }
    
    return offsets;
  }, [sortedHorizontalClusters, verticalClusters, verticalConnectionMap]);

  // Pre-build product position index for O(1) lookup in renderSVG
  const productPositionIndex = useMemo(() => {
    const index = new Map<string, { clusterIdx: number; positionInCluster: number }>();
    sortedHorizontalClusters.forEach((cluster, clusterIdx) => {
      cluster.forEach((product, positionInCluster) => {
        index.set(product.id, { clusterIdx, positionInCluster });
      });
    });
    return index;
  }, [sortedHorizontalClusters]);

  // SVG rendering function - memoized to avoid re-rendering on every hover
  const svgContent = useMemo(() => {
    const profiler = new PerformanceProfiler();
    profiler.start('renderSVG');
    
    // First pass: calculate the required content dimensions
    const SVG_PADDING = 60;
    const SUPER_CLUSTER_SPACING = 200;
    const CLUSTER_VERTICAL_SPACING = 80;
    
    // Calculate maximum width needed based on clusters
    let maxContentWidth = 0;
    verticalClusters.forEach(verticalCluster => {
      verticalCluster.forEach(horizontalClusterIdx => {
        const cluster = sortedHorizontalClusters[horizontalClusterIdx];
        const offset = clusterOffsets.get(horizontalClusterIdx) || 0;
        const clusterWidth = cluster.length * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH) - CARD_GAP - CONNECTOR_WIDTH;
        const totalWidth = Math.max(0, offset) + clusterWidth;
        maxContentWidth = Math.max(maxContentWidth, totalWidth);
      });
    });
    
    const SVG_WIDTH = maxContentWidth + 2 * SVG_PADDING;
    let currentY = 80;
    let svgGlobalIdx = 0;

    const elements: React.JSX.Element[] = [];
    
    // Title and legend
    elements.push(
      <text key="title" x={SVG_WIDTH / 2} y="40" textAnchor="middle" fontSize="48" fontWeight="900" fill="#1a1a2e">
        Grocery Product Relationship Grid
      </text>
    );
    
    elements.push(
      <rect key="legend1-bg" x={SVG_WIDTH / 2 - 250} y="60" width="240" height="40" rx="20" fill="hsl(210, 70%, 50%)" />
    );
    elements.push(
      <text key="legend1" x={SVG_WIDTH / 2 - 130} y="85" textAnchor="middle" fontSize="17" fontWeight="700" fill="white">
        ⟷ Horizontal: Product Relationships
      </text>
    );
    
    elements.push(
      <rect key="legend2-bg" x={SVG_WIDTH / 2 + 10} y="60" width="240" height="40" rx="20" fill="hsl(340, 70%, 50%)" />
    );
    elements.push(
      <text key="legend2" x={SVG_WIDTH / 2 + 130} y="85" textAnchor="middle" fontSize="17" fontWeight="700" fill="white">
        ↕ Vertical: Cluster Organization
      </text>
    );
    
    currentY = 140;

    // Track Y positions of each cluster for vertical connectors
    const clusterYPositions = new Map<number, number>();

    verticalClusters.forEach((verticalCluster, verticalIdx) => {
      // Super cluster label
      elements.push(
        <rect 
          key={`sc-label-bg-${verticalIdx}`}
          x={SVG_PADDING}
          y={currentY}
          width="250"
          height="45"
          rx="8"
          fill="rgba(255,255,255,0.8)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="1"
        />
      );
      elements.push(
        <text 
          key={`sc-label-${verticalIdx}`}
          x={SVG_PADDING + 125}
          y={currentY + 28}
          textAnchor="middle"
          fontSize="24"
          fontWeight="800"
          fill="#1a1a2e"
        >
          Super Cluster {verticalIdx + 1}
        </text>
      );
      
      currentY += 70;
      
      const clusterStartY = currentY;
      
      verticalCluster.forEach((horizontalClusterIdx, positionInVertical) => {
        const struct = renderStructure[horizontalClusterIdx];
        const bgHue = struct.colorSeed;
        const offset = clusterOffsets.get(horizontalClusterIdx) || 0;
        const isFirst = positionInVertical === 0;
        
        // Calculate vertical connectors - connect to any previous cluster with a declared connection
        const connectors: Array<{fromIdx: number, toIdx: number, targetClusterIdx: number, clusterSpan: number, fromY: number}> = [];
        if (!isFirst) {
          const currentPosition = positionInVertical;
          
          // Look through all previous clusters to find ones with declared connections
          for (let prevPos = 0; prevPos < currentPosition; prevPos++) {
            const prevClusterIdx = verticalCluster[prevPos];
            const prevCluster = sortedHorizontalClusters[prevClusterIdx];
            const prevClusterY = clusterYPositions.get(prevClusterIdx) || clusterStartY;
            
            // Check if any product in previous cluster connects to current cluster
            prevCluster.forEach((prevProduct, prevIdx) => {
              const connectedProductIds = verticalConnectionMap.get(prevProduct.id) || [];
              connectedProductIds.forEach(connectedProductId => {
                const targetInfo = productPositionIndex.get(connectedProductId);
                if (targetInfo && targetInfo.clusterIdx === horizontalClusterIdx) {
                  const currentIdx = targetInfo.positionInCluster;
                  // Only add if we haven't already added a connector for this current product
                  const alreadyConnected = connectors.some(c => c.toIdx === currentIdx);
                  if (!alreadyConnected) {
                    const clusterSpan = currentPosition - prevPos;
                    connectors.push({ 
                      fromIdx: prevIdx, 
                      toIdx: currentIdx, 
                      targetClusterIdx: prevClusterIdx, 
                      clusterSpan,
                      fromY: prevClusterY
                    });
                  }
                }
              });
            });
          }
        }
        
        // Draw vertical connectors
        if (!isFirst && connectors.length > 0) {
          connectors.forEach((conn, connIdx) => {
            const prevOffset = clusterOffsets.get(conn.targetClusterIdx) || 0;
            const fromX = SVG_PADDING + Math.max(0, prevOffset) + conn.fromIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH) + CARD_WIDTH / 2;
            const toX = SVG_PADDING + Math.max(0, offset) + conn.toIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH) + CARD_WIDTH / 2;
            const horizontalOffset = connIdx * HORIZONTAL_CONNECTOR_OFFSET;
            
            elements.push(
              <line
                key={`vconn-${horizontalClusterIdx}-${connIdx}`}
                x1={fromX + horizontalOffset}
                y1={conn.fromY}
                x2={toX + horizontalOffset}
                y2={currentY + 30}
                stroke="black"
                strokeWidth="3"
              />
            );
          });
        }
        
        // Draw cluster products
        struct.itemsForMfg.forEach((itm, itmIdx) => {
          const cardX = SVG_PADDING + Math.max(0, offset) + itmIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH);
          const cardY = currentY;
          const bgColor = `hsl(${bgHue}, 65%, 88%)`;
          const borderColor = `hsl(${bgHue}, 70%, 45%)`;
          const cardIdx = svgGlobalIdx++;
          
          // Card background - using CSS class for hover effects
          elements.push(
            <rect
              key={`card-bg-${cardIdx}`}
              x={cardX}
              y={cardY}
              width={CARD_WIDTH}
              height={60}
              rx="10"
              fill={bgColor}
              stroke={"#d1d5db"}
              strokeWidth={"2"}
              className="product-card"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.25s',
                // @ts-expect-error - CSS custom property
                '--border-color': borderColor
              }}
            />
          );
          
          // Card text
          elements.push(
            <text
              key={`card-text-${cardIdx}`}
              x={cardX + CARD_WIDTH / 2}
              y={cardY + 35}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="#1f2937"
              pointerEvents="none"
            >
              {itm.product} (${itm.price.toFixed(2)})
            </text>
          );
          
          // Horizontal connector
          if (itmIdx < struct.itemsForMfg.length - 1) {
            elements.push(
              <line
                key={`hconn-${cardIdx}`}
                x1={cardX + CARD_WIDTH}
                y1={cardY + 30}
                x2={cardX + CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH}
                y2={cardY + 30}
                stroke="black"
                strokeWidth="3"
              />
            );
          }
        });
        
        // Store the Y position of this cluster (center of card) before moving to the next
        clusterYPositions.set(horizontalClusterIdx, currentY + 30);
        
        currentY += 80 + CLUSTER_VERTICAL_SPACING;
      });
      
      // Add spacing between super clusters
      if (verticalIdx < verticalClusters.length - 1) {
        // Dashed border line
        elements.push(
          <line
            key={`sc-border-${verticalIdx}`}
            x1={SVG_PADDING}
            y1={currentY - 40}
            x2={SVG_WIDTH - SVG_PADDING}
            y2={currentY - 40}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="3"
            strokeDasharray="8,4"
          />
        );
        currentY += SUPER_CLUSTER_SPACING - 40;
      }
    });
    
    const totalHeight = currentY + 80;
    
    const renderTime = profiler.end('renderSVG');
    const allTimings = profiler.getTimings();
    
    if (import.meta.env.DEV) {
      console.log(`SVG render took: ${renderTime.toFixed(2)}ms`);
      console.log(`Content dimensions: ${SVG_WIDTH}x${totalHeight}`);
    }
    
    return {
      svg: (
        <svg 
          width={SVG_WIDTH} 
          height={totalHeight}
          style={{
            background: `linear-gradient(117deg, #${Math.abs(Math.sin(0.5) * 16777215).toString(16).substring(0,6).padStart(6, '0')} 0%, #${Math.abs(Math.cos(0.7) * 16777215).toString(16).substring(0,6).padStart(6, '0')} 100%)`,
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        >
          {elements}
        </svg>
      ),
      timings: allTimings,
      contentWidth: SVG_WIDTH,
      contentHeight: totalHeight
    };
  }, [sortedHorizontalClusters, verticalClusters, clusterOffsets, verticalConnectionMap, renderStructure, productPositionIndex]);

  // Update timing display when render completes - using useEffect
  const { svg: svgElement, timings, contentWidth, contentHeight } = svgContent;
  useEffect(() => {
    if (timings && timings.length > 0) {
      setLastRenderTime(timings);
    }
  }, [timings]);

  // Calculate scale to fit viewport
  const [viewportDimensions, setViewportDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  useEffect(() => {
    const handleResize = () => {
      setViewportDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate scale to fit viewport with some padding - memoized to prevent re-renders
  const scale = useMemo(() => {
    const viewportPadding = 40; // Padding around the content
    const controlPanelWidth = 280; // Space for control panel
    const performanceOverlayWidth = 300; // Space for performance overlay
    
    const availableWidth = viewportDimensions.width - controlPanelWidth - performanceOverlayWidth - viewportPadding * 2;
    const availableHeight = viewportDimensions.height - viewportPadding * 2;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    return Math.min(scaleX, scaleY, 1); // Never scale up, only down
  }, [viewportDimensions, contentWidth, contentHeight]);

  // Calculate total product count
  const totalProducts = groceryData.length;
  const totalClusters = sortedHorizontalClusters.length;

  return (
    <div style={{ 
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Control Panel */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>Controls</h3>
        <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={useTestData} 
            onChange={(e) => setUseTestData(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Use Test Data (49 products - 7x7)
        </label>
        <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showPerformanceOverlay} 
            onChange={(e) => setShowPerformanceOverlay(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Show Performance Metrics
        </label>
      </div>

      {/* Performance Overlay */}
      {showPerformanceOverlay && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '13px',
          zIndex: 1000,
          minWidth: '280px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
            ⚡ Performance Metrics
          </div>
          <div style={{ marginBottom: '5px' }}>
            📊 Total Products: <strong>{totalProducts}</strong>
          </div>
          <div style={{ marginBottom: '5px' }}>
            🔗 Total Clusters: <strong>{totalClusters}</strong>
          </div>
          <div style={{ marginBottom: '5px' }}>
            🏗️ Clustering Time: <strong>{clusteringTime.toFixed(2)}ms</strong>
          </div>
          <div style={{ marginBottom: '5px' }}>
            📐 Content Size: <strong>{contentWidth.toFixed(0)}x{contentHeight.toFixed(0)}</strong>
          </div>
          <div style={{ marginBottom: '5px' }}>
            🔍 Scale Factor: <strong>{(scale * 100).toFixed(1)}%</strong>
          </div>
          {lastRenderTime.length > 0 && (
            <>
              <div style={{ marginTop: '10px', marginBottom: '5px', fontSize: '12px', opacity: 0.8 }}>
                Last Render Breakdown:
              </div>
              {lastRenderTime.map((timing, idx) => (
                <div key={idx} style={{ marginLeft: '10px', fontSize: '12px' }}>
                  • {timing.name}: <strong>{timing.duration.toFixed(2)}ms</strong>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Main SVG Content */}
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
        transition: 'transform 0.3s ease-in-out'
      }}>
        {svgElement}
      </div>
    </div>
  );
}

export default App
