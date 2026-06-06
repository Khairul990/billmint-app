import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';

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
    if (value) {
      const lower = value.toLowerCase();
      const matches = products.filter(p => 
        p.name?.toLowerCase().includes(lower) || 
        p.description?.toLowerCase().includes(lower)
      );
      setFiltered(matches);
    } else {
      setFiltered(products.slice(0, 5)); // Show top 5 when empty
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

      {isOpen && filtered.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-theme-card border border-theme-border-soft rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden">
          {filtered.map(product => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                onSelectProduct(product);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 border-b border-theme-border-soft last:border-0 hover:bg-theme-surface transition-colors flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-theme-primary text-sm">{product.name}</span>
                <span className="font-mono text-xs text-theme-accent font-bold">
                  {product.price > 0 ? `₹${product.price}` : ''}
                </span>
              </div>
              {product.description && (
                <span className="text-[10px] text-theme-muted line-clamp-1">{product.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
