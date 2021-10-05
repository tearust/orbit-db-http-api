const IpfsApi   = require('ipfs-http-client');
const OrbitDB   = require('orbit-db');
const DBManager = require('../lib/db-manager.js')
const OrbitApi  = require('../lib/orbitdb-api.js')

const Identities = require('orbit-db-identity-provider')
const AccessControllers = require('orbit-db-access-controllers');
const AccessController = require('orbit-db-access-controllers/src/orbitdb-access-controller');

const pMapSeries = require('p-map-series')

class TeaAccessController extends AccessController {

    static get type () { return 'tea' } // Return the type for this controller

    static async create (orbitdb, options={}) {
        const ac = new TeaAccessController(orbitdb, options)
        await ac.load(options.address || options.name || 'default-access-controller')

        // Add write access from options
        if (options.write && !options.address) {
            console.log(55, ac._db.get('write'))
            // await pMapSeries(options.write, async (e) => {
            //     return ac.grant('write', e)
            // })

        }

        return ac
    }
  
    // async canAppend(entry, identityProvider) {
    //   // logic to determine if entry can be added, for example:
    // //   if (entry.payload === "hello world" && entry.identity.id === identity.id && identityProvider.verifyIdentity(entry.identity))
    // //     return true
  
    // //   return false
    //     return true;
    // }
    // async grant (access, identity) {} // Logic for granting access to identity
    async save () {
        console.log(333, this._options.address);
        // return the manifest data
        return {
          address: this._options.address,
        }
    }
    
}
AccessControllers.addAccessController({ AccessController: TeaAccessController })

async function api_factory(ipfs_host, ipfs_port, orbitdb_dir, orbitdb_opts, server_opts) {
    let ipfs
    let orbitdb
    let dbm
    let orbitdb_api

    if (orbitdb_dir) orbitdb_opts = Object.assign({'directory': orbitdb_dir}, orbitdb_opts)
    ipfs        = new IpfsApi({
        host: ipfs_host,
        port: ipfs_port
    });

    const xx = ['SEED', 'ADMIN_LIST'];
    xx.forEach((key)=>{
        console.log(`${key} => ${process.env[key]}`);
    });
    
    const options = {
        identityKeysPath: orbitdb_dir,
        id: process.env.SEED || 'tea'
    };
    options.identityKeysPath += '/'+options.id;
    console.log(1, options);

    orbitdb_opts.identity = await Identities.createIdentity(options);

    orbitdb_opts.AccessControllers = AccessControllers;
    
    console.log('orbitdb_opts =>', orbitdb_opts);

    orbitdb     = await OrbitDB.createInstance(ipfs, orbitdb_opts)
    dbm         = new DBManager(orbitdb)
    await dbm._init();
    orbitdb_api = new OrbitApi(dbm, server_opts)

    return orbitdb_api
}

module.exports = api_factory
