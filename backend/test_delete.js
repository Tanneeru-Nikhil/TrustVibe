const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 'dummy', role: 'SYSTEM_ADMIN' }, 'super-secret-key-for-jwt');

fetch('http://localhost:3000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
  .then(res => res.json())
  .then(users => {
    // try to delete the last user (make sure it's not the admin)
    const storeTarget = users.find(u => u.name === 'Best Electronics Store');
    if (!storeTarget) return console.log('No target store found');
    
    console.log('Deleting:', storeTarget.id);
    fetch(`http://localhost:3000/api/admin/users/${storeTarget.id}`, { 
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => res.text())
    .then(d => console.log('DELETE RESULT:', d))
    .catch(console.error);
  });
