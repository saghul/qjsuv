// Sample TCP echo server.
//

import { addr, logError } from './utils.js';


async function handleConnection(conn) {
    console.log(`Accepted connection! ${addr(conn.getpeername())} <-> ${addr(conn.getsockname())}`);

    const buf = new ArrayBuffer(4096);
    let nread;
    while (true) {
        nread = await conn.read(buf);
        //console.log(String.fromCharCode.apply(null, new Uint8Array(buf, 0, nread)));
        if (!nread) {
            console.log('connection closed!');
            break;
        }
        await conn.write(buf, 0, nread);
    }
}

(async () => {
    const t = new quv.TCP();

    t.bind({ip: quv.args[2] || '127.0.0.1', port: quv.args[3] || 1234});
    t.listen();

    console.log(`Listening on ${addr(t.getsockname())}`); 

    let conn;
    while (true) {
        conn = await t.accept();
        handleConnection(conn);
        conn = undefined;
    }

})().catch(logError);
