const mysql = require('think-model-mysql');

module.exports = {
  handle: mysql,
  database: 'nideshop_jiaoyang',
  prefix: 'nideshop_',
  encoding: 'utf8mb4',
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: ';Classmate1133',
  dateStrings: true
};
