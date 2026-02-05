# ScrabbViz - Grocery Product Relationship Visualizer

A React + TypeScript application that visualizes grocery products in 2D space, showing relationships across two dimensions: pack size (horizontal axis) and brand (vertical axis).

![Grocery Product Grid](https://github.com/user-attachments/assets/bf2bf54f-cc4a-4924-9efb-7e2d56a781af)

## Overview

This visualization tool renders connected grocery products in a spatial layout where:
- **Horizontal Axis**: Represents pack size relationships (smallest to largest) within the same brand
- **Vertical Axis**: Represents brand relationships (organized alphabetically)

## Features

- **2D Spatial Layout**: Products organized in a grid showing size and brand relationships
- **Interactive Cards**: Hover effects with smooth animations and visual feedback
- **Fibonacci Spacing**: Card widths increase using the Fibonacci sequence for organic visual progression
- **Prime-based Color Coding**: Each brand gets a unique color generated using prime number algorithms
- **Position Indicators**: Numbered badges show the size ranking within each brand
- **Responsive Design**: Adapts to different screen sizes with flexbox layout

## Data Structure

The component accepts an array of product objects with this structure:

```typescript
type TGrocery = {
  product: string;   // Product name (e.g., "Organic Milk")
  price: number;     // Price in dollars (e.g., 4.99)
  packSize: string;  // Size with unit (e.g., "1 gallon", "16 oz", "0.5 lb")
  brand: string;     // Brand/manufacturer name (e.g., "Happy Farms")
};
```

## How It Works

### Size Extraction Algorithm
A custom parser extracts numerical values from pack size strings:
- Handles decimal numbers (e.g., "0.5 gallon")
- Converts units to a common base (gallons → oz, pounds → oz)
- Supports various unit formats (oz, lb, gallon, kg, gram)

### Organization Logic
1. Products are grouped by brand
2. Brands are sorted alphabetically for vertical positioning
3. Within each brand, products are sorted by pack size magnitude
4. Visual spacing uses Fibonacci sequence (140, 160, up to 250px)
5. Colors are generated using prime number hashing for uniqueness

### Visual Design
- Gradient background with mathematical color generation
- Brand sections with distinctive color coding
- Product cards with hover states and smooth transitions
- Position badges indicating size rank within brand group

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

## Example Data

The application includes sample data demonstrating:
- **Happy Farms**: Milk products (Quart, Half Gallon, Gallon)
- **Baker's Choice**: Bread products (16 oz, 24 oz)
- **Citrus Grove**: Orange juice (32 oz, 64 oz)
- **Morning Crunch**: Cereal (12 oz, 20 oz)

## Customization

To use your own product data, modify the `groceryData` array in `src/App.tsx`:

```typescript
const groceryData: TGrocery[] = [
  { product: "Your Product", price: 9.99, packSize: "32 oz", brand: "Your Brand" },
  // Add more products...
];
```

## License

This project is open source and available under the MIT License.
