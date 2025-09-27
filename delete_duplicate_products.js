const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function deleteDuplicateProducts() {
  const products = await stripe.products.list({ limit: 100 });
  const seen = new Map();
  for (const product of products.data) {
    if (seen.has(product.name)) {
      await stripe.products.del(product.id);
      console.log(`Produit supprimé: ${product.id} (${product.name})`);
    } else {
      seen.set(product.name, product.id);
    }
  }
}

deleteDuplicateProducts(); 