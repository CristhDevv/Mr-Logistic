const https = require('https');

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: '/v1/projects',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sbp_20e3cdfe486939f472213fbfa783e2f4b9837bda'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Data:', data));
});
req.end();
