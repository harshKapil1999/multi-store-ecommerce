const { execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const requireBackend = createRequire(require('node:path').resolve('apps/backend/package.json'));
const mongoose = requireBackend('mongoose');
async function main() {
  const uri = execFileSync('gcloud', ['secrets','versions','access','latest','--secret=backend-mongodb-uri','--project=project-919e6199-4ea0-4c25-bb6'], { encoding: 'utf8' }).trim();
  await mongoose.connect(uri);
  const db=mongoose.connection.db;
  const stores=await db.collection('stores').find({}).toArray();
  for(const store of stores){
    const storeId=String(store._id);
    const products=await db.collection('products').find({storeId},{projection:{name:1,slug:1,description:1,stock:1,hasVariants:1,isActive:1}}).toArray();
    const counts={};for(const name of ['orders','transactions','categories','pages','billboards'])counts[name]=await db.collection(name).countDocuments({storeId});
    console.log(JSON.stringify({id:storeId,name:store.name,slug:store.slug,isActive:store.isActive,homeSections:store.homeSections,commerce:store.commerce,counts,products}));
  }
  console.log('User roles',await db.collection('users').aggregate([{$group:{_id:'$role',count:{$sum:1}}}]).toArray());
  console.log('OTP duplicates',await db.collection('otps').aggregate([{$group:{_id:{email:'$email',type:'$type'},count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray());
  console.log('Transactions per order duplicates',await db.collection('transactions').aggregate([{$group:{_id:'$orderId',count:{$sum:1}}},{$match:{count:{$gt:1}}},{$count:'count'}]).toArray());
  await mongoose.disconnect();
}
main().catch(e=>{console.error(e.name);process.exitCode=1});
