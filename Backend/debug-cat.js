import http from 'http';

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const postData =
    `--${boundary}\r
Content-Disposition: form-data; name="name"\r
\r
TestDebugCat\r
--${boundary}\r
Content-Disposition: form-data; name="slug"\r
\r
test-debug-cat\r
--${boundary}--\r
`;

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/categories',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
