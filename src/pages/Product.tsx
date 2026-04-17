import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ChevronDown, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { getProducts, formatCurrency, Product } from "@/lib/database";
import InvestDialog from "@/components/InvestDialog";
import ProductDetailDialog from "@/components/ProductDetailDialog";
import ProductCard from "@/components/ProductCard";

const ProductPage = () => {
  const { profile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [investOpen, setInvestOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const loadData = async () => {
    const productsData = await getProducts();
    setProducts(productsData);
    await refreshProfile();
  };

  useEffect(() => {
    loadData();
  }, []);

  const userVipLevel = profile?.vip_level || 0;

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  const availableProducts = filteredProducts.filter(p => p.vip_level <= userVipLevel);
  const lockedProducts = filteredProducts.filter(p => p.vip_level > userVipLevel);

  const handleViewDetail = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleInvest = (product: Product) => {
    setSelectedProduct(product);
    setInvestOpen(true);
  };

  const handleInvestFromDetail = () => {
    if (selectedProduct) {
      setDetailOpen(false);
      setTimeout(() => setInvestOpen(true), 200);
    }
  };

  return (
    <div className="space-y-3 p-4 pt-5">
      {/* Filter bar — drone style */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-foreground/80">
          <span className="font-medium">Saring</span>
          <button className="flex items-center gap-0.5 text-foreground/70 hover:text-foreground">
            Harga <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-0.5 text-foreground/70 hover:text-foreground">
            Hari melayani <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <button className="flex items-center gap-1 text-foreground/70 hover:text-foreground">
          Filter <Filter className="w-3 h-3" />
        </button>
      </div>

      {/* Area selector */}
      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border/60 bg-card/60 text-[11px] text-foreground/80">
        <ChevronDown className="w-3 h-3" />
        Area A1
      </div>

      {/* Category Tabs */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-4 px-4 py-2">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="w-full grid grid-cols-4 h-9 bg-card/60 border border-border/50">
            <TabsTrigger value="all" className="text-[11px]">Semua</TabsTrigger>
            <TabsTrigger value="reguler" className="text-[11px]">Reguler</TabsTrigger>
            <TabsTrigger value="promo" className="text-[11px]">Promo</TabsTrigger>
            <TabsTrigger value="vip" className="text-[11px]">VIP</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Available Products */}
      <div className="space-y-2.5">
        {availableProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetail={handleViewDetail}
            onInvest={handleInvest}
          />
        ))}
      </div>

      {availableProducts.length === 0 && lockedProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-xs">
          Tidak ada drone dalam kategori ini
        </div>
      )}

      {/* Locked Products */}
      {lockedProducts.length > 0 && (
        <div className="space-y-2.5 pt-2">
          {lockedProducts.map((product) => {
            const displayPrice = product.promo_price ?? product.price;
            return (
              <Card key={product.id} className="opacity-60 relative overflow-hidden border-border/50">
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-5 h-5 text-vip-gold mx-auto mb-1" />
                    <p className="text-[10px] text-vip-gold font-medium">Buka kunci VIP {product.vip_level}</p>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <div className="w-28 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover grayscale" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Drone {product.name}</p>
                      <p className="text-xs text-primary/50 mt-1">{formatCurrency(displayPrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProductDetailDialog open={detailOpen} onOpenChange={setDetailOpen} product={selectedProduct} userName={profile?.name} onInvest={handleInvestFromDetail} />
      <InvestDialog open={investOpen} onOpenChange={setInvestOpen} product={selectedProduct} balance={profile?.balance || 0} onSuccess={loadData} />
    </div>
  );
};

export default ProductPage;
