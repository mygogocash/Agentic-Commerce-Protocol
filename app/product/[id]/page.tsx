import { Metadata } from 'next';

// Firestore REST API Configuration
const FIRESTORE_PROJECT_ID = 'gogocash-acp';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

interface ProductData {
    product_id: string;
    product_name: string;
    product_price: number;
    currency: string;
    image_url: string;
    product_url: string;
    rating: number;
    reviews_count: number;
    cashback_rate: number;
    estimated_cashback: number;
}

async function getProduct(id: string): Promise<ProductData | null> {
    try {
        const response = await fetch(`${FIRESTORE_BASE_URL}/products/${id}`, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });
        
        if (!response.ok) return null;
        
        const doc = await response.json();
        const fields = doc.fields;
        
        const price = Number(fields.price?.integerValue || fields.price?.doubleValue || 0);
        
        return {
            product_id: id,
            product_name: fields.title?.stringValue || 'Unknown Product',
            product_price: price,
            currency: fields.currency?.stringValue || 'THB',
            image_url: fields.image_url?.stringValue || '',
            product_url: fields.product_url?.stringValue || '',
            rating: Number(fields.rating?.doubleValue || fields.rating?.integerValue || 4.0),
            reviews_count: Number(fields.sold?.integerValue || 0),
            cashback_rate: 0.05,
            estimated_cashback: Math.round(price * 0.05 * 100) / 100
        };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    
    return {
        title: product ? `${product.product_name} - GoGoCash` : 'Product Not Found',
        description: product ? `฿${product.product_price} - Earn ฿${product.estimated_cashback} cashback!` : 'Product not found',
        openGraph: {
            title: product?.product_name || 'Product',
            description: product ? `฿${product.product_price} with 5% cashback` : '',
            images: product?.image_url ? [product.image_url] : [],
        }
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);
    
    if (!product) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h1 style={styles.errorTitle}>❌ Product Not Found</h1>
                    <p style={styles.errorText}>Sorry, we couldn't find this product.</p>
                    <a href="https://shopee.co.th" style={styles.button}>
                        Browse Shopee
                    </a>
                </div>
            </div>
        );
    }
    
    const affiliateLink = `https://gogocash-acp.web.app/api/redirect?url=${encodeURIComponent(product.product_url)}`;
    
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* GoGoCash Header */}
                <div style={styles.header}>
                    <span style={styles.logo}>💰 GoGoCash</span>
                    <span style={styles.cashbackBadge}>5% Cashback</span>
                </div>
                
                {/* Product Image */}
                <div style={styles.imageContainer}>
                    <img 
                        src={product.image_url} 
                        alt={product.product_name}
                        style={styles.productImage}
                    />
                </div>
                
                {/* Product Details */}
                <div style={styles.details}>
                    <h1 style={styles.productName}>{product.product_name}</h1>
                    
                    {/* Rating */}
                    <div style={styles.ratingContainer}>
                        <span style={styles.stars}>{'⭐'.repeat(Math.round(product.rating))}</span>
                        <span style={styles.ratingText}>{product.rating.toFixed(1)} ({product.reviews_count} sold)</span>
                    </div>
                    
                    {/* Price */}
                    <div style={styles.priceContainer}>
                        <span style={styles.price}>฿{product.product_price.toLocaleString()}</span>
                        <span style={styles.currency}>{product.currency}</span>
                    </div>
                    
                    {/* Cashback Info */}
                    <div style={styles.cashbackContainer}>
                        <div style={styles.cashbackBox}>
                            <span style={styles.cashbackLabel}>💵 You'll earn</span>
                            <span style={styles.cashbackAmount}>฿{product.estimated_cashback.toLocaleString()}</span>
                            <span style={styles.cashbackNote}>cashback with GoGoCash!</span>
                        </div>
                    </div>
                    
                    {/* Buy Button */}
                    <a href={affiliateLink} style={styles.buyButton}>
                        🛒 Buy Now & Earn Cashback
                    </a>
                    
                    {/* Powered by */}
                    <p style={styles.poweredBy}>
                        Powered by <strong>GoGoCash</strong> - Shop & Earn Cashback
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '420px',
        width: '100%',
        overflow: 'hidden',
    },
    header: {
        background: 'linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        color: '#fff',
        fontSize: '20px',
        fontWeight: 'bold',
    },
    cashbackBadge: {
        background: '#fff',
        color: '#FF6B35',
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    imageContainer: {
        width: '100%',
        height: '300px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
    },
    productImage: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
    },
    details: {
        padding: '24px',
    },
    productName: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1a1a2e',
        lineHeight: '1.4',
        marginBottom: '12px',
    },
    ratingContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
    },
    stars: {
        fontSize: '16px',
    },
    ratingText: {
        color: '#666',
        fontSize: '14px',
    },
    priceContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        marginBottom: '20px',
    },
    price: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    currency: {
        color: '#999',
        fontSize: '16px',
    },
    cashbackContainer: {
        marginBottom: '24px',
    },
    cashbackBox: {
        background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
        borderRadius: '16px',
        padding: '16px',
        textAlign: 'center' as const,
        color: '#fff',
    },
    cashbackLabel: {
        display: 'block',
        fontSize: '14px',
        marginBottom: '4px',
    },
    cashbackAmount: {
        display: 'block',
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '4px',
    },
    cashbackNote: {
        display: 'block',
        fontSize: '12px',
        opacity: 0.9,
    },
    buyButton: {
        display: 'block',
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(90deg, #FF6B35 0%, #F7931E 100%)',
        color: '#fff',
        textAlign: 'center' as const,
        textDecoration: 'none',
        borderRadius: '12px',
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        boxSizing: 'border-box' as const,
    },
    poweredBy: {
        textAlign: 'center' as const,
        color: '#999',
        fontSize: '12px',
        margin: 0,
    },
    errorTitle: {
        fontSize: '24px',
        color: '#e74c3c',
        textAlign: 'center' as const,
        marginBottom: '12px',
    },
    errorText: {
        color: '#666',
        textAlign: 'center' as const,
        marginBottom: '24px',
    },
    button: {
        display: 'inline-block',
        padding: '12px 24px',
        background: '#667eea',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
    },
};
