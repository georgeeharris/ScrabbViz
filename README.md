# Grocery Product Relationship Visualizer

A React + TypeScript application that visualizes grocery products in 2D space, showing dynamic relationships between products based on configurable relationship pairs.

![Product Relationship Grid](https://github.com/user-attachments/assets/300f74ba-99a5-41b9-81fe-0105760dc344)

## Overview

This visualization tool renders connected grocery products in a spatial layout where:
- **Horizontal Axis**: Represents product relationships within clusters (most expensive products appear first/rightmost)
- **Vertical Axis**: Represents cluster organization via vertical pairs (clusters linked by vertical pairs are stacked together)

## Features

- **Dynamic Cluster Formation**: Products are grouped using relationship pairs through a Union-Find algorithm
- **Horizontal Clustering**: Products are organized horizontally within clusters based on horizontal pairs
- **Vertical Clustering**: Clusters are organized vertically based on vertical pairs, creating stacked groups
- **Price-Based Ordering**: Products and clusters are sorted by price (most expensive first)
- **Flexible Relationships**: Supports transitive relationships (e.g., A-B and A-C creates A-B-C cluster)
- **Visual Connectors**: Vertical relationships are displayed with gradient connector lines between clusters
- **Interactive Cards**: Hover effects with smooth animations and visual feedback
- **Fibonacci Spacing**: Card widths increase using the Fibonacci sequence for organic visual progression
- **Prime-based Color Coding**: Each cluster gets a unique color generated using prime number algorithms
- **Position Indicators**: Numbered badges show the position within each cluster
- **Responsive Design**: Adapts to different screen sizes with flexbox layout

## Data Structure

The component accepts an array of product objects with this structure:

```typescript
type TGrocery = {
  id: string;        // Unique identifier (e.g., "A", "B", "C")
  product: string;   // Product name (e.g., "Organic Milk")
  price: number;     // Price in dollars (e.g., 4.99)
  packSize: string;  // Size with unit (e.g., "1 gallon", "16 oz", "0.5 lb")
  brand: string;     // Brand/manufacturer name (e.g., "Happy Farms")
};

type TProductPair = [string, string];  // Tuple of product IDs
```

### Relationship Pairs

Products are connected through two types of relationship pairs:

- **Horizontal Pairs**: Define which products belong in the same cluster horizontally
  ```typescript
  const horizontalPairs: TProductPair[] = [
    ["C", "B"], ["B", "A"],  // Creates cluster C-B-A
    ["E", "D"]                // Creates cluster E-D
  ];
  ```

- **Vertical Pairs**: Define cross-cluster relationships for vertical organization
  ```typescript
  const verticalPairs: TProductPair[] = [
    ["A", "D"],  // Links clusters containing A and D vertically
    ["D", "F"]   // Links clusters containing D and F vertically
  ];
  ```
  
  When vertical pairs are defined, clusters containing the linked products are displayed vertically stacked with visual connector lines. For example, if product A is in Cluster 1 and product D is in Cluster 2, these clusters will be shown vertically connected.

## How It Works

### Clustering Algorithm

**Horizontal Clustering:**
Products are grouped using a **Union-Find** data structure:
1. Each horizontal pair creates a union between two products
2. Transitive relationships are automatically handled (A-B and B-C creates A-B-C)
3. Products in the same horizontal cluster share a common root in the union-find tree

**Vertical Clustering:**
Horizontal clusters are organized vertically using another **Union-Find** algorithm:
1. Each vertical pair links the horizontal clusters containing those products
2. Clusters linked by vertical pairs are grouped into vertical clusters
3. Vertical clusters are displayed stacked with connector lines showing relationships

### Ordering Logic
1. **Within Clusters**: Products are sorted by price (descending - most expensive first)
   - Uses BFS traversal starting from the most expensive product
   - Maintains relationship connectivity while ordering by price
2. **Between Clusters**: Clusters are sorted by their maximum product price (descending)
   - Most expensive cluster appears at the top
3. Visual spacing uses Fibonacci sequence (140, 160, up to 250px)
4. Colors are generated using prime number hashing for uniqueness

### Graph Traversal
- Builds an adjacency list from relationship pairs
- Performs breadth-first search (BFS) starting from the highest-priced product
- Neighbors are visited in descending price order
- Ensures all products in a cluster are connected and properly ordered

### Visual Design
- Gradient background with mathematical color generation
- Cluster sections with distinctive color coding
- Product cards with hover states and smooth transitions
- Position badges indicating rank within cluster

## Example Data

The application includes sample data demonstrating:
- **Cluster 1**: Morning Crunch Cereal products (Family Size $6.49, Regular $4.29)
- **Cluster 2**: Citrus Grove Orange Juice (Large $5.99, Small $3.49)
- **Cluster 3**: Happy Farms Milk products (Gallon $4.99, Half Gallon $2.79, Quart $1.49)
- **Cluster 4**: Baker's Choice Bread (Whole Grain $3.49, Sandwich $2.29)

### Relationship Structure
```typescript
// Horizontal relationships define clusters
horizontalPairs: [
  ["C", "B"], ["B", "A"],  // Milk: Quart → Half Gallon → Gallon
  ["E", "D"],              // Bread: Sandwich → Whole Grain
  ["G", "F"],              // OJ: Small → Large
  ["I", "H"]               // Cereal: Regular → Family Size
]

// Vertical relationships link clusters
verticalPairs: [
  ["A", "D"],  // Milk → Bread (links vertically)
  ["D", "F"],  // Bread → OJ (links vertically)
  ["F", "H"]   // OJ → Cereal (links vertically)
]

// This creates one vertical cluster with all four horizontal clusters stacked:
// Cereal (H-I)
//     |
// OJ (F-G)
//     |
// Bread (D-E)
//     |
// Milk (A-B-C)
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Build

```bash
# Build for production
npm run build
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **ESLint** - Code linting

## Customization

To use your own product data, modify the data and relationship pairs in `src/App.tsx`:

```typescript
const groceryData: TGrocery[] = [
  { id: "A", product: "Your Product", price: 9.99, packSize: "32 oz", brand: "Your Brand" },
  // Add more products...
];

const horizontalPairs: TProductPair[] = [
  ["A", "B"],  // Define which products are related horizontally
  // Add more pairs...
];

const verticalPairs: TProductPair[] = [
  ["A", "C"],  // Define which products are related vertically
  // Add more pairs...
];
```

### Key Points:
- Each product must have a unique `id`
- Relationship pairs reference product IDs
- Clusters are formed automatically from connected pairs
- Products within clusters are ordered by price (descending)
- Clusters are ordered by maximum price (descending)

## License

This project is open source and available under the MIT License.
