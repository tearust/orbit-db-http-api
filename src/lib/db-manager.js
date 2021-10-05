const _ = require('lodash');

class DBManager {
    constructor(orbitdb){
        this.orbitdb = orbitdb;

        let _dbs = {};

        let find_db = (dbn)  => {
            let result
            if (dbn in _dbs) return _dbs[dbn]
            for (let db of Object.values(_dbs)) {
                if (dbn == db.id) {
                    result = db
                    break
                } else if (dbn == [db.address.root, db.address.path].join('/')) {
                    result = db
                    break
                }
            };
            if (result) return result
        };

        this.get = async (dbn, params) => {
            let db = find_db(dbn);
            if (db) {
                return db;
            } else {
                params = _.merge({
                    create: false,
                }, params);
                console.log(`Opening db ${dbn}`, params);
                db = await orbitdb.open(dbn, params);
                await db.load();
                console.log(`Loaded db ${db.dbname}`);
                _dbs[db.dbname] = db;
                return db;
            }
        };

        this.db_list_remove = async (dbn) => {
            let db = find_db(dbn)
            if (db) {
                await db.close()
                delete _dbs[db.dbname];
                console.log(`Unloaded db ${db.dbname}`);
            }
        }

        this.db_list = () => {
            let db_info_list = {};
            for (let dbn in _dbs) {
                if (_dbs.hasOwnProperty(dbn)) {
                    db_info_list[dbn] = this.db_info(dbn);
                }
            }
            return JSON.stringify(db_info_list);
        };

        let _db_write = (db) => {
            return (
                db.access.write ||
                (typeof db.access.get == 'function' && db.access.get('write')) ||
                db.access._options.write ||
                'unavaliable'
            );
        }

        this.db_write = (dbn) => {
            let db = find_db(dbn);
            if (!db) return {};
            return _db_write(db);
        }

        this.db_info = async (dbn) => {
            let db = find_db(dbn);
            if (!db) return {};
            let __db_write = _db_write(db)
            __db_write = Array.from(__db_write);
            return {
                address: db.address,
                dbname: db.dbname,
                id: db.id,
                options: {
                    create: db.options.create,
                    indexBy: db.options.indexBy,
                    localOnly: db.options.localOnly,
                    maxHistory: db.options.maxHistory,
                    overwrite: db.options.overwrite,
                    path: db.options.path,
                    replicate: db.options.replicate,
                },
                canAppend: __db_write.includes(orbitdb.identity.id),
                write: __db_write,
                type: db.type,
                uid: db.uid,
                indexLength: db.index ? (db.index.length || Object.keys(db.index).length) : -1,
                accessControlerType: db.access.type || 'custom',
                capabilities: Object.keys(                                         //TODO: cleanup this mess once tc39 object.fromEntries aproved
                    Object.assign ({}, ...                                         // https://tc39.github.io/proposal-object-from-entries
                        Object.entries({
                            add: typeof db.add == 'function',
                            get: typeof db.get == 'function',
                            inc: typeof db.inc == 'function',
                            iterator: typeof db.iterator == 'function',
                            put: typeof db.put == 'function',
                            query: typeof db.query == 'function',
                            remove: typeof (db.del || db.remove) == 'function',
                            value: typeof db.value == 'function'
                        }).filter(([k,v]) => v).map(([k,v]) => ({[k]:v}))
                    )
                )
            };
        };

        this.identity = () => {
            return orbitdb.identity;
        };
    }

    async _init(){
        // init keyvalue store
        const key_value_name = 'key_value_store';
        // await this.get(key_value_name, {
        //     create: true,
        //     type: 'keyvalue'
        // });

        const db_address = await this.orbitdb.determineAddress(key_value_name, 'keyvalue', {
            accessController: {
                type: 'tea',
                address: 'tearust5',
                // write: [],
            },
            meta: {
                v: 1
            }
        });
        const db = await this.get(db_address);
        
        const me_id = this.orbitdb.identity.id;
        await db.access.grant('write', me_id);
        
        let list = process.env.ADMIN_LIST;
        if(list){
            list = list.split(',');
            for(let i=0, len=list.length; i<len; i++){
                const uid = list[i];
                let aa = await db.access.grant('write', uid);
                if(aa !== false){
                    console.log('add write access success => '+uid);
                }
            }
        }
    
        
        const x = await this.db_info(db_address);
        console.log(1, x);


        console.log('dbm init success');
    }


    async info(dbn){
        try{

            await this.get(dbn, {});
        }catch(e){
            console.error(e);
        }
        

        return await this.db_info(dbn);
    }
}

module.exports = DBManager;
