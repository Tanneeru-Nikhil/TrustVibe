const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'dummy', role: 'NORMAL_USER' }, 'super-secret-key-for-jwt');

fetch('http://localhost:3000/api/stores', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => res.json())
  .then(data => console.log('DATA:', JSON.stringify(data, null, 2)))
  .catch(err => console.log('ERROR:', err.message));
