# Grocery Product Relationship Visualizer

A React + TypeScript application that visualizes grocery products in 2D space, showing dynamic relationships between products based on configurable relationship pairs.

![Product Relationship Grid](https://github.com/user-attachments/assets/82338cf5-c16a-4405-b25f-7463e40bd9e4)

## Overview

This visualization tool renders connected grocery products in a spatial layout where:
- **Horizontal Axis**: Represents product relationships within clusters (most expensive products appear first/rightmost)
- **Vertical Axis**: Represents cluster organization via vertical pairs (clusters linked by vertical pairs are stacked together)

## Features

- **Dual Rendering Modes**: Choose between HTML-based or SVG-based visualization, or view both side-by-side for comparison
  - **HTML Mode**: Traditional DOM-based rendering with flexbox layout
  - **SVG Mode**: Vector-based rendering with crisp, drawn connections - especially clean when displaying multiple connections from single nodes
  - **Toggle Control**: Switch between modes using the fixed toggle in the top-right corner
- **Dynamic Cluster Formation**: Products are grouped using relationship pairs through a Union-Find algorithm
- **Horizontal Clustering**: Products are organized horizontally within clusters based on horizontal pairs
- **Vertical Clustering**: Clusters are organized vertically based on vertical pairs, creating stacked groups
- **Multiple Super Clusters**: Support for multiple independent cluster groups that are visually separated (e.g., white bread vs wholemeal bread)
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

## Visualization Modes

The application offers three visualization modes accessible via a toggle control in the top-right corner:

### HTML Mode
- Traditional DOM-based rendering using div elements
- Flexbox layout with CSS styling
- Horizontal connectors as div elements with background colors
- Vertical connectors as absolutely positioned div elements
- Best for: Simple layouts, familiar HTML/CSS rendering

### SVG Mode  
- Vector-based rendering using native SVG elements
- Crisp, anti-aliased lines and shapes
- Lines drawn using `<line>` elements for precise connections
- Cards rendered as `<rect>` elements with `<text>` overlays
- Best for: Complex connections, multiple overlapping lines, printing/exporting
- Advantages: Scalable without quality loss, cleaner appearance especially with many connections

### Both Mode (Default)
- Displays both HTML and SVG versions side-by-side for comparison
- Allows you to see the differences in rendering approaches
- Useful for choosing which visualization works best for your data

All three modes use the same clustering logic, positioning algorithms, and data structures - only the rendering approach differs.

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

**Super Clusters:**
Multiple independent super clusters are created when vertical pairs don't connect all horizontal clusters:
1. Horizontal clusters that are NOT connected by vertical pairs form separate super clusters
2. Each super cluster is visually separated with increased spacing and dashed borders
3. Super clusters are labeled for easy identification (Super Cluster 1, Super Cluster 2, etc.)
4. This allows for completely separate product categories (e.g., white bread vs wholemeal bread vs dairy)

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

The application includes sample data demonstrating **three separate super clusters**:

### Super Cluster 1: Dairy Products
- Cheddar Cheese (400g $3.99, 200g $2.20)
- Greek Yogurt (500g $2.75, 170g $1.20)
- Organic Milk (2L $2.50, 1L $1.45)

### Super Cluster 2: Wholemeal Bread
- Allinson Wholemeal (800g $1.65, 400g $1.05)
- Hovis Wholemeal (800g $1.55, 400g $0.95)
- Tesco Wholemeal (800g $1.25, 400g $0.75)

### Super Cluster 3: White Bread
- Allinson White (800g $1.45, 400g $0.95)
- Hovis White (800g $1.35, 400g $0.85)
- Tesco White (800g $1.10, 400g $0.65)

### Relationship Structure

Each super cluster demonstrates:
- **Horizontal relationships** connecting pack sizes within the same brand/product type
- **Vertical relationships** connecting different brands/product types within the super cluster

```typescript
// Example: Wholemeal Bread Super Cluster
// Horizontal relationships (pack sizes)
horizontalPairs: [
  ["H", "G"],  // Hovis: 400g → 800g
  ["J", "I"],  // Tesco: 400g → 800g
  ["L", "K"]   // Allinson: 400g → 800g
]

// Vertical relationships (brands - 800g products)
verticalPairs: [
  ["G", "I"],  // Hovis 800g → Tesco 800g
  ["I", "K"]   // Tesco 800g → Allinson 800g
]

// This creates one super cluster with three brands vertically connected:
// Allinson 800g — 400g
//     |
// Tesco 800g — 400g
//     |
// Hovis 800g — 400g
```

The three super clusters (Dairy, Wholemeal Bread, White Bread) are completely independent and visually separated with space and borders.

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
