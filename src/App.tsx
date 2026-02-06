import { useState } from 'react'
import './App.css'

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
  const [hoverIdx, setHoverIdx] = useState<number>(-1);

  // Sample data with 3 separate super clusters
  const groceryData: TGrocery[] = [
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
  const horizontalPairs: TProductPair[] = [
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
  const verticalPairs: TProductPair[] = [
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

  // Create product map
  const productMap = new Map<string, TGrocery>();
  groceryData.forEach(p => productMap.set(p.id, p));

  // Build horizontal clusters
  const horizontalClusters = buildClusters(horizontalPairs);
  
  // Sort each horizontal cluster by price (most expensive at right/first)
  const sortedHorizontalClusters = horizontalClusters.map(cluster => 
    sortCluster(cluster, horizontalPairs, productMap)
  );
  
  // Sort horizontal clusters by max price (most expensive cluster first/top)
  sortedHorizontalClusters.sort((a, b) => {
    const maxPriceA = Math.max(...a.map(p => p.price));
    const maxPriceB = Math.max(...b.map(p => p.price));
    return maxPriceB - maxPriceA;
  });

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

  const verticalClusters = buildVerticalClusters();

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
  
  const verticalConnectionMap = buildVerticalConnectionMap();

  // Card sizing constants used for layout calculations
  const CARD_WIDTH = 200; // Approximate card width including padding
  const CARD_GAP = 20; // Gap between cards in horizontal cluster
  const CONNECTOR_WIDTH = 40; // Width of horizontal connector line
  const MIN_VERTICAL_CONNECTOR_WIDTH = 3; // Minimum width for vertical connectors
  const BASE_VERTICAL_CONNECTOR_HEIGHT = 30; // Base height for vertical connector
  const VERTICAL_CONNECTOR_SPACING = 15; // Vertical spacing between multiple connectors (increased for better visibility)
  const HORIZONTAL_CONNECTOR_OFFSET = 5; // Horizontal offset per connector to prevent overlap

  // Create render data with prime-based coloring using clusters
  const renderStructure = sortedHorizontalClusters.map((clusterItems, clusterIdx) => {
    // Use cluster index for label
    const clusterLabel = `Cluster ${clusterIdx + 1}`;
    
    // Color from prime multiplication
    const primeVal = primeSequence[clusterIdx % primeSequence.length];
    const colorSeed = (primeVal * 13) % 360;
    
    return { mfg: clusterLabel, itemsForMfg: clusterItems, colorSeed };
  });

  let globalIdx = 0;

  // Calculate horizontal offsets for each cluster based on vertical connections
  const calculateClusterOffsets = (): Map<number, number> => {
    const offsets = new Map<number, number>();
    
    verticalClusters.forEach(verticalCluster => {
      if (verticalCluster.length === 0) return;
      
      // First cluster in vertical group has offset 0
      offsets.set(verticalCluster[0], 0);
      
      // For each subsequent cluster, calculate offset based on first vertical connection
      for (let i = 1; i < verticalCluster.length; i++) {
        const currentClusterIdx = verticalCluster[i];
        const prevClusterIdx = verticalCluster[i - 1];
        
        const currentCluster = sortedHorizontalClusters[currentClusterIdx];
        const prevCluster = sortedHorizontalClusters[prevClusterIdx];
        
        // Find the first vertical connection from prev cluster to current cluster
        let sourceProductIdx = -1;
        let targetProductIdx = -1;
        
        for (let j = 0; j < prevCluster.length; j++) {
          const sourceProduct = prevCluster[j];
          const connectedProductIds = verticalConnectionMap.get(sourceProduct.id) || [];
          
          for (const connectedProductId of connectedProductIds) {
            const targetIdx = currentCluster.findIndex(p => p.id === connectedProductId);
            if (targetIdx !== -1) {
              sourceProductIdx = j;
              targetProductIdx = targetIdx;
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
    
    return offsets;
  };
  
  const clusterOffsets = calculateClusterOffsets();

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      padding: '80px 60px',
      background: `linear-gradient(${117}deg, #${Math.abs(Math.sin(0.5) * 16777215).toString(16).substring(0,6)} 0%, #${Math.abs(Math.cos(0.7) * 16777215).toString(16).substring(0,6)} 100%)`
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: `${48 + Math.sin(0.3) * 8}px`, 
            fontWeight: 900,
            color: '#1a1a2e',
            marginBottom: '40px'
          }}>
            Grocery Product Relationship Grid
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '70px', flexWrap: 'wrap' }}>
            <div style={{ 
              padding: '18px 36px',
              background: `hsl(${210}, 70%, 50%)`,
              color: 'white',
              borderRadius: '35px',
              fontWeight: 700,
              fontSize: '17px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              ⟷ Horizontal: Product Relationships
            </div>
            <div style={{ 
              padding: '18px 36px',
              background: `hsl(${340}, 70%, 50%)`,
              color: 'white',
              borderRadius: '35px',
              fontWeight: 700,
              fontSize: '17px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              ↕ Vertical: Cluster Organization
            </div>
          </div>
        </header>

        {verticalClusters.map((verticalCluster, verticalIdx) => (
          <div 
            key={verticalIdx}
            style={{
              marginBottom: '120px', // Increased spacing between super clusters
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              paddingBottom: verticalIdx < verticalClusters.length - 1 ? '40px' : '0',
              borderBottom: verticalIdx < verticalClusters.length - 1 ? '3px dashed rgba(0,0,0,0.15)' : 'none'
            }}
          >
            {/* Super Cluster Label */}
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#1a1a2e',
              marginBottom: '30px',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              Super Cluster {verticalIdx + 1}
            </div>
            
            {verticalCluster.map((horizontalClusterIdx, positionInVertical) => {
              const struct = renderStructure[horizontalClusterIdx];
              const bgHue = struct.colorSeed;
              const bgColor = `hsl(${bgHue}, 65%, 88%)`;
              const isFirst = positionInVertical === 0;
              const offset = clusterOffsets.get(horizontalClusterIdx) || 0;
              
              // Calculate vertical connectors for this cluster
              // Look for connections to ANY cluster below this one in the vertical group, not just the next one
              const connectors: Array<{fromIdx: number, toIdx: number, targetClusterIdx: number, clusterSpan: number}> = [];
              if (!isFirst) {
                const currentPosition = positionInVertical;
                const currentCluster = sortedHorizontalClusters[horizontalClusterIdx];
                
                // Check all previous clusters in this vertical group
                for (let prevPos = 0; prevPos < currentPosition; prevPos++) {
                  const prevClusterIdx = verticalCluster[prevPos];
                  const prevCluster = sortedHorizontalClusters[prevClusterIdx];
                  
                  prevCluster.forEach((prevProduct, prevIdx) => {
                    const connectedProductIds = verticalConnectionMap.get(prevProduct.id) || [];
                    connectedProductIds.forEach(connectedProductId => {
                      const currentIdx = currentCluster.findIndex(p => p.id === connectedProductId);
                      if (currentIdx !== -1) {
                        // clusterSpan tracks how many clusters this connector spans (reserved for future use)
                        const clusterSpan = currentPosition - prevPos;
                        connectors.push({ fromIdx: prevIdx, toIdx: currentIdx, targetClusterIdx: prevClusterIdx, clusterSpan });
                      }
                    });
                  });
                }
              }
              
              return (
                <div key={horizontalClusterIdx} style={{ width: '100%' }}>
                  {!isFirst && connectors.length > 0 && (
                    <div style={{
                      position: 'relative',
                      height: `${BASE_VERTICAL_CONNECTOR_HEIGHT + (connectors.length - 1) * VERTICAL_CONNECTOR_SPACING}px`,
                      marginLeft: `${Math.max(0, offset)}px`
                    }}>
                      {connectors.map((conn, connIdx) => {
                        const prevOffset = clusterOffsets.get(conn.targetClusterIdx) || 0;
                        const fromX = prevOffset - offset + conn.fromIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH) + CARD_WIDTH / 2;
                        const toX = conn.toIdx * (CARD_WIDTH + CARD_GAP + CONNECTOR_WIDTH) + CARD_WIDTH / 2;
                        
                        // Add horizontal offset to separate overlapping connectors
                        const horizontalOffset = connIdx * HORIZONTAL_CONNECTOR_OFFSET;
                        
                        return (
                          <div
                            key={connIdx}
                            style={{
                              position: 'absolute',
                              left: `${Math.min(fromX, toX) + horizontalOffset}px`,
                              top: `${connIdx * VERTICAL_CONNECTOR_SPACING}px`,
                              width: `${Math.abs(fromX - toX) || MIN_VERTICAL_CONNECTOR_WIDTH}px`,
                              height: `${BASE_VERTICAL_CONNECTOR_HEIGHT}px`,
                              background: 'black',
                              borderRadius: '2px'
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <div 
                    style={{
                      marginBottom: '0px',
                      marginLeft: `${Math.max(0, offset)}px`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      alignItems: 'center',
                      flexWrap: 'nowrap'
                    }}>
                      {struct.itemsForMfg.map((itm, itmIdx) => {
                        const isNotLast = itmIdx < struct.itemsForMfg.length - 1;
                        return (
                          <div key={itmIdx} style={{ display: 'flex', alignItems: 'center' }}>
                            {(() => {
                              const cardIdx = globalIdx++;
                              const isHovered = hoverIdx === cardIdx;
                              
                              return (
                                <div
                                  onMouseEnter={() => setHoverIdx(cardIdx)}
                                  onMouseLeave={() => setHoverIdx(-1)}
                                  style={{
                                    width: `${CARD_WIDTH}px`,
                                    padding: '12px 20px',
                                    background: isHovered 
                                      ? `linear-gradient(${145 + itmIdx * 15}deg, ${bgColor}, white)` 
                                      : `linear-gradient(180deg, ${bgColor}, #fafafa)`,
                                    border: isHovered 
                                      ? `3px solid hsl(${bgHue}, 70%, 45%)` 
                                      : '2px solid #d1d5db',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transform: isHovered ? 'translateY(-8px) scale(1.05)' : 'translateY(0) scale(1)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isHovered 
                                      ? `0 12px 24px hsla(${bgHue}, 70%, 45%, 0.3)` 
                                      : '0 2px 8px rgba(0,0,0,0.08)',
                                    position: 'relative',
                                    zIndex: isHovered ? 20 : 1,
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#1f2937',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  {itm.product} (${itm.price.toFixed(2)})
                                </div>
                              );
                            })()}
                            
                            {isNotLast && (
                              <div style={{
                                width: '40px',
                                height: '3px',
                                background: 'black',
                                zIndex: 0
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App
