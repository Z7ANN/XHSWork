const bcrypt = require('bcrypt')

const password = process.argv[2]
if (!password) {
  console.log('用法: node utils/hashPassword.js <密码>')
  process.exit(1)
}

bcrypt.hash(password, 10).then(hash => console.log(hash))
