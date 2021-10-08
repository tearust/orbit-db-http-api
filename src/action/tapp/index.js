const _ = require('lodash');

const F = {
  async put_view(params, dbm, h){
    console.log(333, params);
    const {tapp_id, count, block} = params;
    if(!tapp_id || !_.isNumber(count)){
      throw 'Invalid params for put_views action';
    }

    // TODO put
    return 123;
  },
  async get_view(params, dbm, h){
    
  },

};



module.exports = F;