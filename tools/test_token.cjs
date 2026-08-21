const https = require('https');

const token = "eyJhbGciOiJIUzUxMiIsImlhdCI6MTc4NzI5MDc1MCwiZXhwIjoxNzg5ODgyNzUwfQ.eyJkYXRhIjoiOUZXTGEzdHBZRHFDWUczMGFUT2tlc1c4VmRzV3JBRUJEbHFMN28vSk9iUjNCbnBnTGhVM1VwbHo5MzUzUEU2RWM5ZWNIdFM0aEFqM3M0eTBvakdqNzNGYzNHZ29EVklXRjNGd3hWTmlKRmFVMzVMb0EvNEVINmNUODRuaXRTcHovdTRSYTFBbEFlVkwvKzBYa0s0K3BWY1E4dHB2ZzRXYzRmb1dPWFI2RzNySC8xUVpJajExN3JHaTdBUkt4SGdWMFVGTkxjQnk5NUlUUWVwNlBpeDFvQUFXbmNWRTdJbHI2WExESHNBejZjZzA2K1JuKy9xNGQvcVU4ZjFERituUmkwQTUvMGd0eGhFSzdQd2M2OW9BRklhN2hXbDhadVVRT1V4blNWMzB0QW1JdGdUYytXSlMyMzJqYUpWc1dHTjVCZUZsTDNlSGREVWE3Qktpdis0UURxMGpZZlREVEl2a3VrcGQ0cDRoMVJFWEdIU09TWlhSOVNUQlQ3NFF2bkhBQks4T0tjUG9CdVZhT00zci9jdWYwdz09In0.7MRiGr6MUYMTvX84ScoqI7H8o3pV3kx0dgXeZnwxgk7B4XvUTTs4aAA5Ss5Y2JTTArZ40SgozLNR3T5IlZ0HXw";

function testSync(gid) {
  return new Promise((resolve) => {
    https.get(`https://wos-vercel-proxy.vercel.app/api/sync_profile?id=${gid}&cgToken=${encodeURIComponent(token)}`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
  });
}

async function run() {
  console.log('Testing sync for 318843189 with main token...');
  const res1 = await testSync('318843189');
  console.log('318843189 result:', res1);

  console.log('Testing sync for 628432919 with main token...');
  const res2 = await testSync('628432919');
  console.log('628432919 result:', res2);
}

run();
