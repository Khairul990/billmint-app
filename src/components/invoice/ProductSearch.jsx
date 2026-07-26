import { useState, useEffect, useRef } from 'react';

const ProductSearch = ({ 
  value, 
  onChange, 
  onSelectProduct, 
  products = [], 
  placeholder = "Search or type new item...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Filter out invalid products first
    const validProducts = products.filter(p => p.name || p.productName);
    
    if (value) {
      const lower = value.toLowerCase();
      const matches = validProducts.filter(p => {
        const pName = (p.name || p.productName || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        // Improve search accuracy (matches start of word or substring better)
        return pName.includes(lower) || pDesc.includes(lower);
      });
      setFiltered(matches);
    } else {
      setFiltered(validProducts.slice(0, 5)); // Show top 5 when empty
    }
  }, [value, products]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-theme-accent/30 focus:border-theme-accent text-theme-primary transition-all ${className}`}
        />
        {/* We don't add an icon here to match other inputs, but we could add a subtle search icon */}
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-theme-card border border-theme-border-soft rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
          {filtered.length > 0 ? (
            filtered.map((product, idx) => (
              <button
                key={product.id || product.productId || `prod-${idx}`}
                type="button"
                onClick={() => {
                  onSelectProduct(product);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-3 border-b border-theme-border-soft last:border-0 hover:bg-theme-surface transition-colors flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-theme-primary text-sm">{product.name || product.productName}</span>
                  <span className="font-mono text-xs text-theme-accent font-bold">
                    {(product.price > 0 || product.rate > 0) ? `₹${product.price || product.rate}` : ''}
                  </span>
                </div>
                {product.description && (
                  <span className="text-[10px] text-theme-muted line-clamp-1">{product.description}</span>
                )}
              </button>
            ))
          ) : (
            <div className="px-4 py-4 text-center">
              <span className="text-xs font-bold text-theme-muted">No products found</span>
              {value && <span className="block text-[10px] text-theme-muted/70 mt-1">Press enter to add as new item</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
