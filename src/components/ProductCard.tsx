import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, Product } from "@/lib/database";

interface ProductCardProps {
  product: Product;
  onViewDetail: (product: Product) => void;
  onInvest: (product: Product) => void;
}

// Generate pseudo drone code from product id
const getDroneCode = (id: string, name: string) => {
  const seed = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6) || 'XXXXXX';
  return `${seed.slice(0, 2)}${seed.slice(2, 6)}`;
};

const ProductCard = ({ product, onViewDetail, onInvest }: ProductCardProps) => {
  const hasPromoPrice = product.promo_price !== null && product.promo_price !== undefined;
  const hasPromoDailyIncome = product.promo_daily_income !== null && product.promo_daily_income !== undefined;
  const hasPromoValidity = product.promo_validity !== null && product.promo_validity !== undefined;

  const displayPrice = hasPromoPrice ? product.promo_price! : product.price;
  const displayDailyIncome = hasPromoDailyIncome ? product.promo_daily_income! : product.daily_income;
  const displayValidity = hasPromoValidity ? product.promo_validity! : product.validity;

  // Drone-themed pricing range (visual only)
  const lowRange = Math.floor(displayDailyIncome * 0.95);
  const highRange = Math.ceil(displayDailyIncome * 1.05);
  const droneCode = getDroneCode(product.id, product.name);

  return (
    <Card className="border-border/60 hover:border-primary/40 transition-colors bg-card/80">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Info kiri */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-xs font-semibold text-foreground leading-tight">
                Drone {product.name} <span className="text-muted-foreground font-normal">({droneCode})</span>
              </h3>
              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
                Pro
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-foreground/80">
                RP {lowRange.toLocaleString('id-ID')}~{highRange.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/50 text-foreground/80">
                Melayani hingga {displayValidity}D
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasPromoPrice && (
                <span className="text-[10px] text-muted-foreground line-through">{formatCurrency(product.price)}</span>
              )}
              <span className="text-sm font-bold text-foreground break-all">{formatCurrency(displayPrice)}</span>
            </div>
          </div>

          {/* Image kanan */}
          <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/10 to-accent/10 border border-border/40">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onClick={() => onViewDetail(product)}
            />
          </div>
        </div>

        <div className="flex justify-end mt-2.5">
          <Button
            size="sm"
            className="text-[11px] px-5 h-7 rounded-full font-medium bg-primary/90 hover:bg-primary"
            onClick={() => onInvest(product)}
          >
            Membeli
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
