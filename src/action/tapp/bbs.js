const _ = require('lodash');
const {consts, sha256} = require('../../utils');

const ttl = 1000*60*10;
const GLOBAL_DB = process.env.GLOBAL_BBS_DB || 'test';

const db_map = {};

const F = {
  async getDB(dbm, dbname, tapp_id){
    if(!dbname){
      throw 'dbname is required.';
    }
    if(!tapp_id){
      throw 'tapp id is required.';
    }

    const key = 'tapp.bbs.'+dbname;
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
  doc_id(params){
    const {sender, content, utc} = params;
    if(!sender){
      throw 'Invalid sender => '+sender;
    }
    if(!utc){
      throw 'Invalid UTC time => '+utc;
    }
    if(!content){
      throw 'Invalid content => '+content;
    }

    const key = sender+'_'+content+'_'+utc.toString();

    return sha256(key);
  },
  async add_message(params, dbm, h){
    const {sender, utc, utc_expired, content, dbname, tapp_id} = params;
    const db = await F.getDB(dbm, dbname, tapp_id);

    if(utc_expired && utc_expired < utc){
      throw 'Invalid UTC expired => Expired must bigger than UTC';
    }

    const tid = _.toNumber(tapp_id);
    const doc_id = F.doc_id(params);
    const doc = {
      _id: doc_id,
      sender,
      content,
      utc,
      utc_expired: utc_expired || 0,
      tapp_id: tid,
    };

    await db.put(doc);
    return doc_id;
  },
  async get_message(params, dbm, h){
    const {sender, tapp_id, dbname, utc} = params;

    if(!utc){
      throw 'Invalid UTC time => '+utc;
    }

    const db = await F.getDB(dbm, dbname, tapp_id);

    let tid = _.toNumber(tapp_id);
    const all = await db.query((doc)=>{
      if(doc.utc_expired && utc > doc.utc_expired){
        return false;
      }
      if(sender && sender !== doc.sender){
        return false;
      }

      if(dbname === GLOBAL_DB) return true;
      if(doc.tapp_id !== tid) return false;
      
      return true;
    });

    return _.reverse(_.sortBy(all, 'utc'));
  },
  async delete_message(params, dbm, h){
    const {msg_id, tapp_id, dbname} = params;
    if(!msg_id){
      throw 'Invalid Msg id => '+msg_id;
    }

    const db = await F.getDB(dbm, dbname, tapp_id);
    const rs = await db.del(msg_id);
    return rs;
  },
  async extend_message(params, dbm, h){
    const {msg_id, tapp_id, dbname, utc_expired} = params;
    if(!msg_id){
      throw 'Invalid Msg id => '+msg_id;
    }
    if(!utc_expired){
      throw 'Invalid UTC Expired => '+utc_expired;
    }

    const db = await F.getDB(dbm, dbname, tapp_id);
    const [doc] = await db.get(msg_id);

    if(!doc){
      throw 'Not found doc for msg id => '+msg_id;
    }

    if(!doc.utc_expired){
      throw 'No UTC Expired for msg id => '+msg_id;
    }

    doc.utc_expired = _.toNumber(utc_expired)+_.toNumber(doc.utc_expired);


    await db.put(doc);
    return doc._id;
  }

};



module.exports = F;