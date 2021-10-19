const _ = require('lodash');

const C = {
  DEFAULT_DB: [
    {
      name: 'tapp_views',
      type: 'keyvalue'
    }
  ],

  KEY: {}
};

_.each(C.DEFAULT_DB, (item)=>{
  _.set(C.KEY, item.name, item.name);
});


module.exports = C;
