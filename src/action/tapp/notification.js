const _ = require('lodash');
const {consts, sha256} = require('../../utils');


// cache
let _sj = null;
const ScheculeJob = class {
  constructor(){
    this.last_job = 0;
  }

  canJob(){
    const now = Date.now();

    const job_ttl = 1000*60*1;  //20 min
    if(now-job_ttl > this.last_job){
      this.last_job = now;
      return true;
    }

    return false;
  }

  async startJobForExpiredMessage(utc, dbm){
    if(!this.canJob()){
      return;
    }

    const db = await F.getDB(dbm);
    const delete_list = await db.query((doc)=>{
      if(!doc.utc_expired) return true;
      if(doc.utc_expired && utc > doc.utc_expired){
        return true;
      }
      
      return false;
    });
    console.log(`delete expired message job => `, delete_list.length);
    await Promise.all(_.map(delete_list, async (item)=>{
      await db.del(item._id);
    }));
    console.log(`job success at ${new Date()}`);
  }
};
ScheculeJob.get = ()=>{
  if(_sj) return _sj;

  _sj = new ScheculeJob();
  return _sj;
};

const startScheduleJobLoop = (utc, dbm)=>{
  const sj = ScheculeJob.get();
  sj.startJobForExpiredMessage(utc, dbm);
};

let _db = null;
const F = {
  async getDB(dbm){
    if(_db) return _db;

    const key = 'tapp.notification';
    const item = {
      name: key,
      type: 'docstore'
    };

    const db = await dbm.initForEachDB(item, {});

    // TODO, access control
    await db.access.grant('write', '*');
    
    _db = db;
    return db;
  },
  doc_id(params){
    const {sender, to, content, utc} = params;
    if(!sender){
      throw 'Invalid sender account';
    }
    if(!to){
      throw 'Invalid to account';
    }
    if(!utc){
      throw 'Invalid UTC time => '+utc;
    }
    if(!content){
      throw 'Invalid content => '+content;
    }

    const key = sender+'_'+to+'_'+content+'_'+utc.toString();

    return sha256(key);
  },
  async private_message(params, dbm, h){
    const {sender, to, utc, utc_expired, content, tapp_id,} = params;
    const db = await F.getDB(dbm);

    if(utc_expired && utc_expired < utc){
      throw 'Invalid UTC expired => Expired must bigger than UTC';
    }

    const tid = _.toNumber(tapp_id);
    const doc_id = F.doc_id(params);

    const from_tapp_id = params.from_tapp_id || '';
    const from_tapp_url = params.from_tapp_url || '';
    const doc = {
      _id: doc_id,
      sender,
      to,
      content,
      from_tapp_id,
      from_tapp_url,
      utc,
      utc_expired: utc_expired || 0,
      tapp_id: tid,
    };

    await db.put(doc);
    return doc_id;
  },

  async get_message_list(params, dbm, h){
    const {sender, to, utc} = params;

    if(!sender && !to){
      throw "Need at least sender or to account.";
    }

    if(!utc){
      throw 'Invalid UTC time => '+utc;
    }

    const db = await F.getDB(dbm);

    const all = await db.query((doc)=>{
      if(doc.utc_expired && utc > doc.utc_expired){
        return false;
      }
      if(sender && sender !== doc.sender){
        return false;
      }
      if(to && to !== doc.to){
        return false;
      }
      
      return true;
    });

    _.delay(()=>{
      startScheduleJobLoop(utc, dbm);
    }, 2000);

    return _.reverse(_.sortBy(all, 'utc'));
  },
  // async delete_message(params, dbm, h){
  //   const {msg_id, tapp_id, dbname} = params;
  //   if(!msg_id){
  //     throw 'Invalid Msg id => '+msg_id;
  //   }

  //   const db = await F.getDB(dbm, dbname, tapp_id);
  //   const rs = await db.del(msg_id);
  //   return rs;
  // },
  // async extend_message(params, dbm, h){
  //   const {msg_id, tapp_id, dbname, utc_expired} = params;
  //   if(!msg_id){
  //     throw 'Invalid Msg id => '+msg_id;
  //   }
  //   if(!utc_expired){
  //     throw 'Invalid UTC Expired => '+utc_expired;
  //   }

  //   const db = await F.getDB(dbm, dbname, tapp_id);
  //   const [doc] = await db.get(msg_id);

  //   if(!doc){
  //     throw 'Not found doc for msg id => '+msg_id;
  //   }

  //   if(!doc.utc_expired){
  //     throw 'No UTC Expired for msg id => '+msg_id;
  //   }

  //   doc.utc_expired = _.toNumber(utc_expired)+_.toNumber(doc.utc_expired);


  //   await db.put(doc);
  //   return doc._id;
  // }

};



module.exports = F;