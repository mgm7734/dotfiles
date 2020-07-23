/** @return {DBCollection} dataset collection for give project- and dataset-code */
function data(projectCode, datasetCode='pilrhealth:mobile:survey_data', kind='data') {
    const proj = db.project.findOne({$or: [{ code: projectCode },
                                           { name: projectCode }]})
          || die('no project:', projectCode);
    const dataset = db.dataset.findOne({ code: datasetCode, project: proj._id})
          || die('no dataset:', datasetCode);
    return db[dataset._id + ':' + kind];
}

function addProjectOwner(projCode, username = 'mmendel') {
    var projId = db.project.findOne({code: projCode})._id
    var newOwnerId=db.user.findOne({username: username})._id
    0 == db.authorization.count({instanceId: projId, permission: {$exists: 0}, uid: newOwnerId})
        || die(username, 'is already an owner');

    var someOwnerAuth = db.authorization.findOne({instanceId: projId, permission: {$exists: 0}})
    printjson(someOwnerAuth.uid);
    db.authorization.find({instanceId: projId, uid: someOwnerAuth.uid}).forEach(auth => {
        auth.uid = newOwnerId;
        delete auth._id;
        db.authorization.insert(auth);
    });
}

function die(...strs) {
    throw strs.join(' ');
}

function unique(array) {
    return array.filter((el, ix) => array.indexOf(el) == ix)
}

DBCollection.prototype.get = function(id) { return this.findOne({_id: id}) }

/**
 * Chainable queries.
 *  Example:
 *    q('project', {code: /^r21/}).child('instrument').child('instrumentConfig')
 *    .child('emaOtsCardstack', 'configuration').prop('code')
q('project', {code: /^r21/}).child('instrument').find()
   */
function LazyQuery(collectionName, opts={}) {
    const query = opts.query || {};
    const stack = opts.stack || [];
    Object.assign(this, {
        collectionName, query,
        collection: db[collectionName],

        find(query = {}) {
            return this.collection.find({$and: [this.query, query]})
        },
        count() {  return this.collection.count(this.query) },
        id() { return this.prop('_id')},
        code() { return this.prop('code)') },
        at(ix) { return this.find().skip(ix).next() },
        prop(p) { return this.find().map(d=>d[p]) },
        id() { return this.prop('_id' )},
        code() { return this.prop('code')},

        /** Refine the current query */
        where(q) {
            return new LazyQuery(this.collectionName,
                                 Object.assign({}, opts, {query: { $and: [ this.query, q ] }}) );
        },

        /** Chain a subquery */
        q(cn, q) {
            return new LazyQuery(cn, { query: q, stack: [ this, ...stack ] })
        },
        child(childName, prop = null) {
            if (!prop) prop = this.collectionName;
            let parentIds = this.id();
            //return new LazyQuery(childName, {query: { [prop] : { $in: parentIds } }})
            return this.q(childName, { [prop] : { $in: parentIds } });
        },
        parent(parentName, prop = null) {
            if (!prop) prop = parentName;
            let parentIds = this.prop(prop);
            return new LazyQuery(parentName, {query: {_id: {$in: parentIds}}});
        }
    })
}
function q(collName, query) { return new LazyQuery(collName, {query}) }

q('project', {code: 'r21testproject'}).child('instrument').child('instrumentConfig').child('emaOtsCardstack', 'configuration').count()
