const whois = require('whois');

async function testWhois() {
  try {
    console.log('🔍 Testing WHOIS lookup for anutechpvtltd.co.in...');
    
    const whoisData = await new Promise((resolve, reject) => {
      whois.lookup('anutechpvtltd.co.in', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log('✅ WHOIS data received:');
    console.log(whoisData);

    // Extract nameservers from raw WHOIS text
    let nameservers = [];

    // Multiple regex patterns to catch different WHOIS formats
    const nsPatterns = [
      /name\s*server[s]?[:\s]+([^\n\r]+)/gi,
      /nameserver[s]?[:\s]+([^\n\r]+)/gi,
      /nserver[s]?[:\s]+([^\n\r]+)/gi,
      /dns[:\s]+([^\n\r]+)/gi,
    ];

    for (const pattern of nsPatterns) {
      let match;
      while ((match = pattern.exec(whoisData)) !== null) {
        const nsLine = match[1] || match[0];
        if (nsLine) {
          const nsList = nsLine
            .split(/[,\s]+/)
            .map((ns) => ns.trim())
            .filter((ns) => ns.length > 0 && ns.includes("."));
          nameservers = [...nameservers, ...nsList];
        }
      }
    }

    // Also try to find nameservers by looking for common patterns
    const lines = whoisData.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      if (
        trimmedLine.includes('name server') ||
        trimmedLine.includes('nameserver') ||
        trimmedLine.includes('nserver') ||
        trimmedLine.includes('dns')
      ) {
        console.log('Found nameserver line:', line);
        const parts = line.split(/[:,\s]+/);
        for (const part of parts) {
          const trimmed = part.trim();
          if (
            trimmed.includes('.') &&
            !trimmed.includes(' ') &&
            /^[a-zA-Z0-9.-]+$/.test(trimmed) &&
            trimmed.length > 3
          ) {
            nameservers.push(trimmed);
          }
        }
      }
    }

    // Clean up nameservers
    nameservers = [...new Set(nameservers)]
      .map((ns) => ns.toLowerCase().trim())
      .filter((ns) => {
        return (
          ns.length > 0 &&
          ns.includes(".") &&
          !ns.includes(" ") &&
          /^[a-zA-Z0-9.-]+$/.test(ns) &&
          !ns.includes('name') &&
          !ns.includes('server') &&
          !ns.includes('dns')
        );
      });

    console.log('\n📋 Final nameservers:');
    console.log(nameservers);

  } catch (error) {
    console.error('❌ WHOIS Error:', error.message);
  }
}

testWhois();
