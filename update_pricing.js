const fs = require('fs');

// Read the current file
const content = fs.readFileSync('lib/resellerclub.ts', 'utf8');

// Replace the pricing logic in the production section
const updatedContent = content.replace(
  /\/\/ Get pricing from the response or use fallback pricing\n\s+let price = parseFloat\(domainData\.price\) \|\| 0;\n\s+let currency = domainData\.currency \|\| "USD";\n\n\s+\/\/ If no price is provided by the API, use fallback pricing based on TLD\n\s+if \(price === 0 && isAvailable\) \{[\s\S]*?\n\s+\}/,
  `// Initialize pricing variables
            let price = 0;
            let currency = "INR";
            let pricingSource = "unavailable";

            // Only fetch pricing for available domains
            if (isAvailable) {
              const tld = domain.split(".").pop()?.toLowerCase();
              
              try {
                // Try to get live reseller pricing first
                const livePricing = await this.getResellerPricingForTLD(tld || "");
                if (livePricing) {
                  price = livePricing.price;
                  currency = livePricing.currency;
                  pricingSource = "live";
                  console.log(
                    \`💰 [PRODUCTION] Using live reseller pricing for \${domain}: ₹\${price} \${currency}\`
                  );
                } else {
                  throw new Error("No live pricing available");
                }
              } catch (error) {
                // Fall back to hardcoded pricing
                const fallbackPrices: {
                  [key: string]: { price: number; currency: string };
                } = {
                  com: { price: 999, currency: "INR" },
                  net: { price: 1199, currency: "INR" },
                  org: { price: 1099, currency: "INR" },
                  info: { price: 1299, currency: "INR" },
                  biz: { price: 1399, currency: "INR" },
                  co: { price: 1499, currency: "INR" },
                  in: { price: 699, currency: "INR" },
                  "co.in": { price: 799, currency: "INR" },
                  shop: { price: 1599, currency: "INR" },
                  store: { price: 1599, currency: "INR" },
                  online: { price: 1999, currency: "INR" },
                  site: { price: 1399, currency: "INR" },
                  website: { price: 1799, currency: "INR" },
                  app: { price: 2399, currency: "INR" },
                  dev: { price: 1599, currency: "INR" },
                  io: { price: 3199, currency: "INR" },
                  ai: { price: 3999, currency: "INR" },
                  tech: { price: 1999, currency: "INR" },
                  digital: { price: 1599, currency: "INR" },
                  cloud: { price: 1999, currency: "INR" },
                  host: { price: 1599, currency: "INR" },
                  space: { price: 1399, currency: "INR" },
                };

                const fallback = fallbackPrices[tld || ""] || {
                  price: 999,
                  currency: "INR",
                };
                price = fallback.price;
                currency = fallback.currency;
                pricingSource = "fallback";

                console.log(
                  \`💰 [PRODUCTION] Using fallback pricing for \${domain}: ₹\${price} \${currency} (live pricing failed)\`
                );
              }
            } else {
              console.log(
                \`🚫 [PRODUCTION] Domain \${domain} is not available, skipping pricing check\`
              );
            }`
);

// Also update the results.push section to include pricingSource
const finalContent = updatedContent.replace(
  /results\.push\(\{\s+domainName: domain,\s+available: isAvailable,\s+price: price,\s+currency: currency,\s+registrationPeriod: 1, \/\/ Default to 1 year\s+\}\);/,
  `results.push({
              domainName: domain,
              available: isAvailable,
              price: price,
              currency: currency,
              registrationPeriod: 1, // Default to 1 year
              pricingSource: pricingSource, // Add pricing source info
            });`
);

// Write the updated content
fs.writeFileSync('lib/resellerclub.ts', finalContent);

console.log('✅ Updated pricing logic in ResellerClub API');
