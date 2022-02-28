const core = globalThis.__bootstrap;


export async function connect(transport, host, port, options = {}) {
    const addr = await prepareAddress(transport, host, port);

    switch (transport) {
        case 'tcp': {
            const handle = new core.TCP();
            if (options.bindAddr) {
                handle.bind(options.bindAddr), options.bindFlags;
            }
            await handle.connect(addr);
            return new Connection(handle);
        }
        case 'pipe': {
            const handle = new core.Pipe();
            await handle.connect(addr);
            return new Connection(handle);
        }
        case 'udp': {
            const handle = new core.UDP();
            if (options.bindAddr) {
                handle.bind(options.bindAddr, options.bindFlags);
            }
            await handle.connect(addr);
            return new DatagramEndpoint(handle);
        }
    }
}

export async function listen(transport, host, port, options = {}) {
    const addr = await prepareAddress(transport, host, port);

    switch (transport) {
        case 'tcp': {
            const handle = new core.TCP();
            handle.bind(addr, options.bindFlags);
            handle.listen(options.backlog);
            return new Listener(handle);
        }
        case 'pipe': {
            const handle = new core.Pipe();
            handle.bind(addr);
            handle.listen(options.backlog);
            return new Listener(handle);
        }
        case 'udp': {
            const handle = new core.UDP();
            handle.bind(addr, options.bindFlags);
            return new DatagramEndpoint(handle);
        }
    }
}

async function prepareAddress(transport, host, port) {
    switch (transport) {
        case 'tcp': {
            const opts = {
                socktype: tjs.SOCK_STREAM,
                protocol: tjs.IPPROTO_TCP
            };
            const r = await tjs.getaddrinfo(host ?? '0.0.0.0', port ?? 0, opts);
            return r[0];
        }
        case 'pipe':
            return host;
        case 'udp': {
            const opts = {
                socktype: tjs.SOCK_DGRAM,
                protocol: tjs.IPPROTO_UDP
            };
            const r = await tjs.getaddrinfo(host ?? '0.0.0.0', port ?? 0, opts);
            return r[0];
        }
        default:
            throw new Error('invalid transport');
    }
}

const kHandle = Symbol('kHandle');
const kLocalAddress = Symbol('kLocalAddress');
const kRemoteAddress = Symbol('kRemoteAddress');

class Connection {
    constructor(handle) {
        this[kHandle] = handle;
    }

    read(buf) {
        return this[kHandle].read(buf);
    }

    write(buf) {
        return this[kHandle].write(buf);
    }

    get localAddress() {
        if (!this[kLocalAddress]) {
            this[kLocalAddress] = this[kHandle].getsockname();
        }
        return this[kLocalAddress];
    }

    get remoteAddress() {
        if (!this[kRemoteAddress]) {
            this[kRemoteAddress] = this[kHandle].getpeername();
        }
        return this[kRemoteAddress];
    }

    shutdown() {
        this[kHandle].shutdown();
    }

    close() {
        this[kHandle].close();
    }
}

class Listener {
    constructor(handle) {
        this[kHandle] = handle;
    }

    get localAddress() {
        if (!this[kLocalAddress]) {
            this[kLocalAddress] = this[kHandle].getsockname();
        }
        return this[kLocalAddress];
    }

    async accept() {
        const handle = await this[kHandle].accept();

        if (typeof handle === 'undefined') {
            return;
        }

        return new Connection(handle);
    }

    close() {
        this[kHandle].close();
    }

    // Async iterator.
    //

    [Symbol.asyncIterator]() {
        return this;
    }

    async next() {
        const value = await this.accept();

        return {
            value,
            done: typeof value === 'undefined'
        }
    }
}

class DatagramEndpoint {
    constructor(handle) {
        this[kHandle] = handle;
    }

    recv(buf) {
        return this[kHandle].recv(buf);
    }

    send(buf, taddr) {
        return this[kHandle].send(buf, taddr);
    }

    get localAddress() {
        if (!this[kLocalAddress]) {
            this[kLocalAddress] = this[kHandle].getsockname();
        }
        return this[kLocalAddress];
    }

    get remoteAddress() {
        // Don't cache remote address since the socket might not be connected, ever.
        return this[kHandle].getpeername();
    }

    close() {
        this[kHandle].close();
    }
}
