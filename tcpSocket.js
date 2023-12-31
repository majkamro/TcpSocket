const net = require('net');

const SUCCESS_RETURN = 0;
const PortType = 0;
const ERR_RDATA_LEN = 2007;
const ERR_NOTAG_RETURN = 2002;
const ERR_SCMND_FAIL = 2009;

class TcpSocket {
    constructor() {
        this.sock = new net.Socket();
    }

    connect(host, port) {
        this.sock.connect(port, host);
    }

    tcpSend(send_buf, len) {
        if (!this.sock.destroyed) {
            try {
                this.sock.write(send_buf.slice(0, len));
                return len;
            } catch (ex) {
                console.error(ex.message);
                return 0;
            }
        }

        return 1;
    }

    tcpConnectReader(ip, port) {
        return new Promise((resolve, reject) => {
            const remoteEP = new net.Socket();
            remoteEP.setTimeout(1000);

            remoteEP.connect(port, ip, () => {
            if (remoteEP.remoteAddress) {
                remoteEP.end();
                resolve(SUCCESS_RETURN);
            } else {
                reject(new Error('Connection failed'));
            }
            });

            remoteEP.on('error', (err) => {
            reject(err);
            });
        });
    }

    tcpCloseConnect() {
        if (sock) {
            sock.destroy();
        }

        return SUCCESS_RETURN;
    }

    async epcMultiTagIdentify(readerAddr, tag_buf, tag_cnt, tag_flag) {
        return new Promise(async (resolve, reject) => {
            try {
                let getCount = 0;
                let array = [10, 0, 2, 128, 0];
                array[1] = readerAddr;
                let send_buf = array;
                let rcv_buf = Buffer.alloc(128);
                let len = rcv_buf.length;
                let num = await sendAndRcv(send_buf, 5, len, rcv_buf);
                if (num == SUCCESS_RETURN) {
                    if (rcv_buf[3] == 0) {
                        tag_cnt = rcv_buf[1];
                    } else {
                        tag_cnt = rcv_buf[2];
                    }

                    tag_flag = rcv_buf[0];
                    if (tag_cnt > 0) {
                        await getTagData(255, tag_buf, tag_cnt, getCount);
                    }
                }

                resolve(num);
            } catch (error) {
                reject(error);
            }
        });
    }

    async sendAndRcv(send_buf, intSize, len, rcv_buf) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = Buffer.alloc(3);
                let b = 0;
                for (let i = 0; i < intSize - 1; i++) {
                    b += send_buf[i];
                }

                b = (byte)(~b + 1);
                send_buf[intSize - 1] = b;
                if (PortType == 0) {
                    resolve(ERR_NOTAG_RETURN);
                } else {
                    let sentBytes = await tcpSend(send_buf, intSize);
                    if (sentBytes != intSize) {
                        resolve(ERR_SCMND_FAIL);
                        return;
                    }

                    let receivedBytes = await tcpReceive(data, 3);
                    if (receivedBytes == 3) {
                        if (data[0] != 11) {
                            resolve(ERR_RDATA_LEN);
                            return;
                        }

                        len = data[2];
                        receivedBytes = await tcpReceive(rcv_buf, len);
                        if (receivedBytes != len) {
                            resolve(ERR_RDATA_LEN);
                            return;
                        }

                        resolve(SUCCESS_RETURN);
                        return;
                    }

                    resolve(ERR_NOTAG_RETURN);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    async getTagData(ReaderAddr, tag_data, tag_cnt, getCount) {
        let num = 0;
        let num2 = 0;
        let array = [10, 0, 3, 65, 16, 163];
        array[1] = ReaderAddr;
        let send_buf = Buffer.from(array);
        let rcv_buf = Buffer.alloc(2048);

        while (num < tag_cnt) {
            num2++;
            let { returnCode, receivedLength } = await sendAndRcv(send_buf, rcv_buf);
            if (returnCode === 0 && rcv_buf[0] === 0) {
            try {
                getCount.value = rcv_buf[1];
                if (getCount.value <= 0) {
                break;
                }

                let num4 = (receivedLength - 3) / getCount.value;
                for (let i = 0; i < getCount.value; i++) {
                for (let j = 0; j < num4; j++) {
                    tag_data[num][j] = rcv_buf[i * num4 + j + 2];
                }

                num++;
                }

                continue;
            } catch {
                num = 0;
            }

            break;
            }

            if (returnCode === 1) {
            break;
            }
        }

        getCount.value = num;
        return returnCode;
    }

    async tcpSend(send_buf, len) {
        if (!this.sock.destroyed) {
            try {
                this.sock.write(send_buf.slice(0, len));
                return len;
            } catch (ex) {
                console.error(ex.message);
                return 0;
            }
        }

        return 1;
    }

    async tcpReceive(rcv_buf, len) {
        if (!this.sock.destroyed) {
            try {
                this.sock.on('data', (data) => {
                    data.copy(rcv_buf, 0, 0, len);
                });
            } catch (ex) {
                console.error(ex.message);
                return 1;
            }
        }

        return 1;
    }
}

module.exports = { TcpSocket };