const _ = require('lodash');
const {sha256, uuid} = require('../../utils');


const db_map = {};

const F = {
  async getDB(dbm, tapp_id){
    const dbname = 'entity.'+tapp_id;

    const key = 'tapp.'+dbname;
    const item = {
      name: key,
      type: 'docstore'
    };
    if(db_map[key]){
      return db_map[key];
    }
    const db = await dbm.initForEachDB(item, {});

    db_map[key] = db;
    await db.access.grant('write', '*');
    return db;
  },
  new_doc_id(){
    // const {block, body_str} = params;
    

    // const key = body_str+'__'+block.toString();

    // return sha256(key);
    return uuid();
  },
  validate_param(params){
    const {tapp_id, body_str, block} = params;
    if(!tapp_id){
      throw 'tapp_id is required.';
    }

    return true;
  },
  async insert(params, dhm, h){
    F.validate_param(params);
    const {tapp_id, body_str, block} = params;
    const db = await F.getDB(dhm, tapp_id);
    const doc_id = F.new_doc_id();

    const doc = {
      _id: doc_id,
      body_str: body_str || '',
      block: block || 0,
    }
    await db.put(doc);
    return doc_id;
  },
  async read(params, dbm, h){
    F.validate_param(params);
    const {tapp_id, id_list} = params;
    if(!_.isArray(id_list)){
      throw 'id_list must be array.';
    }

    const db = await F.getDB(dbm, tapp_id);

    const all = await db.query((doc)=>{
      return _.includes(id_list, doc._id);
    });

    return all;
  },
  async delete(params, dbm, h){
    F.validate_param(params);
    const {tapp_id, id_list} = params;
    if(!_.isArray(id_list)){
      throw 'id_list must be array.';
    }
    const db = await F.getDB(dbm, tapp_id);

    return await Promise.all(_.map(id_list, async (id)=>{
      return await db.del(id);
    }));
  },
  async update(params, dbm, h){
    // TODO
  }
  

};



module.exports = F;