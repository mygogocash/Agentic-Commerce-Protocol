import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

const INPUT_FILE = path.join(process.cwd(), 'data-feed', 'shopee_datafeed.csv');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'ACP', 'data', 'shopee-subset.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface ShopeeRow {
    itemid: string;
    title: string;
    price: string; // sale_price or price column
    sale_price: string;
    image_link: string;
    product_link: string;
    product_short_link: string;
    stock: string;
    item_sold: string;
    item_rating: string;
    shop_name: string;
}

const processFeed = async () => {
    console.log('Starting Shopee Feed Processing...');
    const products: any[] = [];
    const limit = 5000; // Keep top 5000 items
    let processed = 0;

    const parser = fs
        .createReadStream(INPUT_FILE)
        .pipe(parse({
            columns: true,
            skip_empty_lines: true,
            relax_quotes: true,
            relax_column_count: true
        }));

    for await (const row of parser) {
        processed++;
        if (processed % 10000 === 0) {
            process.stdout.write(`\rProcessed ${processed} rows... Found ${products.length} candidates.`);
        }

        // 1. Basic Filter
        const stock = parseInt(row.stock || '0', 10);
        if (stock <= 0) continue;

        // 2. Data Cleaning
        const price = parseFloat(row.sale_price || row.price || '0');
        if (price <= 0) continue;

        // Approx conversion
        const price_usd = Number((price / 34).toFixed(2));

        const rating = parseFloat(row.item_rating || '0');
        if (rating < 4.0) continue; // High quality only

        const sold = parseInt(row.item_sold || '0', 10);
        
        // 3. Map to our Domain Model
        // Needed: product_id, product_name, product_price, image_url, affiliate_link...
        const product = {
            product_id: `shp_${row.itemid}`,
            product_name: row.title,
            product_price: price,
            product_price_usd: price_usd,
            currency: 'THB', // Feed seems to be TH based on links
            merchant_name: 'Shopee',
            merchant_logo: 'https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899',
            image_url: row.image_link || row.image_link_1 || '',
            product_url: row.product_link,
            rating: rating,
            reviews_count: sold, // Using sold count as proxy for popularity/reviews
            cashback_rate: 0.05, // Flat 5% for now
            estimated_cashback: Number((price * 0.05).toFixed(2)),
            affiliate_link: row.product_short_link || row.product_link, // Need to wrap later or use direct if it's already an affiliate link? 
                                                // The CSV has 'product_short link' (space?) let's filter keys.
            in_stock: true,
            _sold: sold // For sorting
        };

        // Fix keys from CSV sometimes having weird names
        if (!product.affiliate_link) {
             // Try finding link
             product.affiliate_link = row['product_short link'] || row['product_link'] || '';
        }

        // 4. Selection Strategy: Reservoir Sampling or Just sort later?
        // Since we want "Top" items, we should collect more then sort.
        // But memory might be an issue if we keep ALL.
        // Let's keep items with > 10 sold initially.
        if (sold > 10) {
            products.push(product);
        }
    }

    console.log(`\n\nTotal candidates: ${products.length}`);

    // 5. Sort by Sold Count Descending
    products.sort((a, b) => b._sold - a._sold);

    // 6. Slice Top N
    const finalSet = products.slice(0, limit).map(({ _sold, ...p }) => p);

    console.log(`Writing top ${finalSet.length} products to ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalSet, null, 2));
    console.log('Done.');
};

processFeed().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
