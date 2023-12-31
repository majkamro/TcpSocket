const tcpSocketModule = require('./tcpSocket');

const tcpSocket = new tcpSocketModule.TcpSocket();
tcpSocket.tcpConnectReader('127.0.0.1', 9090).then((result) => {
    console.log('Connection result:', result);
 })
 .catch((err) => {
    console.error('Error:', err.message);
 });