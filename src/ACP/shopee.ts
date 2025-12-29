import { firestoreService } from './services/firestore';

export interface Product {
  product_id: string;
  product_name: string;
  product_price: number;
  product_price_usd?: number;
  currency: string;
  merchant_name: string;
  merchant_logo: string;
  image_url: string;
  product_url: string;
  rating: number;
  reviews_count: number;
  cashback_rate: number;
  estimated_cashback: number;
  affiliate_link: string;
  in_stock: boolean;
}

export const shopeeService = {
  search: async (query: string): Promise<Product[]> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawProducts = await firestoreService.products.search(query);
        
        return rawProducts.map((p: any) => ({
            product_id: p.itemid || p.id,
            product_name: p.title || p.product_name,
            product_price: Number(p.price || 0),
            currency: "THB",
            merchant_name: "Shopee", 
            merchant_logo: "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
            image_url: p.image_url || "",
            product_url: p.product_url || "",
            rating: Number(p.rating || 0),
            reviews_count: Number(p.sold || 0),
            cashback_rate: 0.05, 
            estimated_cashback: Number((p.price || 0) * 0.05),
            affiliate_link: p.product_url || "",
            in_stock: true
        }));

    } catch (error) {
        console.error("Firestore Search Failed:", error);
        return [];
    }
  }
};

