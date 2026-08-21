const https = require('https');

function lookup(gid) {
  return new Promise((resolve) => {
    https.get(`https://wos-vercel-proxy.vercel.app/api/verify?id=${gid}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch(e) { resolve({ error: d }); }
      });
    });
  });
}

async function test() {
  console.log('Looking up 532577151...');
  console.log(await lookup('532577151'));

  console.log('Looking up 738924588...');
  console.log(await lookup('738924588'));
}

test();
