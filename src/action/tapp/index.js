const _ = require('lodash');
const {consts} = require('../../utils');
const bbs = require('./bbs');
const notification = require('./notification');

const db_name = consts.KEY.tapp_views;
const ttl = 1000*60*10;

const F = {
  recoredKey(dbm, tapp_id){
    const {id} = dbm.identity();
    return `${tapp_id}_${id}`;
  },
  async put_view(params, dbm, h){
    const {tapp_id, count, block, time} = params;
    if(!tapp_id || !_.isNumber(count)){
      throw 'Invalid params for put_view action';
    }

    const db = await dbm.get(db_name);
    const key = F.recoredKey(dbm, tapp_id);
    const hash = await db.put(key, {
      count,
      block,
      time
    });

    return hash;
  },
  async get_view(params, dbm, h){
    const {tapp_id} = params;
    if(!tapp_id){
      throw 'Invalid params for get_view action';
    }

    const db = await dbm.get(db_name);

    let rs = {
      count: 0,
      block: 0,
      time: 0,
    };
    
    _.each(db.all, (val, key)=>{
      if(_.startsWith(key, `${tapp_id}_`)){
        const now = Date.now();

        if(val.block && val.block >= rs.block){
          if(val.count > rs.count){
            rs.count = val.count;
            rs.block = val.block;
            rs.time = val.time;
          }

        }
        

      }
    });
    return rs;
  },

};

F.bbs = bbs;
F.notification = notification;

module.exports = F;