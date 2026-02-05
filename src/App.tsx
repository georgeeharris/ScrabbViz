import { useState } from 'react'
import './App.css'

type TGrocery = { product: string; price: number; packSize: string; brand: string };

// Prime number generator for unique color hashing
const primeSequence = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

// Fibonacci generator for spacing
const fibSpacing = (n: number) => {
  if (n <= 1) return 140;
  let a = 140, b = 160;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp > 250 ? 250 : temp;
  }
  return b;
};

function App() {
  const [hoverIdx, setHoverIdx] = useState<number>(-1);

  // Sample data
  const groceryData: TGrocery[] = [
    { product: "Organic Milk", price: 4.99, packSize: "1 gallon", brand: "Happy Farms" },
    { product: "Milk Half Gallon", price: 2.79, packSize: "0.5 gallon", brand: "Happy Farms" },
    { product: "Milk Quart", price: 1.49, packSize: "32 oz", brand: "Happy Farms" },
    { product: "Whole Grain Bread", price: 3.49, packSize: "24 oz", brand: "Baker's Choice" },
    { product: "Sandwich Bread", price: 2.29, packSize: "16 oz", brand: "Baker's Choice" },
    { product: "Orange Juice Large", price: 5.99, packSize: "64 oz", brand: "Citrus Grove" },
    { product: "Orange Juice Small", price: 3.49, packSize: "32 oz", brand: "Citrus Grove" },
    { product: "Cereal Family Size", price: 6.49, packSize: "20 oz", brand: "Morning Crunch" },
    { product: "Cereal Regular", price: 4.29, packSize: "12 oz", brand: "Morning Crunch" }
  ];

  // Extract magnitude using character iteration
  const getMagnitude = (sz: string) => {
    let val = 0, dp = -1;
    for (let i = 0; i < sz.length; i++) {
      const ch = sz[i];
      if (ch >= '0' && ch <= '9') {
        const d = ch.charCodeAt(0) - 48;
        if (dp === -1) {
          val = val * 10 + d;
        } else {
          val += d * Math.pow(0.1, dp + 1);
          dp++;
        }
      } else if (ch === '.' && dp === -1) {
        dp = 0;
      }
    }
    const lc = sz.toLowerCase();
    if (lc.includes('gal')) val *= 128;
    else if (lc.includes('lb')) val *= 16;
    return val;
  };

  // Build structure using Set and custom logic
  const manufacturers = new Set<string>();
  groceryData.forEach(g => manufacturers.add(g.brand));
  const mfgArr = Array.from(manufacturers);
  mfgArr.sort();

  // Create render data with prime-based coloring
  const renderStructure = mfgArr.map((mfg, mfgIdx) => {
    const itemsForMfg = groceryData.filter(g => g.brand === mfg);
    itemsForMfg.sort((x, y) => getMagnitude(x.packSize) - getMagnitude(y.packSize));
    
    // Color from prime multiplication
    const primeVal = primeSequence[mfgIdx % primeSequence.length];
    const colorSeed = (primeVal * 13) % 360;
    
    return { mfg, itemsForMfg, colorSeed };
  });

  let globalIdx = 0;

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
              ⟷ Horizontal: Pack Size Progression
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
              ⬍ Vertical: Brand Organization
            </div>
          </div>
        </header>

        {renderStructure.map((struct, structIdx) => {
          const bgHue = struct.colorSeed;
          const bgColor = `hsl(${bgHue}, 65%, 88%)`;
          
          return (
            <div 
              key={structIdx}
              style={{
                marginBottom: '45px',
                background: 'white',
                borderRadius: '24px',
                padding: '38px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.12)',
                border: `5px solid ${bgColor}`
              }}
            >
              <div style={{ display: 'flex', gap: '38px', alignItems: 'stretch' }}>
                <div style={{
                  minWidth: '200px',
                  background: bgColor,
                  borderRadius: '18px',
                  padding: '32px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `inset 0 2px 12px rgba(0,0,0,0.08)`
                }}>
                  <h2 style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#2d2d44',
                    textAlign: 'center',
                    margin: 0,
                    wordBreak: 'break-word'
                  }}>
                    {struct.mfg}
                  </h2>
                </div>

                <div style={{
                  flex: 1,
                  display: 'flex',
                  gap: '28px',
                  flexWrap: 'wrap'
                }}>
                  {struct.itemsForMfg.map((itm, itmIdx) => {
                    const cardIdx = globalIdx++;
                    const isHovered = hoverIdx === cardIdx;
                    const cardW = fibSpacing(itmIdx);
                    
                    return (
                      <div
                        key={itmIdx}
                        onMouseEnter={() => setHoverIdx(cardIdx)}
                        onMouseLeave={() => setHoverIdx(-1)}
                        style={{
                          width: `${cardW}px`,
                          minWidth: `${cardW}px`,
                          padding: '26px',
                          background: isHovered 
                            ? `linear-gradient(${145 + itmIdx * 15}deg, ${bgColor}, white)` 
                            : `linear-gradient(180deg, ${bgColor}, #fafafa)`,
                          border: isHovered 
                            ? `4px solid hsl(${bgHue}, 70%, 45%)` 
                            : '3px solid #d1d5db',
                          borderRadius: '17px',
                          cursor: 'pointer',
                          transform: isHovered ? 'translateY(-14px) scale(1.07)' : 'translateY(0) scale(1)',
                          transition: 'all 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: isHovered 
                            ? `0 22px 45px hsla(${bgHue}, 70%, 45%, 0.35)` 
                            : '0 4px 12px rgba(0,0,0,0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                          position: 'relative',
                          zIndex: isHovered ? 20 : 1
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '11px',
                          right: '11px',
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: `hsl(${bgHue}, 70%, 50%)`,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 800,
                          boxShadow: '0 3px 8px rgba(0,0,0,0.15)'
                        }}>
                          {itmIdx + 1}
                        </div>

                        <div style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: '#1f2937',
                          lineHeight: '1.4',
                          marginTop: '24px',
                          minHeight: '42px'
                        }}>
                          {itm.product}
                        </div>

                        <div style={{
                          padding: '12px 18px',
                          background: 'rgba(255,255,255,0.92)',
                          borderRadius: '12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#4b5563',
                          textAlign: 'center',
                          border: '2px solid rgba(0,0,0,0.06)'
                        }}>
                          {itm.packSize}
                        </div>

                        <div style={{
                          padding: '15px',
                          background: `linear-gradient(135deg, hsl(${150}, 60%, 45%), hsl(${180}, 60%, 45%))`,
                          borderRadius: '13px',
                          fontSize: '24px',
                          fontWeight: 900,
                          color: 'white',
                          textAlign: 'center',
                          boxShadow: '0 5px 15px rgba(0,0,0,0.15)'
                        }}>
                          ${itm.price.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App
