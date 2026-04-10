export async function searchProductByBarcode(barcode: string): Promise<string | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    
    if (data.status === 1 && data.product) {
      const name = data.product.product_name || data.product.product_name_it || data.product.generic_name;
      const brand = data.product.brands ? data.product.brands.split(',')[0] : '';
      return brand ? `${brand} ${name}` : name;
    }
    return null;
  } catch (error) {
    console.error("Error fetching from OpenFoodFacts:", error);
    throw error;
  }
}
