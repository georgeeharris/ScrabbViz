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

// Pan and zoom constants
const ZOOM_STEP = 1.2; // Zoom multiplier for in/out buttons
const MAX_ZOOM = 5; // Maximum zoom level (500%)
const MIN_ZOOM = 0.1; // Minimum zoom level (10%)
const SCROLL_SENSITIVITY = 1000; // Mouse wheel scroll sensitivity

function App() {
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState<boolean>(true);
  const [useTestData, setUseTestData] = useState<boolean>(false);
  const [lastRenderTime, setLastRenderTime] = useState<TimingResult[]>([]);
  
  // Pan and zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Test data: Complex relationship scenario
  // Demonstrates the algorithm's ability to handle complex relationships:
  // 
  // Scenario: Three horizontal clusters (abc, def, xyz)
  // - Strong chain: a-d-x (spans all three clusters with 2 connections)
  // - Weak connection: a-e (only connects two clusters with 1 connection)
  // 
  // Expected behavior:
  // 1. The algorithm identifies that cluster DEF (containing d) has 2 connections (to a and x)
  // 2. Cluster ABC (containing a) has 2 connections (to d and e)
  // 3. Cluster XYZ (containing x) has 1 connection (to d)
  // 4. Starting from highest-connected cluster, builds order by following strongest chains
  // 5. The a-d-x chain is prioritized over the standalone a-e connection
  // 6. Result: Clusters arranged to showcase the strong vertical chain
  //
  // This validates that single-cluster connections (like a-e) don't disrupt the 
  // positioning determined by multi-cluster chains (like a-d-x).
  const testData: TGrocery[] = [
    // Cluster ABC - Brand Alpha products
    { id: "a", product: "Alpha Large", price: 9.99, packSize: "1kg", brand: "Alpha" },
    { id: "b", product: "Alpha Medium", price: 6.99, packSize: "500g", brand: "Alpha" },
    { id: "c", product: "Alpha Small", price: 3.99, packSize: "250g", brand: "Alpha" },
    
    // Cluster DEF - Brand Beta products
    { id: "d", product: "Beta Large", price: 8.99, packSize: "1kg", brand: "Beta" },
    { id: "e", product: "Beta Medium", price: 5.99, packSize: "500g", brand: "Beta" },
    { id: "f", product: "Beta Small", price: 2.99, packSize: "250g", brand: "Beta" },
    
    // Cluster XYZ - Brand Gamma products
    { id: "x", product: "Gamma Large", price: 7.99, packSize: "1kg", brand: "Gamma" },
    { id: "y", product: "Gamma Medium", price: 4.99, packSize: "500g", brand: "Gamma" },
    { id: "z", product: "Gamma Small", price: 1.99, packSize: "250g", brand: "Gamma" },
  ];

  // Horizontal pairs - create three distinct horizontal clusters
  const testHorizontalPairs: TProductPair[] = [
    ["b", "a"], ["c", "b"], // Cluster ABC: c-b-a
    ["e", "d"], ["f", "e"], // Cluster DEF: f-e-d  
    ["y", "x"], ["z", "y"], // Cluster XYZ: z-y-x
  ];

  // Vertical pairs - demonstrate complex relationship chains
  // Strong chain: a-d-x (connects all three clusters)
  // Weak chain: a-e (only connects two clusters)
  // The algorithm should prioritize the a-d-x chain for ordering
  const testVerticalPairs: TProductPair[] = [
    ["a", "d"], // Alpha Large to Beta Large (chain link 1)
    ["d", "x"], // Beta Large to Gamma Large (chain link 2)
    ["a", "e"], // Alpha Large to Beta Medium (weaker connection)
  ];

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

  // Analyze relationship chains between horizontal clusters
  // Returns connection weights between clusters for intelligent ordering
  // 
  // This function counts the number of vertical pair connections between each pair of clusters.
  // Higher counts indicate stronger relationships that should influence cluster positioning.
  const analyzeClusterChains = (productToClusterIdx: Map<string, number>): Map<string, number> => {
    // Build adjacency list of cluster connections from vertical pairs
    const clusterConnections = new Map<number, Set<number>>();
    const connectionCounts = new Map<string, number>();
    
    verticalPairs.forEach(([productA, productB]) => {
      const clusterIdxA = productToClusterIdx.get(productA);
      const clusterIdxB = productToClusterIdx.get(productB);
      
      if (clusterIdxA !== undefined && clusterIdxB !== undefined && clusterIdxA !== clusterIdxB) {
        // Add bidirectional edges
        if (!clusterConnections.has(clusterIdxA)) {
          clusterConnections.set(clusterIdxA, new Set());
        }
        if (!clusterConnections.has(clusterIdxB)) {
          clusterConnections.set(clusterIdxB, new Set());
        }
        clusterConnections.get(clusterIdxA)!.add(clusterIdxB);
        clusterConnections.get(clusterIdxB)!.add(clusterIdxA);
        
        // Count connections between each pair of clusters
        // Note: We create bidirectional edges in the adjacency list above for graph traversal,
        // but only count each unique vertical pair once here. The count represents the number
        // of vertical pairs connecting two clusters, not the number of graph edges.
        const pairKey = clusterIdxA < clusterIdxB 
          ? `${clusterIdxA}-${clusterIdxB}` 
          : `${clusterIdxB}-${clusterIdxA}`;
        connectionCounts.set(pairKey, (connectionCounts.get(pairKey) || 0) + 1);
      }
    });
    
    return connectionCounts;
  };

  // Build vertical cluster groupings based on verticalPairs
  // This groups horizontal clusters that should be displayed vertically together
  // 
  // Enhanced with intelligent ordering based on relationship chain strength:
  // 1. Analyzes all vertical pair connections to determine chain weights
  // 2. Orders clusters within each vertical group by following strongest connections
  // 3. Starts from the cluster with most total connections
  // 4. Greedily adds the next unvisited cluster with strongest connection to any visited cluster
  // 5. Implements deterministic tie-breaking using alphabetical order of first product IDs
  // 
  // Example: Given clusters ABC, DEF, XYZ with relationships:
  //   - a-d (1 connection), d-x (1 connection) = strong chain spanning all three
  //   - a-e (1 connection) = weak chain connecting only two
  // Result: Orders as DEF, ABC, XYZ (or similar) following the strongest chain
  //
  // Deterministic behavior ensures consistent rendering across multiple draws.
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

    // Analyze relationship chains
    const connectionCounts = analyzeClusterChains(productToClusterIdx);

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

    // Convert to array
    const verticalClusters = Array.from(verticalClusterMap.values());
    
    // Sort each vertical cluster based on relationship chain strength
    verticalClusters.forEach(group => {
      if (group.length <= 1) return;
      
      // Build a graph for this vertical cluster group
      const groupConnections = new Map<number, Map<number, number>>();
      group.forEach(clusterIdx => {
        groupConnections.set(clusterIdx, new Map());
      });
      
      // Populate connection weights between clusters in this group
      group.forEach(clusterIdxA => {
        group.forEach(clusterIdxB => {
          if (clusterIdxA !== clusterIdxB) {
            const pairKey = clusterIdxA < clusterIdxB 
              ? `${clusterIdxA}-${clusterIdxB}` 
              : `${clusterIdxB}-${clusterIdxA}`;
            const weight = connectionCounts.get(pairKey) || 0;
            if (weight > 0) {
              groupConnections.get(clusterIdxA)!.set(clusterIdxB, weight);
              groupConnections.get(clusterIdxB)!.set(clusterIdxA, weight);
            }
          }
        });
      });
      
      // Find the cluster with the most connections to start ordering
      let maxConnections = 0;
      let startCluster = group[0];
      group.forEach(clusterIdx => {
        const connections = groupConnections.get(clusterIdx)!;
        const totalWeight = Array.from(connections.values()).reduce((sum, w) => sum + w, 0);
        if (totalWeight > maxConnections) {
          maxConnections = totalWeight;
          startCluster = clusterIdx;
        } else if (totalWeight === maxConnections) {
          // Deterministic tie-breaking: use cluster with lowest first product ID alphabetically
          const currentFirstProduct = sortedHorizontalClusters[clusterIdx][0]?.id || '';
          const startFirstProduct = sortedHorizontalClusters[startCluster][0]?.id || '';
          if (currentFirstProduct.localeCompare(startFirstProduct) < 0) {
            startCluster = clusterIdx;
          }
        }
      });
      
      // Build ordering by following strongest connections
      const ordered: number[] = [startCluster];
      const visited = new Set<number>([startCluster]);
      
      while (ordered.length < group.length) {
        let nextCluster = -1;
        let maxWeight = 0;
        
        // Find the unvisited cluster with the strongest connection to any visited cluster
        ordered.forEach(visitedCluster => {
          const connections = groupConnections.get(visitedCluster)!;
          connections.forEach((weight, targetCluster) => {
            if (!visited.has(targetCluster)) {
              if (weight > maxWeight) {
                maxWeight = weight;
                nextCluster = targetCluster;
              } else if (weight === maxWeight && nextCluster !== -1) {
                // Deterministic tie-breaking: prefer cluster with lower first product ID
                const nextFirstProduct = sortedHorizontalClusters[targetCluster][0]?.id || '';
                const currentNextFirstProduct = sortedHorizontalClusters[nextCluster][0]?.id || '';
                if (nextFirstProduct.localeCompare(currentNextFirstProduct) < 0) {
                  nextCluster = targetCluster;
                }
              }
            }
          });
        });
        
        if (nextCluster === -1) {
          // No connected cluster found, add remaining clusters alphabetically
          const remaining = group.filter(c => !visited.has(c));
          remaining.sort((a, b) => {
            const aFirstProduct = sortedHorizontalClusters[a][0]?.id || '';
            const bFirstProduct = sortedHorizontalClusters[b][0]?.id || '';
            return aFirstProduct.localeCompare(bFirstProduct);
          });
          ordered.push(...remaining);
          break;
        }
        
        ordered.push(nextCluster);
        visited.add(nextCluster);
      }
      
      // Replace the group with the ordered version
      group.splice(0, group.length, ...ordered);
    });
    
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

  // Viewport padding constants for auto-scaling calculations
  const VIEWPORT_PADDING = 40; // Padding around the content in viewport
  const CONTROL_PANEL_WIDTH = 280; // Width reserved for the control panel
  const PERFORMANCE_OVERLAY_WIDTH = 300; // Width reserved for the performance overlay

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
        const connectors: Array<{fromIdx: number, toIdx: number, sourceClusterIdx: number, clusterSpan: number, fromY: number}> = [];
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
                  // Check if this specific connection (from prevIdx to currentIdx from prevClusterIdx) already exists
                  const alreadyConnected = connectors.some(c => 
                    c.fromIdx === prevIdx && c.toIdx === currentIdx && c.sourceClusterIdx === prevClusterIdx
                  );
                  if (!alreadyConnected) {
                    const clusterSpan = currentPosition - prevPos;
                    connectors.push({ 
                      fromIdx: prevIdx, 
                      toIdx: currentIdx, 
                      sourceClusterIdx: prevClusterIdx, 
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
            const prevOffset = clusterOffsets.get(conn.sourceClusterIdx) || 0;
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
    const availableWidth = viewportDimensions.width - CONTROL_PANEL_WIDTH - PERFORMANCE_OVERLAY_WIDTH - VIEWPORT_PADDING * 2;
    const availableHeight = viewportDimensions.height - VIEWPORT_PADDING * 2;
    
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    return Math.min(scaleX, scaleY, 1); // Never scale up, only down
  }, [viewportDimensions, contentWidth, contentHeight]);

  // Pan and zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / ZOOM_STEP, MIN_ZOOM));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY / SCROLL_SENSITIVITY;
    setZoomLevel(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * (1 + delta))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Memoize transform calculation for performance
  const contentTransform = useMemo(() => {
    const combinedScale = Math.max(scale * zoomLevel, 0.001); // Ensure minimum scale to prevent division by zero
    const translateX = panOffset.x / combinedScale;
    const translateY = panOffset.y / combinedScale;
    return `scale(${combinedScale}) translate(${translateX}px, ${translateY}px)`;
  }, [scale, zoomLevel, panOffset]);

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
        
        {/* Zoom Controls */}
        <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pan & Zoom</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={handleZoomIn}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔍+ Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                flex: 1,
                padding: '8px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              🔍- Zoom Out
            </button>
          </div>
          <button
            onClick={handleResetZoom}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Reset View
          </button>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            Zoom: {(zoomLevel * 100).toFixed(0)}% | Drag to pan
          </div>
        </div>
        
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
      <div 
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{
          transform: contentTransform,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}>
          {svgElement}
        </div>
      </div>
    </div>
  );
}

export default App
